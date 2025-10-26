"""
Vercel Serverless Function for Recipe Generation
Endpoint: POST /api/generate_recipes
"""
from http.server import BaseHTTPRequestHandler
import json
import os
import requests
from typing import List, Dict, Any
from datetime import datetime, timedelta
from dataclasses import dataclass, field


# Data Models
@dataclass
class InventoryItem:
    """Inventory item format for recipe generation"""
    id: str
    name: str
    quantity: float
    unit: str
    category: str = "Other"
    # Nutritional information per serving (all optional with defaults)
    calories_kcal: float = 0.0
    protein_g: float = 0.0
    carbohydrates_g: float = 0.0
    fiber_g: float = 0.0
    sugars_g: float = 0.0
    fat_g: float = 0.0
    sodium_mg: float = 0.0
    tags: List[str] = field(default_factory=list)
    allergens: List[str] = field(default_factory=list)


# Recipe Generator
class RecipeGenerator:
    """Simple recipe generator with Gemini AI"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"
        self.model_name = "gemini-pro"
    
    def generate_recipes(
        self,
        inventory: List[InventoryItem],
        dietary_filters: List[str],
        count: int,
        target_servings: int = None
    ) -> List[Dict[str, Any]]:
        """Generate recipes from inventory"""
        recipes = []
        used_inventory = {item.id: 0.0 for item in inventory}
        previous_titles = []  # Track previous recipe titles for uniqueness
        
        # Calculate servings per recipe if target_servings is specified
        servings_per_recipe = None
        if target_servings:
            servings_per_recipe = max(1, target_servings // count)  # Distribute servings across recipes
        
        for i in range(count):
            recipe = self._generate_single_recipe(
                inventory,
                dietary_filters,
                used_inventory,
                i + 1,
                previous_titles,
                servings_per_recipe  # This becomes target_servings in the function
            )
            
            if recipe:
                recipes.append(recipe)
                previous_titles.append(recipe.get('title', ''))
                # Update used inventory
                for depl in recipe.get('inventory_depletion_summary', []):
                    used_inventory[depl['id']] = used_inventory.get(depl['id'], 0) + depl['quantity']
            else:
                print(f"WARNING: Recipe {i+1} returned None")
        
        return recipes
    
    def _generate_single_recipe(
        self,
        inventory: List[InventoryItem],
        dietary_filters: List[str],
        used_inventory: Dict[str, float],
        recipe_number: int,
        previous_titles: List[str] = None,
        target_servings: int = None
    ) -> Dict[str, Any]:
        """Generate a single recipe"""
        
        if previous_titles is None:
            previous_titles = []
        
        # Build prompt
        prompt = self._build_prompt(inventory, dietary_filters, used_inventory, recipe_number, previous_titles, target_servings)
        
        try:
            # Call Gemini API
            url = f"{self.base_url}/{self.model_name}:generateContent"
            
            response = requests.post(
                f"{url}?key={self.api_key}",
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "temperature": 0.9,  # Increased for more variety
                        "maxOutputTokens": 4096,
                        "topP": 0.95,  # Add top-p sampling for more diversity
                        "topK": 40
                    }
                },
                timeout=60
            )
            
            print(f"Gemini API status: {response.status_code}")
            
            if response.status_code != 200:
                print(f"Gemini API error: {response.status_code} - {response.text[:200]}")
                return None
            
            result = response.json()
            
            # Extract text
            if 'candidates' in result and result['candidates']:
                candidate = result['candidates'][0]
                if 'content' in candidate:
                    content = candidate['content']
                    if 'parts' in content and content['parts']:
                        text = content['parts'][0]['text']
                        print(f"Gemini raw response: {text[:200]}...")  # Debug
                        
                        # Parse JSON
                        recipe_json = self._parse_json(text)
                        print(f"Parsed JSON title: {recipe_json.get('title', 'N/A') if recipe_json else 'None'}")
                        
                        recipe = self._to_recipe_dict(recipe_json, inventory)
                        print(f"Converted recipe: {'Success' if recipe else 'Failed'}")
                        
                        return recipe
            
            print(f"No valid response from Gemini. Result keys: {result.keys() if result else 'None'}")
            return None
            
        except Exception as e:
            print(f"Error generating recipe: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def _build_prompt(
        self,
        inventory: List[InventoryItem],
        dietary_filters: List[str],
        used_inventory: Dict[str, float],
        recipe_number: int,
        previous_titles: List[str] = None,
        target_servings: int = None
    ) -> str:
        """Build prompt for Gemini"""
        
        if previous_titles is None:
            previous_titles = []
        
        # Get available items
        available = []
        for item in inventory:
            used = used_inventory.get(item.id, 0)
            remaining = item.quantity - used
            if remaining > 0:
                item_data = {
                    "id": item.id,
                    "name": item.name,
                    "qty": remaining,
                    "unit": item.unit,
                    "nutrition": {
                        "calories_kcal": item.calories_kcal if hasattr(item, 'calories_kcal') else 0,
                        "protein_g": item.protein_g if hasattr(item, 'protein_g') else 0,
                        "carbohydrates_g": item.carbohydrates_g if hasattr(item, 'carbohydrates_g') else 0,
                        "fiber_g": item.fiber_g if hasattr(item, 'fiber_g') else 0,
                        "sugars_g": item.sugars_g if hasattr(item, 'sugars_g') else 0,
                        "fat_g": item.fat_g if hasattr(item, 'fat_g') else 0,
                        "sodium_mg": item.sodium_mg if hasattr(item, 'sodium_mg') else 0
                    }
                }
                available.append(item_data)
        
        filters_str = ", ".join(dietary_filters) if dietary_filters else "None"
        
        # Build previous recipes section
        previous_section = ""
        if previous_titles:
            previous_section = f"\n\nPREVIOUSLY GENERATED RECIPES (DO NOT REPEAT):\n"
            for idx, title in enumerate(previous_titles, 1):
                previous_section += f"{idx}. {title}\n"
            previous_section += "\n⚠️ IMPORTANT: Create a COMPLETELY DIFFERENT recipe with a different cuisine style, cooking method, or flavor profile."
        
        # Build servings requirement section
        servings_section = ""
        if target_servings:
            servings_section = f"\n\nTARGET SERVINGS: {target_servings} servings required"
            servings_section += f"\n⚠️ CRITICAL: Check if available ingredients are SUFFICIENT for {target_servings} servings."
            servings_section += f"\n- If ingredients are NOT enough, BE HONEST and reduce servings to what's possible with available inventory."
            servings_section += f"\n- Calculate portions carefully - don't claim you can make more servings than ingredients allow."
            servings_section += f"\n- It's better to make fewer servings with what's available than to lie about quantities."
        
        return f"""Create a delicious recipe from available ingredients.

AVAILABLE INGREDIENTS:
{json.dumps(available[:10], indent=2)}

DIETARY FILTERS: {filters_str}{previous_section}{servings_section}

REQUIREMENTS:
- This is Recipe #{recipe_number} - Make it UNIQUE and DIFFERENT from any previous recipes
- Use 2-5 ingredients that pair well together in a NEW combination
- Try a different cooking method, cuisine style, or flavor profile than previous recipes
- Simple, clear instructions (6th-grade reading level)
- Be creative and make it appetizing
- Return ingredient quantities as INTEGERS ONLY (no decimals)
- In nutrition_notes, include specific statistics that justify why something is nutritious (e.g., "20g protein per serving - meets 40% daily value")
- BE HONEST about servings - only claim what's realistically achievable with available ingredients

Return ONLY JSON (no markdown):
{{
  "title": "Recipe Name",
  "description": "One sentence description",
  "servings": 2,
  "prep_time_minutes": 20,
  "ingredients": [
    {{"inventory_item_id": "ITEM-001", "quantity": 200, "unit": "grams"}}
  ],
  "instructions": [
    "Step 1",
    "Step 2"
  ],
  "nutrition_notes": ["20g protein per serving - meets 40% daily value", "High in fiber with 8g per serving - 32% daily value"],
  "dietary_tags": ["Vegetarian"]
}}"""
    
    def _parse_json(self, text: str) -> Dict[str, Any]:
        """Parse JSON from Gemini response"""
        text = text.strip()
        
        # Remove markdown
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            parts = text.split("```")
            for part in parts:
                part = part.strip()
                if part.startswith("{"):
                    text = part
                    break
        
        return json.loads(text)
    
    def _to_recipe_dict(
        self,
        recipe_json: Dict[str, Any],
        inventory: List[InventoryItem]
    ) -> Dict[str, Any]:
        """Convert JSON to recipe dictionary"""
        
        ingredients = []
        depletion = []
        
        for ing_data in recipe_json.get("ingredients", []):
            item_id = ing_data.get("inventory_item_id")
            item = next((i for i in inventory if i.id == item_id), None)
            
            if item:
                # Convert to integer quantity
                quantity = int(ing_data.get("quantity", 1))
                
                ingredients.append({
                    "inventory_item_id": item_id,
                    "name": ing_data.get("item_name", item.name),
                    "quantity": quantity,
                    "unit": ing_data.get("unit", item.unit)
                })
                
                depletion.append({
                    "id": item_id,
                    "quantity": quantity,
                    "unit": ing_data.get("unit", item.unit)
                })
        
        return {
            "title": recipe_json.get("title", "Generated Recipe"),
            "description": recipe_json.get("description", "A nutritious meal"),
            "servings": recipe_json.get("servings", 2),
            "prep_time_minutes": recipe_json.get("prep_time_minutes", 20),
            "ingredients": ingredients,
            "instructions": recipe_json.get("instructions", []),
            "nutrition_notes": recipe_json.get("nutrition_notes", []),
            "dietary_tags": recipe_json.get("dietary_tags", []),
            "inventory_depletion_summary": depletion,
            "substitutions": []
        }


# Vercel Handler
class handler(BaseHTTPRequestHandler):
    """
    Vercel serverless function handler
    """
    
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-API-Key')
        self.end_headers()
        return
    
    def do_POST(self):
        """Handle POST requests"""
        try:
            # Check API key authentication
            api_key = os.getenv('API_KEY')
            if api_key:
                request_key = self.headers.get('X-API-Key') or self.headers.get('x-api-key')
                if not request_key or request_key != api_key:
                    self.send_response(401)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        'success': False,
                        'error': 'Unauthorized. Invalid or missing API key.'
                    }).encode())
                    return
            
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            body_str = self.rfile.read(content_length).decode('utf-8')
            body = json.loads(body_str) if body_str else {}
            
            inventory_data = body.get('inventory', [])
            dietary_filters = body.get('dietary_filters', [])
            count = body.get('count', 2)
            recipes = body.get('recipes', None)  # Total servings desired across all recipes
            
            # Validate input
            if not inventory_data:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'success': False,
                    'error': 'No inventory provided'
                }).encode())
                return
            
            # Get Google API key
            google_api_key = os.getenv('GOOGLE_API_KEY')
            if not google_api_key:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'success': False,
                    'error': 'Google API key not configured'
                }).encode())
                return
            
            # Helper function to safely parse numeric values
            def safe_float(value, default=0.0):
                """Safely convert value to float, handling None, empty strings, and invalid values"""
                if value is None or value == '':
                    return default
                try:
                    return float(value)
                except (ValueError, TypeError):
                    return default
            
            # Parse inventory data
            inventory = []
            for item_data in inventory_data:
                inventory.append(InventoryItem(
                    id=item_data.get('id', f"ITEM-{len(inventory)+1:03d}"),
                    name=item_data['name'],
                    quantity=item_data['quantity'],
                    unit=item_data['unit'],
                    category=item_data.get('category', 'Other'),
                    tags=item_data.get('tags', []),
                    allergens=item_data.get('allergens', []),
                    calories_kcal=safe_float(item_data.get('calories_kcal')),
                    protein_g=safe_float(item_data.get('protein_g')),
                    carbohydrates_g=safe_float(item_data.get('carbohydrates_g')),
                    fiber_g=safe_float(item_data.get('fiber_g')),
                    sugars_g=safe_float(item_data.get('sugars_g')),
                    fat_g=safe_float(item_data.get('fat_g')),
                    sodium_mg=safe_float(item_data.get('sodium_mg'))
                ))
            
            # Generate recipes
            generator = RecipeGenerator(api_key=google_api_key)
            
            # Debug: Check if API key exists
            if not google_api_key:
                raise ValueError("GOOGLE_API_KEY environment variable not set")
            
            generated_recipes = generator.generate_recipes(
                inventory=inventory,
                dietary_filters=dietary_filters,
                count=count,
                target_servings=recipes
            )
            
            # Debug: Log if no recipes generated
            response_data = {
                'success': True,
                'recipes': generated_recipes,
                'count': len(generated_recipes)
            }
            
            if not generated_recipes:
                print(f"WARNING: No recipes generated for {len(inventory)} items")
                response_data['debug'] = {
                    'inventory_count': len(inventory),
                    'requested_count': count,
                    'has_api_key': bool(google_api_key),
                    'message': 'No recipes were generated. Check Vercel logs for details.'
                }
            
            # Send success response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode())
            return
            
        except Exception as e:
            # Send error response with more details
            import traceback
            error_details = traceback.format_exc()
            print(f"ERROR in do_POST: {e}")
            print(error_details)
            
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': False,
                'error': str(e),
                'type': type(e).__name__,
                'details': error_details[:500]  # Truncate for safety
            }).encode())
            return

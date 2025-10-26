"""
Simple Recipe Generator with Gemini AI
Easy to integrate into any webapp - just import and use!
"""
import json
import os
import requests
from typing import List, Dict, Any, Optional, Callable
from datetime import datetime

from models import InventoryItem, Recipe, RecipeIngredient, InventoryDepletion


class RecipeGenerator:
    """
    Simple recipe generator with Gemini AI and progress callbacks
    
    Usage:
        # In your webapp
        generator = RecipeGenerator(api_key="your-key")
        
        recipes = generator.generate_recipes(
            inventory=inventory_items,
            dietary_filters=["vegetarian", "nut-free"],
            count=2,
            progress_callback=lambda msg, pct: print(f"{pct}%: {msg}")
        )
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize generator
        
        Args:
            api_key: Google API key (defaults to GOOGLE_API_KEY env var)
        """
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("Google API key required")
        
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"
        self.model_name = "gemini-2.5-flash"
    
    def generate_recipes(
        self,
        inventory: List[InventoryItem],
        dietary_filters: List[str] = None,
        count: int = 2,
        progress_callback: Optional[Callable[[str, int], None]] = None,
        target_servings: Optional[int] = None
    ) -> List[Recipe]:
        """
        Generate recipes with optional progress updates
        
        Args:
            inventory: List of InventoryItem objects
            dietary_filters: List of dietary restrictions
            count: Number of recipes to generate
            progress_callback: Optional function(message, percent) for progress
            target_servings: Optional total servings desired across all recipes
        
        Returns:
            List of Recipe objects
        """
        dietary_filters = dietary_filters or []
        recipes = []
        used_inventory = {item.id: 0.0 for item in inventory}
        previous_titles = []  # Track previous recipe titles for uniqueness
        
        # Calculate servings per recipe if target_servings is specified
        servings_per_recipe = None
        if target_servings and count > 0:
            servings_per_recipe = target_servings // count
        
        for i in range(count):
            if progress_callback:
                progress_callback(f"Generating recipe {i+1} of {count}...", int((i / count) * 100))
            
            recipe = self._generate_single_recipe(
                inventory,
                dietary_filters,
                used_inventory,
                i + 1,
                progress_callback,
                previous_titles,
                servings_per_recipe
            )
            
            if recipe:
                recipes.append(recipe)
                previous_titles.append(recipe.title)
                
                # Update used inventory
                for depl in recipe.inventory_depletion_summary:
                    used_inventory[depl.id] = used_inventory.get(depl.id, 0) + depl.quantity
        
        if progress_callback:
            progress_callback(f"Complete! Generated {len(recipes)} recipes", 100)
        
        return recipes
    
    def _generate_single_recipe(
        self,
        inventory: List[InventoryItem],
        dietary_filters: List[str],
        used_inventory: Dict[str, float],
        recipe_number: int,
        progress_callback: Optional[Callable[[str, int], None]] = None,
        previous_titles: List[str] = None,
        target_servings: Optional[int] = None
    ) -> Optional[Recipe]:
        """Generate a single recipe"""
        
        if previous_titles is None:
            previous_titles = []
        
        def update(msg, pct):
            if progress_callback:
                progress_callback(msg, pct)
        
        update("Building prompt...", 10)
        
        # Build prompt
        prompt = self._build_prompt(inventory, dietary_filters, used_inventory, recipe_number, previous_titles, target_servings)
        
        update("Calling Gemini AI...", 30)
        
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
                timeout=60  # Increased from 15s to handle slower API responses
            )
            
            update("Parsing response...", 70)
            
            if response.status_code != 200:
                print(f"API error: {response.status_code}")
                return None
            
            result = response.json()
            
            # Extract text
            if 'candidates' in result and result['candidates']:
                candidate = result['candidates'][0]
                if 'content' in candidate:
                    content = candidate['content']
                    if 'parts' in content and content['parts']:
                        text = content['parts'][0]['text']
                        
                        # Parse JSON
                        recipe_json = self._parse_json(text)
                        recipe = self._to_recipe_object(recipe_json, inventory)
                        
                        update("Recipe complete!", 100)
                        return recipe
            
            return None
            
        except Exception as e:
            print(f"Error: {e}")
            return None
    
    def _get_nutrition_value(self, item: InventoryItem, field: str, default: float = 0.0) -> float:
        """Safely get nutritional value from item, handling missing attributes and None values"""
        try:
            value = getattr(item, field, default)
            # Handle None, empty string, or non-numeric values
            if value is None or value == '':
                return default
            # Convert to float if it's a string number
            return float(value)
        except (ValueError, TypeError, AttributeError):
            return default
    
    def _build_prompt(
        self,
        inventory: List[InventoryItem],
        dietary_filters: List[str],
        used_inventory: Dict[str, float],
        recipe_number: int,
        previous_titles: List[str] = None,
        target_servings: Optional[int] = None
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
                # Safely extract nutritional information with fallbacks
                nutrition = {
                    "calories_kcal": self._get_nutrition_value(item, 'calories_kcal', 0),
                    "protein_g": self._get_nutrition_value(item, 'protein_g', 0),
                    "carbohydrates_g": self._get_nutrition_value(item, 'carbohydrates_g', 0),
                    "fiber_g": self._get_nutrition_value(item, 'fiber_g', 0),
                    "sugars_g": self._get_nutrition_value(item, 'sugars_g', 0),
                    "fat_g": self._get_nutrition_value(item, 'fat_g', 0),
                    "sodium_mg": self._get_nutrition_value(item, 'sodium_mg', 0)
                }
                
                item_data = {
                    "id": item.id,
                    "name": item.name,
                    "qty": remaining,
                    "unit": item.unit,
                    "nutrition": nutrition
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
        
        # Build target servings section
        servings_section = ""
        if target_servings:
            servings_section = f"\n\nTARGET SERVINGS: {target_servings}\n⚠️ IMPORTANT: The user wants THIS recipe to make {target_servings} servings. Check if there are enough ingredients for {target_servings} servings. If not, be HONEST and reduce the servings to what's realistic given the available quantities."
        
        return f"""Create a food pantry meal kit recipe.

INVENTORY:
{json.dumps(available[:8], indent=2)}

DIETARY FILTERS: {filters_str}{previous_section}{servings_section}

REQUIREMENTS:
- This is Recipe #{recipe_number} - Make it UNIQUE and DIFFERENT from any previous recipes
- Use 2-4 ingredients that pair well in a NEW combination
- Try a different cooking method, cuisine style, or flavor profile than previous recipes
- Simple instructions (6th-grade level)
- Return ingredient quantities as INTEGERS ONLY (no decimals like 2.0, use 2)
- In nutrition_notes, include specific statistics that justify why something is nutritious (e.g., "20g protein per serving - meets 40% daily value")

Return ONLY JSON (no markdown):
{{
  "title": "Recipe Name",
  "description": "One sentence",
  "servings": 2,
  "prep_time_minutes": 20,
  "ingredients": [
    {{"inventory_item_id": "ITEM-001", "quantity": 2, "unit": "cups"}}
  ],
  "instructions": [
    "Simple step 1",
    "Simple step 2"
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
    
    def _to_recipe_object(
        self,
        recipe_json: Dict[str, Any],
        inventory: List[InventoryItem]
    ) -> Recipe:
        """Convert JSON to Recipe object"""
        
        ingredients = []
        depletion = []
        
        for ing_data in recipe_json.get("ingredients", []):
            item_id = ing_data.get("inventory_item_id")
            item = next((i for i in inventory if i.id == item_id), None)
            
            if item:
                # Convert to integer quantity
                quantity = int(ing_data.get("quantity", 1))
                
                ingredients.append(RecipeIngredient(
                    inventory_item_id=item_id,
                    name=ing_data.get("item_name", item.name),
                    quantity=quantity,
                    unit=ing_data.get("unit", item.unit)
                ))
                
                depletion.append(InventoryDepletion(
                    id=item_id,
                    quantity=quantity,
                    unit=ing_data.get("unit", item.unit)
                ))
        
        return Recipe(
            title=recipe_json.get("title", "Generated Recipe"),
            description=recipe_json.get("description", "A nutritious meal"),
            servings=recipe_json.get("servings", 2),
            prep_time_minutes=recipe_json.get("prep_time_minutes", 20),
            ingredients=ingredients,
            instructions=recipe_json.get("instructions", []),
            equipment=[],  # Equipment no longer included
            nutrition_notes=recipe_json.get("nutrition_notes", []),
            dietary_tags=recipe_json.get("dietary_tags", []),
            inventory_depletion_summary=depletion,
            substitutions=[],
            packaging=""  # Packaging no longer included
        )


# Simple function for quick usage
def generate_recipes_simple(
    inventory_data: List[Dict[str, Any]],
    dietary_filters: List[str] = None,
    count: int = 2,
    api_key: str = None,
    progress_callback: Optional[Callable[[str, int], None]] = None
) -> List[Dict[str, Any]]:
    """
    Simple function to generate recipes from dict data
    
    Args:
        inventory_data: List of dicts with inventory items
        dietary_filters: List of dietary restrictions
        count: Number of recipes to generate
        api_key: Google API key (optional, uses env var if not provided)
        progress_callback: Optional function(message, percent)
    
    Returns:
        List of recipe dicts
    
    Example:
        recipes = generate_recipes_simple(
            inventory_data=[
                {
                    "id": "ITEM-001",
                    "name": "Brown Rice",
                    "category": "Grains",
                    "quantity": 5,
                    "unit": "cups"
                }
            ],
            dietary_filters=["vegetarian"],
            count=2,
            progress_callback=lambda msg, pct: print(f"{pct}%: {msg}")
        )
    """
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
            id=item_data['id'],
            name=item_data['name'],
            category=item_data.get('category', 'Other'),
            quantity=item_data['quantity'],
            unit=item_data['unit'],
            tags=item_data.get('tags', []),
            allergens=item_data.get('allergens', []),
            certifications=item_data.get('certifications', []),
            calories_kcal=safe_float(item_data.get('calories_kcal')),
            protein_g=safe_float(item_data.get('protein_g')),
            carbohydrates_g=safe_float(item_data.get('carbohydrates_g')),
            fiber_g=safe_float(item_data.get('fiber_g')),
            sugars_g=safe_float(item_data.get('sugars_g')),
            fat_g=safe_float(item_data.get('fat_g')),
            sodium_mg=safe_float(item_data.get('sodium_mg'))
        ))
    
    # Generate recipes
    generator = RecipeGenerator(api_key=api_key)
    recipes = generator.generate_recipes(
        inventory=inventory,
        dietary_filters=dietary_filters,
        count=count,
        progress_callback=progress_callback
    )
    
    # Convert to dicts
    return [recipe.to_dict() for recipe in recipes]


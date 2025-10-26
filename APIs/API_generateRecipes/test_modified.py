#!/usr/bin/env python3
"""
Test script for the modified Recipe Generation API with nutritional info
"""

import requests
import json

# Your deployed Vercel endpoint
API_URL = "https://api-generate-recipes.vercel.app/api/generate_recipes"

def test_modified_api():
    """Test the recipe generation with new nutritional fields"""
    
    # Sample inventory data with nutritional information
    inventory = [
        {
            "id": "ITEM-001",
            "name": "Brown Rice",
            "category": "Grains",
            "quantity": 5,
            "unit": "cups",
,
            "calories_kcal": 216,
            "protein_g": 5.0,
            "carbohydrates_g": 45.0,
            "fiber_g": 3.5,
            "sugars_g": 0.7,
            "fat_g": 1.8,
            "sodium_mg": 10
        },
        {
            "id": "ITEM-002",
            "name": "Black Beans",
            "category": "Legumes",
            "quantity": 2,
            "unit": "cans",
,
            "calories_kcal": 227,
            "protein_g": 15.2,
            "carbohydrates_g": 40.8,
            "fiber_g": 15.0,
            "sugars_g": 0.3,
            "fat_g": 0.9,
            "sodium_mg": 461
        }
    ]
    
    payload = {
        "inventory": inventory,
        "dietary_filters": ["vegetarian"],
        "count": 1
    }
    
    headers = {"Content-Type": "application/json"}
    
    print("🧪 Testing Modified Recipe Generation API...")
    print(f"📍 Endpoint: {API_URL}")
    print(f"📦 Inventory items: {len(inventory)}")
    print()
    
    try:
        # Call the deployed API
        print("⏳ Calling API (this may take 30-60 seconds)...")
        response = requests.post(API_URL, json=payload, headers=headers, timeout=90)
        
        if response.status_code != 200:
            print(f"❌ Error: Status {response.status_code}")
            print(response.text)
            return
        
        data = response.json()
        recipes = data.get('recipes', [])
        
        print()
        print("=" * 80)
        print("✅ SUCCESS! Recipe Generated:")
        print("=" * 80)
        
        # Display recipe in readable format
        for i, recipe in enumerate(recipes, 1):
            print(f"\n{'='*80}")
            print(f"Recipe #{i}: {recipe.get('title', 'Unknown')}")
            print(f"{'='*80}")
            print(f"\n📝 Description: {recipe.get('description', 'N/A')}")
            print(f"👥 Servings: {recipe.get('servings', 'N/A')}")
            print(f"⏱️  Prep Time: {recipe.get('prep_time_minutes', 'N/A')} minutes")
            
            print(f"\n🥘 Ingredients:")
            for ing in recipe.get('ingredients', []):
                print(f"   • {ing.get('name')}: {ing.get('quantity')} {ing.get('unit')}")
            
            print(f"\n📋 Instructions:")
            for idx, step in enumerate(recipe.get('instructions', []), 1):
                print(f"   {idx}. {step}")
            
            print(f"\n💚 Nutrition Notes:")
            for note in recipe.get('nutrition_notes', []):
                print(f"   • {note}")
            
            print(f"\n🏷️  Dietary Tags: {', '.join(recipe.get('dietary_tags', []))}")
            
            print(f"\n📊 Inventory Depletion:")
            for depl in recipe.get('inventory_depletion_summary', []):
                print(f"   • {depl.get('id')}: -{depl.get('quantity')} {depl.get('unit')}")
            
            # Check what we removed
            print(f"\n✓ Equipment section: {'REMOVED' if 'equipment' not in recipe else 'PRESENT'}")
            print(f"✓ Packaging info: {'REMOVED' if 'packaging' not in recipe else 'PRESENT'}")
            print(f"✓ Quantities are integers: {all(isinstance(ing['quantity'], int) for ing in recipe.get('ingredients', []))}")
        
        print("\n" + "=" * 80)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_modified_api()


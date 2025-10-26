#!/usr/bin/env python3
"""
Test with different ingredients - Chicken, Vegetables, and Pasta
"""

import requests
import json

API_URL = "https://api-generate-recipes.vercel.app/api/generate_recipes"

def test_different_ingredients():
    """Test with a different set of ingredients"""
    
    # Different inventory - Chicken, Vegetables, Pasta
    inventory = [
        {
            "id": "ITEM-101",
            "name": "Chicken Breast",
            "category": "Protein",
            "quantity": 3,
            "unit": "pieces",
            "calories_kcal": 165,
            "protein_g": 31.0,
            "carbohydrates_g": 0.0,
            "fiber_g": 0.0,
            "sugars_g": 0.0,
            "fat_g": 3.6,
            "sodium_mg": 74
        },
        {
            "id": "ITEM-102",
            "name": "Broccoli",
            "category": "Vegetables",
            "quantity": 2,
            "unit": "cups",
            "calories_kcal": 31,
            "protein_g": 2.5,
            "carbohydrates_g": 6.0,
            "fiber_g": 2.4,
            "sugars_g": 1.5,
            "fat_g": 0.3,
            "sodium_mg": 30
        },
        {
            "id": "ITEM-103",
            "name": "Whole Wheat Pasta",
            "category": "Grains",
            "quantity": 4,
            "unit": "cups",
            "calories_kcal": 174,
            "protein_g": 7.5,
            "carbohydrates_g": 37.0,
            "fiber_g": 6.3,
            "sugars_g": 0.8,
            "fat_g": 0.8,
            "sodium_mg": 4
        },
        {
            "id": "ITEM-104",
            "name": "Cherry Tomatoes",
            "category": "Vegetables",
            "quantity": 10,
            "unit": "pieces",
            "calories_kcal": 27,
            "protein_g": 1.3,
            "carbohydrates_g": 5.8,
            "fiber_g": 1.8,
            "sugars_g": 3.9,
            "fat_g": 0.3,
            "sodium_mg": 7
        }
    ]
    
    payload = {
        "inventory": inventory,
        "dietary_filters": [],
        "count": 1
    }
    
    headers = {"Content-Type": "application/json"}
    
    print("🧪 Testing Recipe API with Different Ingredients")
    print("=" * 80)
    print(f"📍 Endpoint: {API_URL}")
    print(f"📦 Inventory:")
    for item in inventory:
        print(f"   • {item['name']} ({item['quantity']} {item['unit']})")
    print()
    
    try:
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
        
        for i, recipe in enumerate(recipes, 1):
            print(f"\n{'='*80}")
            print(f"Recipe #{i}: {recipe.get('title', 'Unknown')}")
            print(f"{'='*80}")
            print(f"\n📝 Description: {recipe.get('description', 'N/A')}")
            print(f"👥 Servings: {recipe.get('servings', 'N/A')}")
            print(f"⏱️  Prep Time: {recipe.get('prep_time_minutes', 'N/A')} minutes")
            
            print(f"\n🥘 Ingredients:")
            for ing in recipe.get('ingredients', []):
                qty_type = type(ing.get('quantity')).__name__
                print(f"   • {ing.get('name')}: {ing.get('quantity')} {ing.get('unit')} (type: {qty_type})")
            
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
            
            print(f"\n✅ Validation Checks:")
            print(f"   • Equipment section removed: {'✓' if 'equipment' not in recipe else '✗ PRESENT'}")
            print(f"   • Packaging info removed: {'✓' if 'packaging' not in recipe else '✗ PRESENT'}")
            print(f"   • All quantities are integers: {'✓' if all(isinstance(ing['quantity'], int) for ing in recipe.get('ingredients', [])) else '✗ FAIL'}")
            print(f"   • Nutrition notes have details: {'✓' if any(len(note) > 30 for note in recipe.get('nutrition_notes', [])) else '✗ TOO SHORT'}")
        
        print("\n" + "=" * 80)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_different_ingredients()


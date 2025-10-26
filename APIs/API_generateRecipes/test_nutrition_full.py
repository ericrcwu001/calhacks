"""
Detailed test for Full Nutritional Data
Shows complete API request and response
"""
import requests
import json

API_URL = "https://api-generate-recipes.vercel.app/api/generate_recipes"

print("="*80)
print("FULL NUTRITIONAL DATA TEST")
print("="*80)

payload = {
    "inventory": [
        {
            "name": "Salmon",
            "quantity": 300,
            "unit": "grams",
            "calories_kcal": 206,
            "protein_g": 22.1,
            "carbohydrates_g": 0,
            "fiber_g": 0,
            "sugars_g": 0,
            "fat_g": 12.4,
            "sodium_mg": 59
        },
        {
            "name": "Quinoa",
            "quantity": 200,
            "unit": "grams",
            "calories_kcal": 120,
            "protein_g": 4.4,
            "carbohydrates_g": 21.3,
            "fiber_g": 2.8,
            "sugars_g": 0.9,
            "fat_g": 1.9,
            "sodium_mg": 7
        },
        {
            "name": "Spinach",
            "quantity": 150,
            "unit": "grams",
            "calories_kcal": 23,
            "protein_g": 2.9,
            "carbohydrates_g": 3.6,
            "fiber_g": 2.2,
            "sugars_g": 0.4,
            "fat_g": 0.4,
            "sodium_mg": 79
        }
    ],
    "dietary_filters": [],
    "count": 1
}

print("\n📤 REQUEST PAYLOAD:")
print(json.dumps(payload, indent=2))

print("\n⏳ Sending request to API...")
print(f"Endpoint: {API_URL}")

try:
    response = requests.post(API_URL, json=payload, timeout=90)
    
    print(f"\n📥 RESPONSE STATUS: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        
        print("\n✅ SUCCESS!")
        print(f"Recipes Generated: {data.get('count', 0)}")
        
        print("\n" + "="*80)
        print("FULL API RESPONSE:")
        print("="*80)
        print(json.dumps(data, indent=2))
        
        if data.get('recipes'):
            recipe = data['recipes'][0]
            
            print("\n" + "="*80)
            print("RECIPE DETAILS:")
            print("="*80)
            print(f"\n📖 Title: {recipe.get('title')}")
            print(f"📝 Description: {recipe.get('description')}")
            print(f"🍽️  Servings: {recipe.get('servings')}")
            print(f"⏱️  Prep Time: {recipe.get('prep_time_minutes')} minutes")
            
            print(f"\n🥘 INGREDIENTS ({len(recipe.get('ingredients', []))}):")
            for i, ing in enumerate(recipe.get('ingredients', []), 1):
                print(f"  {i}. {ing['name']}: {ing['quantity']} {ing['unit']}")
            
            print(f"\n📋 INSTRUCTIONS ({len(recipe.get('instructions', []))}):")
            for i, step in enumerate(recipe.get('instructions', []), 1):
                print(f"  {i}. {step}")
            
            print(f"\n💪 NUTRITION NOTES ({len(recipe.get('nutrition_notes', []))}):")
            for i, note in enumerate(recipe.get('nutrition_notes', []), 1):
                print(f"  {i}. {note}")
            
            print(f"\n🏷️  DIETARY TAGS ({len(recipe.get('dietary_tags', []))}):")
            if recipe.get('dietary_tags'):
                for tag in recipe.get('dietary_tags', []):
                    print(f"  • {tag}")
            else:
                print("  (none)")
            
            print(f"\n📦 INVENTORY USED ({len(recipe.get('inventory_depletion_summary', []))}):")
            for item in recipe.get('inventory_depletion_summary', []):
                print(f"  • {item['id']}: {item['quantity']} {item['unit']}")
            
            if recipe.get('substitutions'):
                print(f"\n🔄 SUBSTITUTIONS ({len(recipe.get('substitutions', []))}):")
                for sub in recipe.get('substitutions', []):
                    print(f"  • {sub}")
    else:
        print(f"\n❌ ERROR: {response.status_code}")
        print(response.text)
        
except Exception as e:
    print(f"\n❌ EXCEPTION: {e}")

print("\n" + "="*80)


"""
Test target_servings parameter
"""
import requests
import json

API_URL = "https://api-generate-recipes.vercel.app/api/generate_recipes"

print("="*80)
print("TESTING TARGET_SERVINGS PARAMETER")
print("="*80)

# Test 1: Request 50 servings with limited ingredients
print("\n📋 TEST 1: Request 50 servings with limited ingredients")
print("-" * 80)

payload = {
    "inventory": [
        {
            "name": "Chicken Breast",
            "quantity": 2000,
            "unit": "grams"
        },
        {
            "name": "Rice",
            "quantity": 1500,
            "unit": "grams"
        },
        {
            "name": "Broccoli",
            "quantity": 800,
            "unit": "grams"
        }
    ],
    "count": 2,
    "recipes": 50
}

print(f"📤 Requesting: {payload['count']} recipes with target of {payload['recipes']} total servings")
print(f"📦 Inventory: {payload['inventory'][0]['quantity']}g chicken, {payload['inventory'][1]['quantity']}g rice, {payload['inventory'][2]['quantity']}g broccoli")

try:
    response = requests.post(API_URL, json=payload, timeout=90)
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n✅ Success! Generated {len(data['recipes'])} recipe(s)")
        
        total_servings = 0
        for i, recipe in enumerate(data['recipes'], 1):
            servings = recipe['servings']
            total_servings += servings
            print(f"\n🍽️  Recipe {i}: {recipe['title']}")
            print(f"   Servings: {servings}")
            print(f"   Prep Time: {recipe['prep_time_minutes']} min")
            print(f"   Ingredients Used: {len(recipe['ingredients'])}")
            
        print(f"\n📊 RESULTS:")
        print(f"   Requested: {payload['recipes']} servings")
        print(f"   Generated: {total_servings} servings")
        print(f"   Status: {'✅ MATCH' if total_servings >= payload['recipes'] * 0.8 else '⚠️  REDUCED (not enough ingredients)'}")
        
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)
        
except Exception as e:
    print(f"❌ Exception: {e}")

# Test 2: Request with NO recipes parameter (should use default)
print("\n\n📋 TEST 2: Without 'recipes' parameter (default behavior)")
print("-" * 80)

payload2 = {
    "inventory": [
        {
            "name": "Pasta",
            "quantity": 400,
            "unit": "grams"
        },
        {
            "name": "Tomato Sauce",
            "quantity": 300,
            "unit": "ml"
        }
    ],
    "count": 1
}

print(f"📤 Requesting: {payload2['count']} recipe without 'recipes' parameter")

try:
    response = requests.post(API_URL, json=payload2, timeout=90)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Success! Recipe: {data['recipes'][0]['title']}")
        print(f"   Servings: {data['recipes'][0]['servings']} (auto-determined by LLM)")
    else:
        print(f"❌ Error: {response.status_code}")
        
except Exception as e:
    print(f"❌ Exception: {e}")

print("\n" + "="*80)


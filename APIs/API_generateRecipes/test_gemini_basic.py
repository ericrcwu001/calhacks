#!/usr/bin/env python3
"""
Simple test to verify Gemini API is working
"""
import requests
import json

API_URL = "https://api-generate-recipes.vercel.app/api/generate_recipes"

print("=" * 80)
print("🔍 GEMINI API BASIC TEST")
print("=" * 80)

# Test 1: Absolute minimal request
print("\n📋 TEST 1: Minimal Request (1 ingredient, 1 recipe)")
print("-" * 80)

payload1 = {
    "inventory": [
        {
            "name": "Pasta",
            "quantity": 200,
            "unit": "grams"
        }
    ],
    "count": 1
}

print(f"📤 Request: {json.dumps(payload1, indent=2)}")
print("\n⏳ Sending request...")

try:
    response = requests.post(API_URL, json=payload1, timeout=90)
    print(f"✅ Status: {response.status_code}")
    
    result = response.json()
    print(f"📥 Response: {json.dumps(result, indent=2)}")
    
    if result.get('success') and result.get('recipes'):
        print(f"\n✅ SUCCESS! Generated {len(result['recipes'])} recipe(s)")
        print(f"   Recipe: {result['recipes'][0].get('title', 'N/A')}")
    else:
        print(f"\n❌ FAIL: No recipes returned")
        print(f"   Success: {result.get('success')}")
        print(f"   Recipe count: {len(result.get('recipes', []))}")
        
except Exception as e:
    print(f"❌ Exception: {e}")
    import traceback
    traceback.print_exc()

# Test 2: Two simple ingredients
print("\n\n📋 TEST 2: Two Ingredients")
print("-" * 80)

payload2 = {
    "inventory": [
        {
            "name": "Rice",
            "quantity": 300,
            "unit": "grams"
        },
        {
            "name": "Chicken",
            "quantity": 250,
            "unit": "grams"
        }
    ],
    "count": 1
}

print(f"📤 Request: Rice + Chicken")
print("\n⏳ Sending request...")

try:
    response = requests.post(API_URL, json=payload2, timeout=90)
    print(f"✅ Status: {response.status_code}")
    
    result = response.json()
    
    if result.get('success') and result.get('recipes'):
        print(f"\n✅ SUCCESS! Generated {len(result['recipes'])} recipe(s)")
        recipe = result['recipes'][0]
        print(f"   Title: {recipe.get('title', 'N/A')}")
        print(f"   Servings: {recipe.get('servings', 'N/A')}")
        print(f"   Prep Time: {recipe.get('prep_time_minutes', 'N/A')} min")
    else:
        print(f"\n❌ FAIL: No recipes returned")
        print(f"   Full response: {json.dumps(result, indent=2)}")
        
except Exception as e:
    print(f"❌ Exception: {e}")

print("\n" + "=" * 80)



"""
Test edge cases for missing nutritional data
Demonstrates that the API handles missing, null, or invalid nutritional values gracefully
"""
import requests
import json

# API endpoint
API_URL = "https://api-generate-recipes.vercel.app/api/generate_recipes"

def test_missing_nutrition_fields():
    """Test with completely missing nutritional fields"""
    print("\n" + "="*80)
    print("TEST 1: Missing Nutritional Fields")
    print("="*80)
    
    payload = {
        "inventory": [
            {
                "name": "Chicken Breast",
                "quantity": 500,
                "unit": "grams"
                # No nutritional data at all
            },
            {
                "name": "Rice",
                "quantity": 300,
                "unit": "grams"
                # No nutritional data at all
            }
        ],
        "dietary_filters": [],
        "count": 1
    }
    
    print(f"📦 Request Payload:")
    print(json.dumps(payload, indent=2))
    
    try:
        response = requests.post(API_URL, json=payload, timeout=90)
        print(f"\n✅ Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Recipes Generated: {data.get('count', 0)}")
            if data.get('recipes'):
                recipe = data['recipes'][0]
                print(f"✅ Recipe Title: {recipe['title']}")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Exception: {e}")

def test_null_nutrition_values():
    """Test with null nutritional values"""
    print("\n" + "="*80)
    print("TEST 2: Null Nutritional Values")
    print("="*80)
    
    payload = {
        "inventory": [
            {
                "name": "Tofu",
                "quantity": 400,
                "unit": "grams",
                "calories_kcal": None,
                "protein_g": None,
                "carbohydrates_g": None,
                "fiber_g": None,
                "sugars_g": None,
                "fat_g": None,
                "sodium_mg": None
            },
            {
                "name": "Broccoli",
                "quantity": 200,
                "unit": "grams",
                "calories_kcal": None,
                "protein_g": None
            }
        ],
        "dietary_filters": ["vegan"],
        "count": 1
    }
    
    print(f"📦 Request Payload:")
    print(json.dumps(payload, indent=2))
    
    try:
        response = requests.post(API_URL, json=payload, timeout=90)
        print(f"\n✅ Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Recipes Generated: {data.get('count', 0)}")
            if data.get('recipes'):
                recipe = data['recipes'][0]
                print(f"✅ Recipe Title: {recipe['title']}")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Exception: {e}")

def test_mixed_nutrition_data():
    """Test with mixed nutritional data (some present, some missing)"""
    print("\n" + "="*80)
    print("TEST 3: Mixed Nutritional Data")
    print("="*80)
    
    payload = {
        "inventory": [
            {
                "name": "Salmon",
                "quantity": 300,
                "unit": "grams",
                "calories_kcal": 206,
                "protein_g": 22.1,
                # Missing carbs, fiber, sugars
                "fat_g": 12.4
                # Missing sodium
            },
            {
                "name": "Quinoa",
                "quantity": 200,
                "unit": "grams",
                # Only some fields present
                "protein_g": 8.1,
                "carbohydrates_g": 39.4,
                "fiber_g": 5.2
            },
            {
                "name": "Spinach",
                "quantity": 100,
                "unit": "grams"
                # No nutritional data
            }
        ],
        "dietary_filters": [],
        "count": 1
    }
    
    print(f"📦 Request Payload:")
    print(json.dumps(payload, indent=2))
    
    try:
        response = requests.post(API_URL, json=payload, timeout=90)
        print(f"\n✅ Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Recipes Generated: {data.get('count', 0)}")
            if data.get('recipes'):
                recipe = data['recipes'][0]
                print(f"✅ Recipe Title: {recipe['title']}")
                print(f"✅ Ingredients Used: {len(recipe['ingredients'])}")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Exception: {e}")

def test_invalid_nutrition_values():
    """Test with invalid nutritional values (strings, empty strings)"""
    print("\n" + "="*80)
    print("TEST 4: Invalid Nutritional Values")
    print("="*80)
    
    payload = {
        "inventory": [
            {
                "name": "Pasta",
                "quantity": 400,
                "unit": "grams",
                "calories_kcal": "",  # Empty string
                "protein_g": "invalid",  # Invalid string
                "carbohydrates_g": 75.2  # Valid
            },
            {
                "name": "Tomato Sauce",
                "quantity": 200,
                "unit": "ml",
                "calories_kcal": "50"  # String number (should convert)
            }
        ],
        "dietary_filters": ["vegetarian"],
        "count": 1
    }
    
    print(f"📦 Request Payload:")
    print(json.dumps(payload, indent=2))
    
    try:
        response = requests.post(API_URL, json=payload, timeout=90)
        print(f"\n✅ Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Recipes Generated: {data.get('count', 0)}")
            if data.get('recipes'):
                recipe = data['recipes'][0]
                print(f"✅ Recipe Title: {recipe['title']}")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    print("\n🧪 TESTING EDGE CASES FOR NUTRITIONAL DATA")
    print("Testing API's ability to handle missing, null, and invalid nutritional values")
    print("="*80)
    
    test_missing_nutrition_fields()
    test_null_nutrition_values()
    test_mixed_nutrition_data()
    test_invalid_nutrition_values()
    
    print("\n" + "="*80)
    print("✅ ALL EDGE CASE TESTS COMPLETED")
    print("="*80)


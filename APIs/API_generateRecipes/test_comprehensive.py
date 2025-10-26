"""
Comprehensive Test Suite for Recipe Generation API
Tests basic functionality, edge cases, dietary filters, and error handling
"""
import requests
import json
import time

# API endpoint
API_URL = "https://api-generate-recipes.vercel.app/api/generate_recipes"

class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.tests = []
    
    def add_result(self, name, passed, message=""):
        self.tests.append({
            "name": name,
            "passed": passed,
            "message": message
        })
        if passed:
            self.passed += 1
        else:
            self.failed += 1
    
    def print_summary(self):
        print("\n" + "="*80)
        print("TEST SUMMARY")
        print("="*80)
        for test in self.tests:
            status = "✅ PASS" if test["passed"] else "❌ FAIL"
            print(f"{status} - {test['name']}")
            if test["message"]:
                print(f"      {test['message']}")
        print("="*80)
        print(f"Total: {self.passed + self.failed} | Passed: {self.passed} | Failed: {self.failed}")
        print("="*80)

results = TestResults()

def test_basic_functionality():
    """Test 1: Basic recipe generation with minimal data"""
    print("\n🧪 TEST 1: Basic Recipe Generation")
    print("-" * 80)
    
    payload = {
        "inventory": [
            {
                "name": "Chicken Breast",
                "quantity": 500,
                "unit": "grams"
            },
            {
                "name": "Rice",
                "quantity": 300,
                "unit": "grams"
            },
            {
                "name": "Broccoli",
                "quantity": 200,
                "unit": "grams"
            }
        ],
        "dietary_filters": [],
        "count": 1
    }
    
    try:
        response = requests.post(API_URL, json=payload, timeout=90)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and len(data.get('recipes', [])) > 0:
                recipe = data['recipes'][0]
                print(f"✅ Recipe Generated: {recipe.get('title')}")
                print(f"✅ Ingredients: {len(recipe.get('ingredients', []))}")
                print(f"✅ Instructions: {len(recipe.get('instructions', []))}")
                results.add_result("Basic Functionality", True, f"Generated: {recipe.get('title')}")
            else:
                print(f"❌ Invalid response structure")
                results.add_result("Basic Functionality", False, "Invalid response structure")
        else:
            print(f"❌ Status Code: {response.status_code}")
            results.add_result("Basic Functionality", False, f"Status: {response.status_code}")
    except Exception as e:
        print(f"❌ Exception: {e}")
        results.add_result("Basic Functionality", False, str(e))

def test_missing_nutrition_data():
    """Test 2: Missing all nutritional data"""
    print("\n🧪 TEST 2: Missing Nutritional Data")
    print("-" * 80)
    
    payload = {
        "inventory": [
            {"name": "Tofu", "quantity": 400, "unit": "grams"},
            {"name": "Soy Sauce", "quantity": 50, "unit": "ml"},
            {"name": "Ginger", "quantity": 30, "unit": "grams"}
        ],
        "count": 1
    }
    
    try:
        response = requests.post(API_URL, json=payload, timeout=90)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print(f"✅ API handled missing nutrition data gracefully")
                results.add_result("Missing Nutrition Data", True)
            else:
                print(f"❌ API returned success=false")
                results.add_result("Missing Nutrition Data", False, "success=false")
        else:
            print(f"❌ Status Code: {response.status_code}")
            results.add_result("Missing Nutrition Data", False, f"Status: {response.status_code}")
    except Exception as e:
        print(f"❌ Exception: {e}")
        results.add_result("Missing Nutrition Data", False, str(e))

def test_null_nutrition_values():
    """Test 3: Null nutritional values"""
    print("\n🧪 TEST 3: Null Nutritional Values")
    print("-" * 80)
    
    payload = {
        "inventory": [
            {
                "name": "Pasta",
                "quantity": 400,
                "unit": "grams",
                "calories_kcal": None,
                "protein_g": None
            }
        ],
        "count": 1
    }
    
    try:
        response = requests.post(API_URL, json=payload, timeout=90)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print(f"✅ API handled null values gracefully")
                results.add_result("Null Nutritional Values", True)
            else:
                results.add_result("Null Nutritional Values", False, "success=false")
        else:
            print(f"❌ Status Code: {response.status_code}")
            results.add_result("Null Nutritional Values", False, f"Status: {response.status_code}")
    except Exception as e:
        print(f"❌ Exception: {e}")
        results.add_result("Null Nutritional Values", False, str(e))

def test_with_full_nutrition():
    """Test 4: Complete nutritional data"""
    print("\n🧪 TEST 4: Full Nutritional Data")
    print("-" * 80)
    
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
            }
        ],
        "count": 1
    }
    
    try:
        response = requests.post(API_URL, json=payload, timeout=90)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                recipe = data['recipes'][0]
                nutrition_notes = recipe.get('nutrition_notes', [])
                print(f"✅ Recipe with full nutrition: {recipe.get('title')}")
                print(f"✅ Nutrition notes: {len(nutrition_notes)}")
                results.add_result("Full Nutritional Data", True, f"{len(nutrition_notes)} nutrition notes")
            else:
                results.add_result("Full Nutritional Data", False, "success=false")
        else:
            results.add_result("Full Nutritional Data", False, f"Status: {response.status_code}")
    except Exception as e:
        results.add_result("Full Nutritional Data", False, str(e))

def test_vegetarian_filter():
    """Test 5: Vegetarian dietary filter"""
    print("\n🧪 TEST 5: Vegetarian Dietary Filter")
    print("-" * 80)
    
    payload = {
        "inventory": [
            {"name": "Chickpeas", "quantity": 400, "unit": "grams"},
            {"name": "Spinach", "quantity": 200, "unit": "grams"},
            {"name": "Tomatoes", "quantity": 300, "unit": "grams"},
            {"name": "Olive Oil", "quantity": 50, "unit": "ml"}
        ],
        "dietary_filters": ["vegetarian"],
        "count": 1
    }
    
    try:
        response = requests.post(API_URL, json=payload, timeout=90)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                recipe = data['recipes'][0]
                dietary_tags = recipe.get('dietary_tags', [])
                print(f"✅ Vegetarian recipe: {recipe.get('title')}")
                print(f"✅ Dietary tags: {', '.join(dietary_tags)}")
                results.add_result("Vegetarian Filter", True, f"Tags: {', '.join(dietary_tags)}")
            else:
                results.add_result("Vegetarian Filter", False, "success=false")
        else:
            results.add_result("Vegetarian Filter", False, f"Status: {response.status_code}")
    except Exception as e:
        results.add_result("Vegetarian Filter", False, str(e))

def test_vegan_filter():
    """Test 6: Vegan dietary filter"""
    print("\n🧪 TEST 6: Vegan Dietary Filter")
    print("-" * 80)
    
    payload = {
        "inventory": [
            {"name": "Lentils", "quantity": 300, "unit": "grams"},
            {"name": "Carrots", "quantity": 200, "unit": "grams"},
            {"name": "Onions", "quantity": 150, "unit": "grams"}
        ],
        "dietary_filters": ["vegan"],
        "count": 1
    }
    
    try:
        response = requests.post(API_URL, json=payload, timeout=90)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print(f"✅ Vegan recipe generated")
                results.add_result("Vegan Filter", True)
            else:
                results.add_result("Vegan Filter", False, "success=false")
        else:
            results.add_result("Vegan Filter", False, f"Status: {response.status_code}")
    except Exception as e:
        results.add_result("Vegan Filter", False, str(e))

def test_multiple_recipes():
    """Test 7: Generate multiple recipes"""
    print("\n🧪 TEST 7: Multiple Recipe Generation")
    print("-" * 80)
    
    payload = {
        "inventory": [
            {"name": "Ground Beef", "quantity": 500, "unit": "grams"},
            {"name": "Pasta", "quantity": 400, "unit": "grams"},
            {"name": "Tomato Sauce", "quantity": 500, "unit": "ml"},
            {"name": "Cheese", "quantity": 200, "unit": "grams"},
            {"name": "Onions", "quantity": 150, "unit": "grams"}
        ],
        "count": 2
    }
    
    try:
        response = requests.post(API_URL, json=payload, timeout=90)
        
        if response.status_code == 200:
            data = response.json()
            recipe_count = len(data.get('recipes', []))
            if recipe_count >= 2:
                print(f"✅ Generated {recipe_count} recipes:")
                for i, recipe in enumerate(data['recipes'], 1):
                    print(f"   {i}. {recipe.get('title')}")
                results.add_result("Multiple Recipes", True, f"Generated {recipe_count} recipes")
            else:
                print(f"❌ Expected 2+ recipes, got {recipe_count}")
                results.add_result("Multiple Recipes", False, f"Only {recipe_count} recipes")
        else:
            results.add_result("Multiple Recipes", False, f"Status: {response.status_code}")
    except Exception as e:
        results.add_result("Multiple Recipes", False, str(e))

def test_empty_inventory_error():
    """Test 8: Error handling - empty inventory"""
    print("\n🧪 TEST 8: Error Handling - Empty Inventory")
    print("-" * 80)
    
    payload = {
        "inventory": [],
        "count": 1
    }
    
    try:
        response = requests.post(API_URL, json=payload, timeout=90)
        
        if response.status_code == 400:
            print(f"✅ Correctly returned 400 for empty inventory")
            results.add_result("Empty Inventory Error", True, "400 Bad Request")
        else:
            print(f"❌ Expected 400, got {response.status_code}")
            results.add_result("Empty Inventory Error", False, f"Got {response.status_code}")
    except Exception as e:
        results.add_result("Empty Inventory Error", False, str(e))

def test_mixed_nutrition_data():
    """Test 9: Mixed/partial nutritional data"""
    print("\n🧪 TEST 9: Partial Nutritional Data")
    print("-" * 80)
    
    payload = {
        "inventory": [
            {
                "name": "Chicken Thighs",
                "quantity": 400,
                "unit": "grams",
                "calories_kcal": 209,
                "protein_g": 26.0
                # Missing other nutrition fields
            },
            {
                "name": "Sweet Potato",
                "quantity": 300,
                "unit": "grams",
                # Only some fields
                "carbohydrates_g": 20.1,
                "fiber_g": 3.0
            },
            {
                "name": "Green Beans",
                "quantity": 200,
                "unit": "grams"
                # No nutrition data
            }
        ],
        "count": 1
    }
    
    try:
        response = requests.post(API_URL, json=payload, timeout=90)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print(f"✅ Handled mixed nutrition data gracefully")
                results.add_result("Partial Nutrition Data", True)
            else:
                results.add_result("Partial Nutrition Data", False, "success=false")
        else:
            results.add_result("Partial Nutrition Data", False, f"Status: {response.status_code}")
    except Exception as e:
        results.add_result("Partial Nutrition Data", False, str(e))

def test_gluten_free_filter():
    """Test 10: Gluten-free dietary filter"""
    print("\n🧪 TEST 10: Gluten-Free Dietary Filter")
    print("-" * 80)
    
    payload = {
        "inventory": [
            {"name": "Rice", "quantity": 300, "unit": "grams"},
            {"name": "Eggs", "quantity": 4, "unit": "pieces"},
            {"name": "Bell Peppers", "quantity": 200, "unit": "grams"}
        ],
        "dietary_filters": ["gluten-free"],
        "count": 1
    }
    
    try:
        response = requests.post(API_URL, json=payload, timeout=90)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print(f"✅ Gluten-free recipe generated")
                results.add_result("Gluten-Free Filter", True)
            else:
                results.add_result("Gluten-Free Filter", False, "success=false")
        else:
            results.add_result("Gluten-Free Filter", False, f"Status: {response.status_code}")
    except Exception as e:
        results.add_result("Gluten-Free Filter", False, str(e))

def run_all_tests():
    """Run all tests with delays between them"""
    print("\n" + "="*80)
    print("🚀 STARTING COMPREHENSIVE API TEST SUITE")
    print("="*80)
    print(f"API Endpoint: {API_URL}")
    print(f"Total Tests: 10")
    print("="*80)
    
    tests = [
        test_basic_functionality,
        test_missing_nutrition_data,
        test_null_nutrition_values,
        test_with_full_nutrition,
        test_vegetarian_filter,
        test_vegan_filter,
        test_multiple_recipes,
        test_empty_inventory_error,
        test_mixed_nutrition_data,
        test_gluten_free_filter
    ]
    
    for i, test in enumerate(tests, 1):
        try:
            test()
        except Exception as e:
            print(f"❌ Test crashed: {e}")
            results.add_result(test.__doc__.split(':')[1].strip(), False, f"Crashed: {e}")
        
        # Add delay between tests to avoid rate limiting
        if i < len(tests):
            print(f"\n⏳ Waiting 3 seconds before next test...")
            time.sleep(3)
    
    # Print final summary
    results.print_summary()

if __name__ == "__main__":
    run_all_tests()


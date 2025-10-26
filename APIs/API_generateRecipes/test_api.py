#!/usr/bin/env python3
"""
Test script for the Recipe Generation API
Run this locally to test your API before deployment
"""

import requests
import json
import os

# Set your API endpoint (change this after deployment)
# API_URL = "http://localhost:3000/api/generate_recipes"  # Local testing
API_URL = "https://api-generate-recipes.vercel.app/api/generate_recipes"  # Production deployment

def test_api():
    """Test the recipe generation API"""
    
    # Sample inventory data
    inventory = [
        {
            "id": "ITEM-001",
            "name": "Brown Rice",
            "category": "Grains",
            "quantity": 5,
            "unit": "cups",
        },
        {
            "id": "ITEM-002",
            "name": "Black Beans",
            "category": "Legumes",
            "quantity": 2,
            "unit": "cans",
        },
        {
            "id": "ITEM-003",
            "name": "Tomatoes",
            "category": "Vegetables",
            "quantity": 4,
            "unit": "pieces",
        }
    ]
    
    # Request payload
    payload = {
        "inventory": inventory,
        "dietary_filters": ["vegetarian"],
        "count": 2
    }
    
    # Headers
    headers = {
        "Content-Type": "application/json"
    }
    
    # Add API key if configured
    api_key = os.getenv("API_KEY")
    if api_key:
        headers["X-API-Key"] = api_key
    
    print("🧪 Testing Recipe Generation API...")
    print(f"📍 Endpoint: {API_URL}")
    print(f"📦 Inventory items: {len(inventory)}")
    print()
    
    try:
        # Make the request
        response = requests.post(API_URL, json=payload, headers=headers, timeout=60)
        
        # Check response
        print(f"📊 Status Code: {response.status_code}")
        print()
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Success!")
            print(f"📝 Recipes generated: {data.get('count', 0)}")
            print()
            
            # Display recipes
            for i, recipe in enumerate(data.get('recipes', []), 1):
                print(f"🍳 Recipe {i}: {recipe.get('title', 'Unknown')}")
                print(f"   Description: {recipe.get('description', 'N/A')}")
                print(f"   Servings: {recipe.get('servings', 'N/A')}")
                print(f"   Prep Time: {recipe.get('prep_time_minutes', 'N/A')} minutes")
                print(f"   Dietary Tags: {', '.join(recipe.get('dietary_tags', []))}")
                print()
        else:
            print("❌ Error:")
            try:
                error_data = response.json()
                print(json.dumps(error_data, indent=2))
            except:
                print(response.text)
                
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        print()
        print("💡 Make sure:")
        print("   1. The API server is running (vercel dev)")
        print("   2. GOOGLE_API_KEY environment variable is set")
        print("   3. You're using the correct endpoint URL")

if __name__ == "__main__":
    test_api()

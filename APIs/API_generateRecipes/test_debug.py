#!/usr/bin/env python3
"""
Debug test to see what the API is actually returning
"""
import requests
import json

API_URL = "https://api-generate-recipes.vercel.app/api/generate_recipes"

# Simple test
payload = {
    "inventory": [
        {
            "name": "Chicken",
            "quantity": 500,
            "unit": "grams"
        },
        {
            "name": "Rice",
            "quantity": 300,
            "unit": "grams"
        }
    ],
    "count": 1
}

print("Sending request...")
print(json.dumps(payload, indent=2))

try:
    response = requests.post(API_URL, json=payload, timeout=120)
    
    print(f"\nStatus Code: {response.status_code}")
    print(f"\nHeaders: {dict(response.headers)}")
    print(f"\nResponse Text: {response.text}")
    
    try:
        result = response.json()
        print(f"\nParsed JSON:")
        print(json.dumps(result, indent=2))
    except:
        print("Could not parse as JSON")
        
except Exception as e:
    print(f"Exception: {e}")
    import traceback
    traceback.print_exc()



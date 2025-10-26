#!/usr/bin/env python3
"""
Local test of Gemini API directly
"""
import os
import requests
import json

# Try to get API key from environment
api_key = os.getenv('GOOGLE_API_KEY')
if not api_key:
    print("❌ GOOGLE_API_KEY not found in environment")
    print("Set it with: export GOOGLE_API_KEY='your-key-here'")
    exit(1)

print(f"✅ Found API key: {api_key[:10]}...")

# Test Gemini API directly
model = "gemini-1.5-flash"
url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

prompt = """Create a simple recipe using pasta.

Return ONLY JSON (no markdown):
{
  "title": "Recipe Name",
  "description": "One sentence",
  "servings": 2,
  "prep_time_minutes": 20,
  "ingredients": [
    {"inventory_item_id": "pasta-1", "quantity": 200, "unit": "grams"}
  ],
  "instructions": ["Step 1", "Step 2"],
  "nutrition_notes": ["High in carbs"],
  "dietary_tags": ["Vegetarian"]
}"""

payload = {
    "contents": [{"parts": [{"text": prompt}]}],
    "generationConfig": {
        "temperature": 0.9,
        "maxOutputTokens": 4096,
        "topP": 0.95,
        "topK": 40
    }
}

print(f"\n📤 Testing Gemini API: {model}")
print(f"URL: {url}")

try:
    response = requests.post(
        f"{url}?key={api_key}",
        headers={"Content-Type": "application/json"},
        json=payload,
        timeout=30
    )
    
    print(f"\n✅ Status: {response.status_code}")
    
    if response.status_code != 200:
        print(f"❌ Error response:")
        print(response.text)
    else:
        result = response.json()
        print(f"\n📥 Response keys: {result.keys()}")
        
        if 'candidates' in result:
            print(f"   Candidates: {len(result['candidates'])}")
            if result['candidates']:
                candidate = result['candidates'][0]
                print(f"   Candidate keys: {candidate.keys()}")
                if 'content' in candidate:
                    content = candidate['content']
                    if 'parts' in content and content['parts']:
                        text = content['parts'][0]['text']
                        print(f"\n✅ SUCCESS! Got response:")
                        print(text[:500])
        else:
            print(f"❌ No 'candidates' in response")
            print(json.dumps(result, indent=2)[:500])
            
except Exception as e:
    print(f"❌ Exception: {e}")
    import traceback
    traceback.print_exc()



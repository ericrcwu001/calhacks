from http.server import BaseHTTPRequestHandler
import json
import os
from google import genai
from google.genai import types
from PIL import Image
import io
import pandas as pd

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Get API key from environment variable
            api_key = os.environ.get('GOOGLE_API_KEY', 'AIzaSyABpgvPCOG3jIg4JqHvPDdR_1s4MY002eE')
            
            # Initialize Gemini client
            client = genai.Client(api_key=api_key)
            
            # Get content length
            content_length = int(self.headers.get('Content-Length', 0))
            
            if content_length == 0:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'No image provided'}).encode())
                return
            
            # Read image data from request body
            image_data = self.rfile.read(content_length)
            
            # Open image from bytes
            im = Image.open(io.BytesIO(image_data))
            
            # Call Gemini API to identify food items
            resp = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[
                    im,
                    ("Identify distinct objects in this photo. only include items which are edible "
                     "Return JSON with fields: items:[{label:string, count:int}]. "
                     "If unsure, best guess.")
                ],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2
                ),
            )
            
            # Parse response
            raw_json = resp.candidates[0].content.parts[0].text
            result_data = json.loads(raw_json)
            items = result_data.get("items", [])
            
            # For each item, get nutritional information
            items_with_nutrition = []
            for item in items:
                label = item['label']
                count = item['count']
                
                # Get nutritional facts for this food item
                nutrition_resp = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=[
                        f"For the food item '{label}', provide typical nutritional values per serving. "
                        "Return JSON with fields: calories_kcal, protein_g, carbohydrates_g, fat_g, sodium_mg. "
                        "Use standard nutritional values for this food type."
                    ],
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.1
                    ),
                )
                
                try:
                    nutrition_json = nutrition_resp.candidates[0].content.parts[0].text
                    nutrition_data = json.loads(nutrition_json)
                    
                    # Multiply by count to get total nutrition
                    item_with_nutrition = {
                        'label': label,
                        'count': count,
                        'calories_kcal': nutrition_data.get('calories_kcal', 0) * count,
                        'protein_g': nutrition_data.get('protein_g', 0) * count,
                        'carbohydrates_g': nutrition_data.get('carbohydrates_g', 0) * count,
                        'fat_g': nutrition_data.get('fat_g', 0) * count,
                        'sodium_mg': nutrition_data.get('sodium_mg', 0) * count
                    }
                    items_with_nutrition.append(item_with_nutrition)
                except:
                    # If nutrition lookup fails, add item without nutrition data
                    item_with_nutrition = {
                        'label': label,
                        'count': count,
                        'calories_kcal': 0,
                        'protein_g': 0,
                        'carbohydrates_g': 0,
                        'fat_g': 0,
                        'sodium_mg': 0
                    }
                    items_with_nutrition.append(item_with_nutrition)
            
            # Create pandas DataFrame
            df = pd.DataFrame(items_with_nutrition)
            
            # Return DataFrame as CSV
            csv_output = df.to_csv(index=False)
            
            # Send response
            self.send_response(200)
            self.send_header('Content-Type', 'text/csv')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(csv_output.encode())
            
        except Exception as e:
            error_response = {
                'error': str(e),
                'message': 'An error occurred while processing the image'
            }
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(error_response).encode())

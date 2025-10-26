import requests
import pandas as pd

# Your image path
image_path = '/home/maleeka/Downloads/calhacks/foodimg/apples_and_oranges.jpg'

# API endpoint - try without the random subdomain
# Use the main project domain instead
api_url = 'https://vercel_api.vercel.app/api/image-recognition'

# Alternative: your custom domain if you set one up
# api_url = 'https://your-custom-domain.com/api/image-recognition'

print(f"Sending image to: {api_url}")

try:
    # Open and send the image file
    with open(image_path, 'rb') as f:
        response = requests.post(api_url, data=f)
    
    # Check response status
    if response.status_code == 200:
        # Get CSV response and convert to DataFrame
        csv_data = response.text
        print("\n✅ API Response (CSV):")
        print(csv_data)
        
        # Convert CSV string to pandas DataFrame
        from io import StringIO
        df = pd.read_csv(StringIO(csv_data))
        
        print("\n✅ DataFrame:")
        print(df)
        print(f"\nDataFrame shape: {df.shape}")
        
    else:
        print(f"❌ Error: Status code {response.status_code}")
        print(response.text)
        
except FileNotFoundError:
    print(f"❌ Error: Could not find image at {image_path}")
except Exception as e:
    print(f"❌ Error: {str(e)}")

# Quick Start Guide

## ⚠️ IMPORTANT: Disable Vercel Password Protection First

Your deployment is currently password-protected. Here's how to fix it:

### Step 1: Go to Vercel Dashboard
1. Visit: https://vercel.com/dashboard
2. Click on your project: `vercel_api`

### Step 2: Disable Deployment Protection
1. Go to **Settings** → **Deployment Protection**
2. Find "Production Deployment" or "Preview Deployment"
3. Click on "**Disable**" or select "**None**" from the dropdown
4. Save the changes

### Step 3: Get Your Main Domain
1. In your project settings, you'll see a main domain like: `vercel_api.vercel.app`
2. Note this domain (it doesn't have the random characters)

---

## ✅ How to Use Your API

Once you've disabled protection, use this URL format:

```
https://vercel_api.vercel.app/api/image-recognition
```

(Replace `vercel_api` with your actual project name)

### Test with Your Image

```bash
curl -X POST https://vercel_api.vercel.app/api/image-recognition --data-binary @/home/maleeka/Downloads/calhacks/foodimg/apples_and_oranges.jpg
```

This will return CSV data like:
```
label,count
apple,3
orange,2
```

### Use in Python

```python
import requests
import pandas as pd
from io import StringIO

# Your image path
image_path = '/home/maleeka/Downloads/calhacks/foodimg/apples_and_oranges.jpg'

# Send request
with open(image_path, 'rb') as f:
    response = requests.post(
        'https://vercel_api.vercel.app/api/image-recognition',
        data=f
    )

# Convert CSV response to DataFrame
if response.status_code == 200:
    df = pd.read_csv(StringIO(response.text))
    print(df)
```

---

## Alternative: Use Local Development

If you can't disable the protection right now, you can test the code locally:

```bash
# Make sure you have the dependencies installed in a venv
python3 -m venv venv
source venv/bin/activate
pip install google-genai Pillow pandas

# Run the code directly (modify to read from image file)
```

---

## Summary

1. **Disable Vercel password protection** in the dashboard
2. **Use your main domain**: `vercel_api.vercel.app` (not the random subdomain)
3. **Send your image** to `/api/image-recognition`
4. **Get back CSV** → Convert to DataFrame if needed

# How to Use the Image Recognition API - Step by Step

## Prerequisites
- An image file (JPG, PNG, or any image format) with food items in it
- A computer with internet access

---

## Method 1: Using cURL (Terminal/Command Line)

### Step 1: Find Your Image File
Locate your image file on your computer. For example:
- `apples_and_oranges.jpg`
- `fruit_bowl.png`
- Any image with food items

### Step 2: Copy the Image Path
Remember where your image file is located. For example:
- `/home/maleeka/Pictures/apples_and_oranges.jpg`
- `C:\Users\YourName\Pictures\food.jpg` (Windows)
- `~/Downloads/fruit.jpg`

### Step 3: Open Terminal/Command Prompt
- **Linux/Mac**: Open Terminal
- **Windows**: Open Command Prompt or PowerShell

### Step 4: Run the cURL Command
Replace `YOUR_IMAGE_PATH.jpg` with your actual image path:

```bash
curl -X POST https://vercel-1u2p50qq4-maleekas-projects.vercel.app/api/image-recognition --data-binary @YOUR_IMAGE_PATH.jpg
```

**Example:**
```bash
curl -X POST https://vercel-1u2p50qq4-maleekas-projects.vercel.app/api/image-recognition --data-binary @/home/maleeka/Pictures/apples_and_oranges.jpg
```

### Step 5: View the Results
You should see output like:
```
label,count
apple,3
orange,2
```

This CSV format shows:
- `label`: Name of the food item
- `count`: How many of that item are in the image

---

## Method 2: Using Python

### Step 1: Install Required Package
```bash
pip install requests
```

### Step 2: Create a Python Script
Create a file called `test_api.py` with this code:

```python
import requests

# Path to your image file
image_path = '/path/to/your/image.jpg'  # Change this!

# Open the image file
with open(image_path, 'rb') as f:
    # Send POST request
    response = requests.post(
        'https://vercel-1u2p50qq4-maleekas-projects.vercel.app/api/image-recognition',
        data=f
    )

# Print the result
print(response.text)
```

### Step 3: Edit the Image Path
Change `/path/to/your/image.jpg` to your actual image file path.

### Step 4: Run the Script
```bash
python test_api.py
```

### Step 5: View Results
You'll see CSV output showing the detected food items and counts.

---

## Method 3: Using Postman (GUI Tool)

### Step 1: Download Postman
Go to https://www.postman.com/downloads/ and install it.

### Step 2: Create New Request
1. Click "New" → "HTTP Request"
2. Set method to **POST**
3. Enter URL: `https://vercel-1u2p50qq4-maleekas-projects.vercel.app/api/image-recognition`

### Step 3: Add Image File
1. Click on "Body" tab
2. Select "binary"
3. Click "Select File" and choose your image

### Step 4: Send Request
Click "Send" button

### Step 5: View Results
Look at the response body - you'll see the CSV with food items detected.

---

## Method 4: Using JavaScript/HTML (Web Browser)

### Step 1: Create HTML File
Create a file called `test_api.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Food Recognition API Test</title>
</head>
<body>
    <h1>Upload Image to Identify Food Items</h1>
    <input type="file" id="imageInput" accept="image/*">
    <button onclick="testAPI()">Upload</button>
    <pre id="result"></pre>

    <script>
        async function testAPI() {
            const fileInput = document.getElementById('imageInput');
            const file = fileInput.files[0];
            
            if (!file) {
                alert('Please select an image file');
                return;
            }

            const formData = new FormData();
            formData.append('image', file);

            try {
                const response = await fetch(
                    'https://vercel-1u2p50qq4-maleekas-projects.vercel.app/api/image-recognition',
                    {
                        method: 'POST',
                        body: formData
                    }
                );
                
                const result = await response.text();
                document.getElementById('result').textContent = result;
            } catch (error) {
                console.error('Error:', error);
            }
        }
    </script>
</body>
</html>
```

### Step 2: Open in Browser
Double-click the HTML file to open it in your web browser.

### Step 3: Upload Image
1. Click "Choose File"
2. Select your image
3. Click "Upload"

### Step 4: View Results
The results will appear below showing the detected food items.

---

## Troubleshooting

### Problem: "No image provided" error
**Solution**: Make sure you're sending the image file correctly. In cURL, use `--data-binary @` before the filename.

### Problem: Timeout or connection error
**Solution**: Check your internet connection and try again.

### Problem: API returns error
**Solution**: Make sure the `GOOGLE_API_KEY` environment variable is set in Vercel dashboard.

### Problem: Can't find my image file
**Solution**: Use the full path to your image file, for example:
- Linux/Mac: `/home/username/Pictures/image.jpg`
- Windows: `C:\Users\username\Pictures\image.jpg`

---

## Example Test

Try with this command (if you have a file called `test.jpg` in your current directory):

```bash
# First, copy your image to the current directory, then run:
curl -X POST https://vercel-1u2p50qq4-maleekas-projects.vercel.app/api/image-recognition --data-binary @test.jpg
```

The response will show you what food items the AI detected in your image!

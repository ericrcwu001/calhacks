# Image Recognition API

A Vercel serverless API for identifying edible objects in images using Google's Gemini AI.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Deploy to Vercel:
```bash
vercel
```

3. Set environment variable in Vercel dashboard:
   - `GOOGLE_API_KEY`: Your Google API key

## Usage

### POST /api/image-recognition

Send an image file to get recognized edible items as a CSV file (pandas DataFrame).

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: Form data with 'image' field containing the image file

**Response:**
CSV format with columns: `label`, `count`

Example:
```
label,count
apple,3
orange,2
```

### Example with cURL:

```bash
curl -X POST https://your-domain.vercel.app/api/image-recognition \
  -F "image=@/path/to/your/image.jpg"
```

### Example with JavaScript:

```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);

fetch('https://your-domain.vercel.app/api/image-recognition', {
  method: 'POST',
  body: formData
})
.then(response => response.text())
.then(csv => console.log(csv));
```

### Example with Python:

```python
import requests

with open('image.jpg', 'rb') as f:
    files = {'image': f}
    response = requests.post(
        'https://your-domain.vercel.app/api/image-recognition',
        files=files
    )
    print(response.text)  # CSV output
```

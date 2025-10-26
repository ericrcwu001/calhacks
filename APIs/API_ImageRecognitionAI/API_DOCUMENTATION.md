# Food Image Recognition API Documentation

## Overview

A powerful AI-powered API that identifies edible food items in images and provides detailed nutritional information. Uses Google Gemini AI to detect, count, and analyze food items in photos.

## API Specification

**OpenAPI 3.0 Specification**: See `openapi.json` for complete API documentation.

**Base URL**: `https://vercel-2esjabz4i-maleekas-projects.vercel.app`

## Endpoints

### POST /api/image-recognition

Upload an image to identify food items and get nutritional information.

#### Request

- **Method**: `POST`
- **Content-Type**: `image/*` (binary image data)
- **Body**: Binary image file (JPG, PNG, etc.)

#### Response

**Success (200 OK)**
- **Content-Type**: `text/csv`
- **Format**: CSV with nutritional data

```csv
label,count,calories_kcal,protein_g,carbohydrates_g,fat_g,sodium_mg
apple,10,950,5.0,250.0,3.0,20
orange,5,310,6.0,77.0,1.0,5
```

**Error (400 Bad Request)**
```json
{
  "error": "No image provided"
}
```

**Error (500 Internal Server Error)**
```json
{
  "error": "Error details",
  "message": "An error occurred while processing the image"
}
```

## Data Schema

### FoodItem

| Field | Type | Description |
|-------|------|-------------|
| label | string | Name of the food item |
| count | integer | Number of items detected |
| calories_kcal | number | Total calories (kcal) |
| protein_g | number | Total protein (grams) |
| carbohydrates_g | number | Total carbohydrates (grams) |
| fat_g | number | Total fat (grams) |
| sodium_mg | number | Total sodium (milligrams) |

## Example Usage

### cURL

```bash
curl -X POST https://vercel-2esjabz4i-maleekas-projects.vercel.app/api/image-recognition \
  --data-binary @image.jpg
```

### Python

```python
import requests
import pandas as pd
from io import StringIO

# Upload image
with open('food_image.jpg', 'rb') as f:
    response = requests.post(
        'https://vercel-2esjabz4i-maleekas-projects.vercel.app/api/image-recognition',
        data=f
    )

# Parse CSV response to DataFrame
df = pd.read_csv(StringIO(response.text))
print(df)
```

### JavaScript

```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);

fetch('https://vercel-2esjabz4i-maleekas-projects.vercel.app/api/image-recognition', {
  method: 'POST',
  body: formData
})
.then(response => response.text())
.then(csv => console.log(csv));
```

## Features

- ✅ AI-powered food recognition using Google Gemini
- ✅ Automatic item counting
- ✅ Nutritional analysis (calories, protein, carbs, fat, sodium)
- ✅ CSV output for easy DataFrame conversion
- ✅ Supports multiple image formats (JPG, PNG, etc.)
- ✅ CORS enabled

## Technologies

- **AI Model**: Google Gemini 2.5 Flash
- **Image Processing**: Pillow (PIL)
- **Data Format**: Pandas DataFrame (CSV output)
- **Hosting**: Vercel Serverless Functions

## Rate Limits

No rate limits currently enforced. Please use responsibly.

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success - food items identified |
| 400 | Bad request - invalid or missing image |
| 500 | Server error - processing failed |

## Support

For issues or questions, please contact the API maintainer.

## License

MIT

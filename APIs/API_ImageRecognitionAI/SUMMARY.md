# Image Recognition API - Summary

## What It Does

This API takes an image file as input and returns a pandas DataFrame (as CSV) containing the edible items detected in the image and their counts.

## Request Format

- **Method**: POST
- **Content-Type**: multipart/form-data  
- **Body**: Form data with an `image` field containing the image file
- **Acceptable image formats**: JPEG, PNG, GIF, etc.

## Response Format

Returns CSV text with two columns:
- `label`: Name of the food item
- `count`: Number of that item detected

Example response:
```
label,count
apple,3
orange,2
banana,1
```

## Example Usage

```bash
curl -X POST https://your-domain.vercel.app/api/image-recognition \
  -F "image=@/path/to/apples_and_oranges.jpg"
```

## How It Works

1. Receives image file via multipart/form-data POST request
2. Processes image using Google Gemini AI (gemini-2.5-flash model)
3. Identifies edible objects and counts them
4. Returns results as a pandas DataFrame in CSV format

## Deployment

Deploy to Vercel using:
```bash
vercel
```

Set the `GOOGLE_API_KEY` environment variable in Vercel dashboard.

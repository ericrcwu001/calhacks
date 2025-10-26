# Your API is Now Live! 🎉

## API Endpoint

**Production URL:**
```
https://vercel-1u2p50qq4-maleekas-projects.vercel.app/api/image-recognition
```

## Usage

### Send an Image File (JPG, PNG, etc.)

```bash
curl -X POST https://vercel-1u2p50qq4-maleekas-projects.vercel.app/api/image-recognition \
  --data-binary @your_image.jpg
```

**Note:** The API expects the image file to be sent as the request body (binary data).

### Send Base64 Encoded Image

```bash
curl -X POST https://vercel-1u2p50qq4-maleekas-projects.vercel.app/api/image-recognition \
  -H "Content-Type: application/json" \
  -d '{"image": "BASE64_ENCODED_IMAGE_DATA"}'
```

## Response Format

The API returns a CSV file with two columns:
- `label`: Name of the food item
- `count`: Number of that item detected

Example response:
```
label,count
apple,3
orange,2
```

## Setting Environment Variable

Make sure to set the `GOOGLE_API_KEY` environment variable in your Vercel dashboard:

1. Go to https://vercel.com/dashboard
2. Select your project: `vercel_api`
3. Go to Settings → Environment Variables
4. Add: `GOOGLE_API_KEY` = `AIzaSyABpgvPCOG3jIg4JqHvPDdR_1s4MY002eE`
5. Redeploy the function

## Testing

You can test your API using:

```bash
curl -X POST https://vercel-1u2p50qq4-maleekas-projects.vercel.app/api/image-recognition \
  --data-binary @/path/to/apples_and_oranges.jpg
```

Or visit the deployment logs:
```
https://vercel.com/maleekas-projects/vercel_api/DNFXKtnwhEUr2DD8pjdKszhVCCUn
```

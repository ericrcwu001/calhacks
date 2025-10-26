# Quick Start Guide

Get your Recipe Generation API deployed to Vercel in minutes!

## Prerequisites

- Node.js installed (for Vercel CLI)
- A Google Gemini API key: [Get one here](https://makersuite.google.com/app/apikey)

## Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

## Step 2: Login to Vercel

```bash
vercel login
```

## Step 3: Deploy

Option A - Use the deployment script:
```bash
./deploy.sh
```

Option B - Deploy manually:
```bash
vercel
```

## Step 4: Set Environment Variables

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings → Environment Variables
4. Add the following variables:

| Variable | Value | Required |
|----------|-------|----------|
| `GOOGLE_API_KEY` | Your Gemini API key | ✅ Yes |
| `API_KEY` | Your custom API key | ❌ No |

## Step 5: Redeploy

```bash
vercel --prod
```

## Step 6: Test Your API

Use the test script:

```bash
# Set your API URL in test_api.py first
python test_api.py
```

Or test with curl:

```bash
curl -X POST https://your-app.vercel.app/api/generate_recipes \
  -H "Content-Type: application/json" \
  -d '{
    "inventory": [
      {
        "id": "ITEM-001",
        "name": "Brown Rice",
        "category": "Grains",
        "quantity": 5,
        "unit": "cups",
      }
    ],
    "dietary_filters": ["vegetarian"],
    "count": 1
  }'
```

## Your API is Live! 🎉

Your endpoint: `https://your-app.vercel.app/api/generate_recipes`

See [README.md](README.md) for full API documentation.

## Troubleshooting

**API returns 500 error:**
- Check that `GOOGLE_API_KEY` is set correctly in Vercel
- Verify your Google API key is valid

**Can't connect to API:**
- Wait a few minutes after deployment
- Check that you're using the correct URL

**Import errors:**
- Make sure all files are in the `api/` directory
- Verify `requirements.txt` includes `requests`

## Next Steps

- Read the full [README.md](README.md) for detailed API documentation
- Try the examples in the README
- Integrate into your application!

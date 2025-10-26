#!/bin/bash
# Quick deployment script for Vercel

echo "🚀 Deploying Recipe Generation API to Vercel..."
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null
then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Deploy to Vercel
echo "📦 Deploying to Vercel..."
vercel

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Set environment variables in Vercel dashboard:"
echo "   - GOOGLE_API_KEY: Your Google Gemini API key"
echo "   - API_KEY: (Optional) Your custom API key"
echo ""
echo "2. Redeploy to apply environment variables:"
echo "   vercel --prod"
echo ""
echo "🌐 Your API will be available at: https://your-app.vercel.app/api/generate_recipes"

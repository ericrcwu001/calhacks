# Deployment Guide for Vercel

## Quick Deploy Steps

### Option 1: Using Vercel CLI (Recommended)

1. **Login to Vercel:**
   ```bash
   vercel login
   ```

2. **Deploy to Vercel:**
   ```bash
   vercel
   ```

3. **Follow the prompts:**
   - Link to existing project? No (first time)
   - Project name: `vercel_api` (or your choice)
   - Directory: `.` (current directory)
   - Override settings: No

4. **Set Environment Variable:**
   After deployment, go to your Vercel dashboard and add:
   - Key: `GOOGLE_API_KEY`
   - Value: Your actual Google API key (`AIzaSyABpgvPCOG3jIg4JqHvPDdR_1s4MY002eE`)

5. **Redeploy to apply environment variable:**
   ```bash
   vercel --prod
   ```

### Option 2: Using GitHub Integration

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Import to Vercel:**
   - Go to https://vercel.com/new
   - Click "Import Git Repository"
   - Select your repository
   - Add environment variable: `GOOGLE_API_KEY`
   - Click "Deploy"

### Option 3: Deploy from Vercel Dashboard

1. Go to https://vercel.com/new
2. Click "Upload Project"
3. Drag and drop this folder
4. Add environment variable: `GOOGLE_API_KEY`
5. Click "Deploy"

## After Deployment

Your API will be available at:
```
https://YOUR-PROJECT-NAME.vercel.app/api/image-recognition
```

## Testing Your Deployment

```bash
curl -X POST https://YOUR-PROJECT-NAME.vercel.app/api/image-recognition \
  -F "image=@path/to/your/image.jpg"
```

## Managing Environment Variables

To update environment variables:

1. Go to your project in Vercel Dashboard
2. Settings → Environment Variables
3. Add or edit variables
4. Redeploy your project

## Troubleshooting

- **Import errors**: Make sure all dependencies are in `requirements.txt`
- **Timeout errors**: Large images may take longer to process
- **API key errors**: Verify the environment variable is set correctly

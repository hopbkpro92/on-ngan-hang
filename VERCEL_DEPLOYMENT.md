# Vercel Deployment Guide

## ✅ New Solution: API Route for File Serving

The app now uses a custom API route (`/api/quiz-file`) to serve Excel files, which solves the Vietnamese filename issue in Vercel!

### How It Works

1. **Local Development**: Files are read directly from the filesystem (fast)
2. **Vercel Production**: Files are served via API route at `/api/quiz-file?file=filename.xlsx`
3. **Automatic**: The app automatically detects which method to use

## Environment Variables Setup (Optional but Recommended)

### For Vercel Production

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**  
3. Add the following variable:
   - **Name**: `NEXT_PUBLIC_APP_URL`
   - **Value**: `https://on-ngan-hang.vercel.app` (your actual Vercel deployment URL)
   - **Environment**: ✅ Production, ✅ Preview, ✅ Development (check all three)
4. **Click "Save"**
5. **Redeploy your application** (Vercel → Deployments → click "..." → Redeploy)

### Alternative: Auto-Detection

If you don't set `NEXT_PUBLIC_APP_URL`, the app will automatically use Vercel's built-in `VERCEL_URL` environment variable.

### For Local Development

The `.env.local` file has been created with the default localhost configuration:
```
NEXT_PUBLIC_APP_URL=http://localhost:9002
```

If your local server runs on a different port, update this value accordingly.

## How It Works

The application now uses HTTP fetch to load Excel files from the `public` folder, which works in both local and serverless (Vercel) environments.

### Key Changes Made:

1. **Removed filesystem access** (`fs.readFile`) which doesn't work in Vercel serverless functions
2. **Uses fetch API** to load files from the public folder via HTTP
3. **Multiple URL encoding attempts** to handle Vietnamese characters:
   - Plain filename
   - URI encoding (`encodeURI`)
   - Full encoding (`encodeURIComponent`)
4. **Automatic URL detection** with fallback to localhost:3000 if environment variable is not set

## Troubleshooting

If you see errors in production:

### Error: "File not found with any URL encoding"

**Solution**: Make sure all Excel files are in the `public` folder and are being deployed to Vercel.

### Error: "Failed to fetch"

**Solution**: Check that `NEXT_PUBLIC_APP_URL` is correctly set in Vercel environment variables to your actual deployment URL.

### Error: "Server Components render error"

**Solution**: Check Vercel deployment logs for specific errors. Go to your Vercel project → Deployments → Click on your deployment → View Function Logs.

## Deployment Checklist

- [ ] All Excel files are in the `public` folder
- [ ] `quiz-files.json` is in the `public` folder with correct file paths
- [ ] `NEXT_PUBLIC_APP_URL` environment variable is set in Vercel
- [ ] The Vercel deployment completed successfully
- [ ] Test the application after deployment

## Notes

- The `public` folder is automatically served as static files by Next.js and Vercel
- Vietnamese characters in filenames are handled automatically with multiple encoding attempts
- The application will try plain, URI-encoded, and fully-encoded URLs to find the files

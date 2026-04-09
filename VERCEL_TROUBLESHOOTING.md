# Vercel Deployment Troubleshooting

## Problem: "No Quiz Files Found" in Vercel

If you see this error in production but the app works locally, follow these steps:

### Step 1: Verify Files Are Deployed

1. Go to your Vercel deployment
2. Check the deployment logs
3. Verify that files in `public/` folder are being deployed
4. The following files MUST be present:
   - `public/quiz-files.json`
   - All `.xlsx` files listed in `quiz-files.json`

### Step 2: Set Environment Variable

**This is the most common issue!**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **on-ngan-hang**
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Set:
   ```
   Name: NEXT_PUBLIC_APP_URL
   Value: https://on-ngan-hang.vercel.app
   ```
6. Select **ALL environments**: Production, Preview, Development
7. Click **Save**
8. **IMPORTANT**: Redeploy your app
   - Go to **Deployments** tab
   - Find your latest deployment
   - Click the **"..."** menu
   - Select **"Redeploy"**

### Step 3: Check Deployment Logs

After redeploying, check the Function Logs:

1. Go to your deployment
2. Click on **"View Function Logs"**
3. Look for messages like:
   ```
   Using NEXT_PUBLIC_APP_URL: https://on-ngan-hang.vercel.app
   Fetching quiz files from: https://on-ngan-hang.vercel.app/quiz-files.json
   Found X valid quiz files after validation
   ```

### Step 4: Verify quiz-files.json is Accessible

Open in browser:
```
https://on-ngan-hang.vercel.app/quiz-files.json
```

You should see the JSON array with all your quiz file metadata.

### Step 5: Common Issues and Solutions

#### Issue: Environment variable not working
**Solution**: 
- Make sure you selected ALL environments when adding the variable
- Redeploy the app after adding the variable
- Don't just push code - use the "Redeploy" button in Vercel

#### Issue: Files not found
**Solution**:
- Verify all Excel files are committed to git
- Check `.gitignore` doesn't exclude Excel files
- Verify files are in the `public/` folder, not in a subfolder

#### Issue: CORS or fetch errors
**Solution**:
- Make sure the URL doesn't have trailing slash
- The app auto-detects VERCEL_URL, but explicit setting is better
- Check browser console for actual error messages

### Step 6: Debug in Production

Add `?debug=true` to your URL to see detailed logs (if you implement this).

Or check browser console (F12) for error messages.

### Expected Behavior

**Local Development:**
```
✅ Uses filesystem to read files directly
✅ Falls back to http://localhost:9002 if needed
✅ No environment variable required
```

**Vercel Production:**
```
✅ Uses NEXT_PUBLIC_APP_URL or VERCEL_URL
✅ Fetches files via HTTPS
✅ Should work with proper environment variable
```

## Quick Fix Checklist

- [ ] All `.xlsx` files are in `public/` folder
- [ ] `quiz-files.json` is in `public/` folder
- [ ] Environment variable `NEXT_PUBLIC_APP_URL` is set in Vercel
- [ ] Environment variable is set for ALL environments
- [ ] App was redeployed after adding environment variable
- [ ] `/quiz-files.json` is accessible in browser
- [ ] Browser console shows no CORS errors

## Still Not Working?

1. Check Vercel Function Logs for detailed error messages
2. Verify the quiz-files.json URL is accessible
3. Check if files are actually deployed to Vercel
4. Try hard refresh in browser (Ctrl+Shift+R)
5. Clear browser cache and reload

## Contact

If issues persist, check:
- Vercel deployment logs
- Browser console errors
- Network tab in browser DevTools

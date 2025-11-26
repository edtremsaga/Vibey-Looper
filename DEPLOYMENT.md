# Deployment Guide - Vercel

This guide will help you deploy Vibey YouTube Music Looper to Vercel so you can use it on any device, including your iPhone.

## Prerequisites

- A GitHub account (you already have this!)
- A Vercel account (free) - sign up at [vercel.com](https://vercel.com)

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Sign in to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub account

2. **Import Your Repository**
   - Click "Add New..." → "Project"
   - Find and select `edtremsaga/Vibey-Looper`
   - Click "Import"

3. **Configure Project**
   - Framework Preset: Vercel should auto-detect "Vite"
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `dist` (auto-detected)
   - Install Command: `npm install` (auto-detected)

4. **Deploy**
   - Click "Deploy"
   - Wait 1-2 minutes for build to complete
   - Your app will be live at a URL like: `vibey-looper.vercel.app`

5. **Access on iPhone**
   - The URL will work on any device
   - You can bookmark it on your iPhone home screen:
     - Open Safari on iPhone
     - Navigate to your Vercel URL
     - Tap the Share button
     - Select "Add to Home Screen"

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   
   - Follow the prompts
   - Say "Yes" to link to existing project (if you created one) or create new
   - Your app will be deployed!

4. **For Production Deployment**
   ```bash
   vercel --prod
   ```

## Custom Domain (Optional)

After deployment, you can add a custom domain:

1. Go to your project in Vercel dashboard
2. Click "Settings" → "Domains"
3. Add your domain name
4. Follow DNS configuration instructions

## Environment Variables

Currently, this app doesn't require any environment variables. If you add features later that need API keys, you can add them in:
- Vercel Dashboard → Your Project → Settings → Environment Variables

## Automatic Deployments

Once connected to GitHub, Vercel will automatically:
- Deploy when you push to `main` branch
- Create preview deployments for pull requests
- You can trigger redeploys from the Vercel dashboard

## Troubleshooting

### Build Fails
- Check that `package.json` has the correct build script
- Ensure all dependencies are listed in `package.json`
- Check build logs in Vercel dashboard

### App Not Working on Mobile
- Clear browser cache
- Check that HTTPS is enabled (Vercel does this automatically)
- Ensure YouTube videos are embeddable

### Video Won't Load
- Some YouTube videos have embedding disabled
- Try a different video URL
- Check browser console for errors

## Updating Your Deployment

After making changes:

1. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```

2. Vercel will automatically rebuild and deploy!

## Need Help?

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html#vercel)

---

Your app will be accessible from anywhere once deployed! 📱✨


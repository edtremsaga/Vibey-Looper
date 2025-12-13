# YouTube Data API Setup Guide

## Using Your Existing Google Cloud Account

Yes! You can absolutely use your existing Google Cloud account. Here's how to set it up:

---

## Step-by-Step Setup

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Sign in with your existing Google account
3. Select your project (or create a new one if you prefer)

### Step 2: Enable YouTube Data API v3
1. In the Google Cloud Console, go to **"APIs & Services"** → **"Library"**
2. Search for **"YouTube Data API v3"**
3. Click on it and click **"Enable"**
4. Wait for it to enable (usually takes a few seconds)

### Step 3: Create API Key
1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"API key"**
4. Your API key will be generated
5. **Important:** Click **"Restrict key"** to secure it:
   - Under **"API restrictions"**, select **"Restrict key"**
   - Choose **"YouTube Data API v3"** only
   - Under **"Application restrictions"**, you can:
     - Leave as "None" for development
     - Or restrict to HTTP referrers (your Vercel domain) for production
6. Click **"Save"**
7. **Copy your API key** - you'll need it for the next steps

### Step 4: Set Up in Vercel (For Production)

#### Option A: Vercel Environment Variables (Recommended)
1. Go to your Vercel project dashboard
2. Go to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name:** `YOUTUBE_API_KEY`
   - **Value:** (paste your API key)
   - **Environment:** Production, Preview, Development (check all)
4. Click **Save**

#### Option B: Local Development (.env.local)
1. Create a file `.env.local` in your project root
2. Add:
   ```
   VITE_YOUTUBE_API_KEY=your_api_key_here
   ```
3. **Important:** Add `.env.local` to `.gitignore` (don't commit API keys!)

---

## Cost Information

### Free Tier:
- **10,000 units per day** (free)
- **1 search request = 100 units**
- **= ~100 searches per day** (free)

### If You Exceed:
- $0.10 per 1,000 additional units
- Very unlikely for personal use

### Monitoring:
- You can check usage in Google Cloud Console
- Set up billing alerts if you want

---

## Security Best Practices

1. **Restrict the API Key:**
   - Only allow YouTube Data API v3
   - Restrict to your domain (for production)

2. **Don't Commit API Keys:**
   - Use environment variables
   - Add `.env.local` to `.gitignore`

3. **Use Serverless Function:**
   - Hide API key in Vercel serverless function
   - Frontend calls your function, not YouTube directly

---

## Quick Checklist

- [ ] Sign in to Google Cloud Console
- [ ] Enable YouTube Data API v3
- [ ] Create API key
- [ ] Restrict API key to YouTube Data API v3 only
- [ ] Copy API key
- [ ] Add to Vercel environment variables (or .env.local for local dev)
- [ ] Ready to implement!

---

## Next Steps

Once you have the API key set up, I can help you:
1. Create the Vercel serverless function
2. Build the search UI component
3. Integrate it with your existing player

Let me know when you have the API key ready, and we can start implementing!










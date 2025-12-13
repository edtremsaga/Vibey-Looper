# Complete Google Cloud Setup Guide

## Step-by-Step: From Zero to API Key

Follow these steps to create your Google Cloud project and get your YouTube API key.

---

## Step 1: Create Google Cloud Account (If Needed)

1. Go to: https://console.cloud.google.com/
2. Sign in with your Google account (Gmail account works)
3. If you see a welcome screen, click **"Get Started for Free"**
4. You may need to:
   - Accept terms of service
   - Provide payment info (won't be charged for free tier)
   - Verify your account

**Note:** Google Cloud free tier includes $300 credit, but YouTube Data API free tier doesn't require any payment.

---

## Step 2: Create a New Project

1. In Google Cloud Console, look at the top of the page
2. You'll see a project dropdown (might say "Select a project" or show a project name)
3. Click the dropdown → Click **"NEW PROJECT"**
4. Fill in:
   - **Project name:** `Vibey Looper` (or any name you like)
   - **Organization:** Leave as default (or select if you have one)
   - **Location:** Leave as default
5. Click **"CREATE"**
6. Wait a few seconds for project to be created
7. You'll see a notification when it's ready

---

## Step 3: Select Your Project

1. After project is created, click the project dropdown at the top
2. Select your new project (`Vibey Looper` or whatever you named it)
3. You should now see your project name in the top bar

---

## Step 4: Enable YouTube Data API v3

1. In the left sidebar, click **"APIs & Services"** → **"Library"**
   - (If you don't see it, click the ☰ menu icon in top left)
2. In the search bar at the top, type: **"YouTube Data API v3"**
3. Click on **"YouTube Data API v3"** in the results
4. Click the blue **"ENABLE"** button
5. Wait a few seconds - you'll see a success message
6. You're now on the API overview page

---

## Step 5: Create API Key

1. In the left sidebar, click **"APIs & Services"** → **"Credentials"**
2. At the top, click **"+ CREATE CREDENTIALS"**
3. Select **"API key"** from the dropdown
4. A popup will appear with your API key - **COPY IT NOW!**
   - It looks like: `AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - ⚠️ **Save this somewhere safe** - you'll need it!

---

## Step 6: Secure Your API Key (IMPORTANT!)

**Do this immediately after creating the key:**

1. In the popup that shows your API key, click **"RESTRICT KEY"**
   - (If you closed it, go to "Credentials" → click on your API key name)

2. **Under "API restrictions":**
   - Select **"Restrict key"**
   - Check the box for **"YouTube Data API v3"**
   - Uncheck any other APIs

3. **Under "Application restrictions" (optional but recommended):**
   - For now, you can leave as **"None"** for development
   - Later, for production, you can restrict to:
     - **HTTP referrers** → Add your Vercel domain
     - Example: `https://your-app.vercel.app/*`

4. Click **"SAVE"** at the bottom

---

## Step 7: Test Your API Key (Optional)

You can test if your API key works by running this in your browser:

```
https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&key=YOUR_API_KEY_HERE
```

Replace `YOUR_API_KEY_HERE` with your actual API key.

You should see JSON data with search results.

---

## Step 8: Save Your API Key Securely

**Important:** Don't share your API key publicly!

1. Save it in a secure note/password manager
2. We'll add it to Vercel environment variables next
3. Never commit it to GitHub

---

## Troubleshooting

### "Billing account required" message?
- YouTube Data API free tier doesn't require billing
- If you see this, try a different project or contact support
- Usually this is a false warning for free APIs

### Can't find "APIs & Services"?
- Click the ☰ (hamburger) menu in top left
- Look for "APIs & Services" in the menu

### API key not working?
- Make sure YouTube Data API v3 is enabled
- Check that you copied the full key (no spaces)
- Verify the key isn't restricted incorrectly

---

## What's Next?

Once you have your API key:

1. ✅ Add it to Vercel environment variables
2. ✅ Create the serverless function
3. ✅ Build the search UI
4. ✅ Test it out!

---

## Quick Reference

- **Google Cloud Console:** https://console.cloud.google.com/
- **YouTube Data API Docs:** https://developers.google.com/youtube/v3
- **API Quota:** 10,000 units/day free (≈100 searches/day)

---

## Checklist

- [ ] Created Google Cloud account
- [ ] Created new project
- [ ] Enabled YouTube Data API v3
- [ ] Created API key
- [ ] Restricted API key to YouTube Data API v3 only
- [ ] Saved API key securely
- [ ] Ready for next steps!

Let me know when you have your API key, and I'll help you set it up in Vercel and build the search feature!










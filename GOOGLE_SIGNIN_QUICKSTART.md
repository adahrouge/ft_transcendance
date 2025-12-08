# Google Sign-In Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Get Google Client ID (2 minutes)
1. Go to https://console.cloud.google.com/
2. Create a new project or select existing one
3. Search for "Google Identity Services" and enable it
4. Go to Credentials → Create OAuth 2.0 ID (Web Application)
5. Add URIs:
   - `http://localhost:5173`
   - `http://localhost:3000`
6. Copy your **Client ID**

### Step 2: Configure Environment (1 minute)
Create `client/.env.local`:
```bash
echo "VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE" > client/.env.local
```

### Step 3: Run Your App (2 minutes)
```bash
# Terminal 1: Backend
cd server && npm install && npm run dev

# Terminal 2: Frontend  
cd client && npm install && npm run dev
```

### Step 4: Test It! (No time needed)
1. Go to http://localhost:5173
2. Click "CONTINUE WITH GOOGLE"
3. Sign in with your Google account
4. You're in! 🎉

## 🔧 What Was Implemented

Your "Continue with Google" button now:
- ✅ Shows Google Sign-In dialog
- ✅ Verifies tokens securely on server
- ✅ Creates user account automatically
- ✅ Logs in existing users
- ✅ Returns JWT token for session

## 📁 Files Changed

**Created:**
- `client/src/utils/google-oauth.ts` - Google config & helpers
- `client/.env.example` - Environment template
- `GOOGLE_OAUTH_SETUP.md` - Full documentation
- `GOOGLE_SIGNIN_IMPLEMENTATION.md` - Implementation details

**Modified:**
- `client/src/pages/auth.ts` - Added Google button handler
- `client/src/services/auth.ts` - Added googleAuth() method
- `server/routes/users.js` - Added /api/users/google-auth endpoint

## 🚀 Next Steps

1. **Complete the setup** - Add your Google Client ID to `.env.local`
2. **Test the flow** - Click the Google button and sign in
3. **Deploy** - Add your production domain to Google Console
4. **Monitor** - Check browser console for any errors

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| Button is disabled | Set `VITE_GOOGLE_CLIENT_ID` in `.env.local` |
| Sign-in doesn't work | Check Client ID is correct, domain is authorized |
| Token error on server | Verify email is confirmed in Google account |
| CORS error | Ensure backend is running and CORS is enabled |

## 📚 Full Documentation

See these files for complete details:
- `GOOGLE_OAUTH_SETUP.md` - Full setup guide
- `GOOGLE_SIGNIN_IMPLEMENTATION.md` - Architecture & details

## 💡 Pro Tips

- **Client ID is secure** - It's safe to have in frontend code
- **Token verification happens server-side** - Secure by default
- **Auto user creation** - First sign-in automatically creates account
- **Unique usernames** - System prevents duplicate usernames

## 🎯 You're Done!

Your Google Sign-In is ready to use. Just add your Client ID and you're good to go!

Questions? Check `GOOGLE_OAUTH_SETUP.md` for detailed documentation.

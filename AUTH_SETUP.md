# Authentication Setup Guide

## ✅ Supabase Google Authentication Implemented

Your login page now supports Google OAuth authentication through Supabase!

## 🔑 Environment Variables Required

Make sure your `.env` file contains:

```
SUPABASE_URL_ROLEPLAY_PROJECT=your-supabase-url
SUPABASE_ANON_KEY_ROLEPLAY_PROJECT=your-anon-key
SUPABASE_SERVICE_ROLE_KEY_ROLEPLAY_PROJECT=your-service-role-key
SUPABASE_SECRET_KEY_ROLEPLAY_PROJECT=your-secret-key
```

## 🎯 How It Works

### 1. **Login Flow:**
- User visits `/login`
- Clicks "Continue with Google"
- Redirected to Google OAuth consent screen
- After approval, redirected back to `/profile` (dashboard)
- User is now authenticated!

### 2. **Session Management:**
- Supabase automatically manages sessions
- Session persists across page reloads
- If user is already logged in, `/login` redirects to `/profile`

### 3. **Authentication State:**
- User info stored in `localStorage`
- Auth state tracked via Supabase listeners
- Automatic redirect on sign in/sign out

## 🔧 Providers Implemented

### ✅ Google OAuth
- Fully functional
- Uses Supabase Google provider
- Redirects to `/profile` after success

### ✅ LinkedIn OAuth
- Ready to use (if enabled in Supabase)
- Configure LinkedIn in Supabase Dashboard

### ✅ Email/Password
- Basic implementation with prompts
- Can be enhanced with proper UI

## 📋 Additional Supabase Configuration Needed

### In Supabase Dashboard:

1. **Enable Google Provider:**
   - Go to Authentication → Providers
   - Enable Google
   - Already configured with your credentials

2. **Set Redirect URLs:**
   - Site URL: `http://localhost:3000`
   - Redirect URLs:
     - `http://localhost:3000/profile`
     - `http://localhost:3000/auth/callback`

3. **(Optional) Enable LinkedIn:**
   - Go to Authentication → Providers
   - Enable LinkedIn
   - Add LinkedIn OAuth credentials

## 🚀 Testing Authentication

### Test Google Login:
1. Start server: `npm start`
2. Go to: `http://localhost:3000/login`
3. Click "Continue with Google"
4. Sign in with your Google account
5. You'll be redirected to `/profile`

### Test Session Persistence:
1. After logging in, close browser
2. Reopen and go to `/login`
3. Should automatically redirect to `/profile` (still logged in)

## 🔒 Security Features

✅ **Secure Key Storage:**
- API keys stored server-side in `.env`
- Only exposed via backend API endpoint
- Never exposed in frontend code

✅ **OAuth Flow:**
- Industry-standard OAuth 2.0
- Managed by Supabase (trusted platform)
- Secure token handling

✅ **Session Security:**
- JWT tokens managed by Supabase
- Automatic token refresh
- Secure HTTP-only cookies (when configured)

## 🐛 Troubleshooting

### "Failed to initialize authentication"
- Check that your `.env` file has the Supabase keys
- Verify key names match exactly
- Restart the server after adding keys

### "Google sign-in not working"
- Make sure Google provider is enabled in Supabase Dashboard
- Check redirect URLs are configured correctly
- Verify Google OAuth consent screen is set up

### "Redirect not working"
- Check Site URL in Supabase Dashboard matches your domain
- Ensure redirect URLs include `/profile` and `/auth/callback`

### User stays on login page after auth
- Check browser console for errors
- Verify auth state listener is firing
- Make sure cookies are enabled

## 📦 Files Modified

- ✅ `server.js` - Added `/api/supabase-config` endpoint
- ✅ `login.html` - Implemented Supabase authentication
- ✅ `auth.js` - Created auth handler class (optional)
- ✅ `package.json` - Added `@supabase/supabase-js`

## 🔜 Next Steps

### To Add Sign Up Flow:
Create a separate signup page or modal with:
- Email input
- Password input
- Confirm password
- Name input
- Use `supabaseClient.auth.signUp({ email, password })`

### To Add Sign Out:
Add a sign out button in `/profile`:
```javascript
await supabaseClient.auth.signOut();
window.location.href = '/login';
```

### To Protect Routes:
Add authentication check on protected pages:
```javascript
const { data: { session } } = await supabaseClient.auth.getSession();
if (!session) {
    window.location.href = '/login';
}
```

## 🎉 You're All Set!

Your authentication system is ready to use! Users can now sign in with Google and access the interview dashboard.


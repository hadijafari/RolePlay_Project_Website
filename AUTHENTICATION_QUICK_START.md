# 🔐 Authentication Quick Start

## ✅ What's Been Implemented

Your AI Mock Interview platform now has full Google authentication via Supabase!

## 🚀 How to Test

### 1. **Make Sure Your .env Has These Keys:**
```
SUPABASE_URL_ROLEPLAY_PROJECT=your-url
SUPABASE_ANON_KEY_ROLEPLAY_PROJECT=your-key
SUPABASE_SERVICE_ROLE_KEY_ROLEPLAY_PROJECT=your-key
SUPABASE_SECRET_KEY_ROLEPLAY_PROJECT=your-key
```

### 2. **Restart Your Server:**
```bash
npm start
```

### 3. **Test the Flow:**

**Sign In:**
1. Go to `http://localhost:3000/` (main page)
2. Click "Sign In" in top right
3. Click "Continue with Google"
4. Sign in with Google account
5. Automatically redirected to `/profile` (dashboard)

**Dashboard:**
- Your email appears in top right
- Click logo → "Sign Out" option available
- All interview features work normally

**Sign Out:**
1. Click logo
2. Click "Sign Out"
3. Redirected to `/login`

## 📍 Your Pages

| URL | Purpose |
|-----|---------|
| `/` or `/Main` | Main landing page |
| `/login` | Sign in with Google/LinkedIn/Email |
| `/profile` | Interview dashboard (protected) |

## 🔧 What Each Button Does

### Login Page:

**"Continue with Google":**
- Opens Google OAuth consent screen
- User signs in with Google
- Redirects to `/profile` on success

**"Continue with LinkedIn":**
- Opens LinkedIn OAuth (if enabled in Supabase)
- User signs in with LinkedIn
- Redirects to `/profile` on success

**"Continue with work email":**
- Prompts for email and password
- Signs in with Supabase email auth
- Redirects to `/profile` on success

### Dashboard Page:

**User Email Display:**
- Shows logged-in user's email in top right
- Only visible when authenticated

**Sign Out:**
- Available in logo dropdown menu
- Signs out user
- Redirects to `/login`

## 🔒 Security Features

✅ Session managed by Supabase  
✅ Automatic redirect if already logged in  
✅ Secure token handling  
✅ Keys stored server-side only  
✅ HTTPS required for production  

## 🐛 Troubleshooting

### "Failed to initialize authentication"
- Check `.env` file has all Supabase keys
- Restart server after adding keys

### "Google sign-in opens but doesn't redirect back"
- In Supabase Dashboard → Authentication → URL Configuration
- Add redirect URL: `http://localhost:3000/profile`
- Add site URL: `http://localhost:3000`

### "Email/Password not working"
- Email auth must be enabled in Supabase Dashboard
- User must be registered first

## 🎉 You're Ready!

Your authentication is fully set up and ready to use with Google OAuth! 🚀


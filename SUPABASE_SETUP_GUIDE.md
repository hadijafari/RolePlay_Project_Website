# 🗄️ Supabase Database Setup Guide

## Table 1: user_profiles

### 📋 What's Included:

**User Information:**
- ✅ ID (linked to auth.users)
- ✅ Email
- ✅ Full Name
- ✅ Phone
- ✅ Avatar URL
- ✅ Company
- ✅ Job Title
- ✅ LinkedIn URL
- ✅ Language (default: 'en')
- ✅ Timezone (default: 'UTC')
- ✅ Created At
- ✅ Updated At

**Automatic Features:**
- ✅ Auto-creates profile when user signs up
- ✅ Auto-updates `updated_at` timestamp
- ✅ Row Level Security (users can only see/edit their own profile)
- ✅ Indexes for fast queries

---

## 🚀 How to Create the Table:

### Method 1: SQL Editor (Recommended)

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project: `oalsgodlrixlwtnqnvsb`

2. **Open SQL Editor:**
   - Click **"SQL Editor"** in left sidebar
   - Click **"+ New Query"**

3. **Copy & Paste SQL:**
   - Open the file: `supabase_table_user_profiles.sql`
   - Copy ALL the SQL code
   - Paste into the SQL Editor

4. **Run the Script:**
   - Click **"Run"** button (or press Ctrl+Enter)
   - Wait for success message

5. **Verify:**
   - Go to **"Table Editor"** in left sidebar
   - You should see `user_profiles` table

---

### Method 2: Table Editor (Manual - Not Recommended)

You can manually create the table in Table Editor, but SQL is faster and includes triggers.

---

## ✅ What Happens After Running the SQL:

### 1. **Table Created:**
- `user_profiles` table appears in your database

### 2. **Automatic Profile Creation:**
- When a new user signs up (Google, LinkedIn, or Email)
- A profile is **automatically created** in `user_profiles`
- Email and name are populated from auth data

### 3. **Security Enabled:**
- Users can only access their own profile
- Protected by Row Level Security

### 4. **Triggers Active:**
- Auto-populates profile on signup
- Auto-updates `updated_at` on changes

---

## 🧪 Testing:

### After Creating the Table:

1. **Sign up a new user** on your website
2. **Go to Supabase** → Table Editor → `user_profiles`
3. **You should see** the new user's row with:
   - ID (matches auth.users ID)
   - Email
   - Full name (if provided)
   - Default language: 'en'
   - Default timezone: 'UTC'

---

## 📊 Viewing Data:

### In Supabase Dashboard:

**Table Editor:**
- Click **"Table Editor"**
- Select **"user_profiles"**
- See all users in a spreadsheet-like view
- Click any row to edit

**SQL Editor:**
```sql
-- View all profiles
SELECT * FROM public.user_profiles ORDER BY created_at DESC;

-- Count users
SELECT COUNT(*) FROM public.user_profiles;

-- View recent signups (last 7 days)
SELECT * FROM public.user_profiles 
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

---

## 🔐 Security Features:

### Row Level Security (RLS):
- ✅ Users can **view** their own profile
- ✅ Users can **update** their own profile
- ✅ Users can **delete** their own profile
- ❌ Users **cannot** see other users' profiles

### What This Means:
When you query from your app:
```javascript
const { data } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('id', user.id);
```
RLS automatically ensures users only get their own data!

---

## 🔄 Next Steps:

After Table 1 is created, we can add:
- **Table 2:** Subscriptions (plan_1, plan_2, plan_3)
- **Table 3:** Billing Information (Stripe integration)
- **Table 4:** Payment History
- **Table 5:** Interview Sessions
- **Table 6:** Affiliate/Referral System

---

## ⚠️ Important Notes:

1. **Run the ENTIRE SQL script** - don't run parts separately
2. **Check for success message** after running
3. **Refresh Table Editor** to see the new table
4. **Test with a signup** to verify auto-creation works

---

Ready to create Table 1? Just run the SQL script in Supabase! 🚀


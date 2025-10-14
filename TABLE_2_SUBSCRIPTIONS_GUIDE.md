# 📦 Table 2: Subscriptions - Setup Guide

## ✅ What's Included:

### All Requested Fields:
- ✅ `id` - UUID (primary key)
- ✅ `user_id` - UUID (references auth.users - same as Table 1)
- ✅ `email` - text
- ✅ `plan_type` - 'free', 'basic', 'pro', 'enterprise'
- ✅ `status` - 'active', 'cancelled', 'expired', 'trial'
- ✅ `start_date` - timestamp
- ✅ `end_date` - timestamp
- ✅ `trial_end_date` - timestamp (optional)
- ✅ `auto_renew` - boolean
- ✅ `interviews_remaining` - integer
- ✅ `interviews_used` - integer
- ✅ `created_at` - timestamp
- ✅ `updated_at` - timestamp

### Bonus Features Added:

**1. Automatic Free Trial:**
- New users automatically get:
  - Plan: `free`
  - Status: `trial`
  - Duration: 14 days
  - Interviews: 3 free

**2. Helper Functions:**
- `use_interview()` - Decrements interviews_remaining when user starts interview
- `check_expired_subscriptions()` - Auto-updates expired subscriptions

**3. Security:**
- Row Level Security enabled
- Users can only see/manage their own subscriptions

**4. Data Validation:**
- Plan types restricted to: free, basic, pro, enterprise
- Status restricted to: active, cancelled, expired, trial

---

## 🚀 How to Install:

### 1. Run the SQL:
1. Supabase Dashboard → **SQL Editor**
2. **New Query**
3. Copy ALL code from `supabase_table_subscriptions.sql`
4. Paste and **Run**

### 2. Verify:
1. **Table Editor** → `subscriptions` table should appear
2. Sign up a new user
3. Check `subscriptions` table → User should have free trial!

---

## 🎯 Automatic Subscription Flow:

### When User Signs Up:
```
1. User creates account
   ↓
2. Trigger creates user_profiles row
   ↓
3. Trigger creates subscriptions row with:
   - plan_type: 'free'
   - status: 'trial'
   - 14-day trial
   - 3 free interviews
```

---

## 💡 Plan Types (You Can Rename Later):

| Plan Type | Suggested Features |
|-----------|-------------------|
| `free` | 3 interviews/month, Basic features |
| `basic` | 10 interviews/month, Standard features |
| `pro` | 50 interviews/month, Advanced features |
| `enterprise` | Unlimited, All features + API access |

---

## 🔧 Useful Functions:

### 1. Use an Interview:
```sql
SELECT public.use_interview('user-id-here');
```
Returns `true` if successful, `false` if no interviews remaining.

### 2. Check Expired Subscriptions:
```sql
SELECT public.check_expired_subscriptions();
```
Updates all expired subscriptions to 'expired' status.

---

## 📊 Example Queries:

### Get User's Current Subscription:
```sql
SELECT * FROM public.subscriptions 
WHERE user_id = 'user-id-here' 
AND status IN ('active', 'trial')
ORDER BY created_at DESC 
LIMIT 1;
```

### Check Interviews Remaining:
```sql
SELECT 
    plan_type,
    interviews_remaining,
    interviews_used,
    end_date
FROM public.subscriptions 
WHERE user_id = 'user-id-here' 
AND status IN ('active', 'trial');
```

### Upgrade User to Pro:
```sql
UPDATE public.subscriptions
SET 
    plan_type = 'pro',
    status = 'active',
    end_date = NOW() + INTERVAL '30 days',
    interviews_remaining = 50,
    auto_renew = true
WHERE user_id = 'user-id-here'
AND status IN ('active', 'trial');
```

---

## 🔗 Relationship to Other Tables:

```
auth.users (Supabase Auth)
    ↓ (user_id)
user_profiles (Table 1) ← Same user_id
    ↓ (user_id)
subscriptions (Table 2) ← Same user_id
    ↓ (user_id)
billing_information (Table 3) ← Same user_id
    ↓ (user_id)
interview_sessions (Table 5) ← Same user_id
```

All tables use the **same `user_id`** from `auth.users`!

---

## ⚠️ Important Notes:

1. **Run Table 1 FIRST** before Table 2
   - Table 2 trigger depends on Table 1 existing

2. **Default Trial:**
   - New users get 14-day free trial
   - 3 interviews included
   - Auto-expires after 14 days

3. **Interview Tracking:**
   - Use `use_interview()` function when user starts interview
   - Automatically tracks usage

---

## 🎉 Ready to Install:

**Run the SQL script in Supabase SQL Editor!**

After installation, every new user will automatically get:
- ✅ User profile (Table 1)
- ✅ Free trial subscription (Table 2)

Let me know when Table 2 is installed and ready for Table 3! 🚀


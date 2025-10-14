# 💳 Table 3: Billing Information - Setup Guide

## ✅ What's Included:

### All Requested Fields:
- ✅ `id` - UUID (primary key)
- ✅ `user_id` - UUID (references auth.users - SAME as Tables 1 & 2)
- ✅ `email` - text
- ✅ `stripe_customer_id` - text (unique)
- ✅ `payment_method` - text (card/paypal/etc.)
- ✅ `billing_email` - text
- ✅ `billing_name` - text
- ✅ `billing_address` - JSONB (full address)
- ✅ `tax_id` - text (optional)
- ✅ `created_at` - timestamp
- ✅ `updated_at` - timestamp

---

## 🎯 Key Features:

### 1. Stripe Integration Ready:
- `stripe_customer_id` field stores Stripe customer ID
- Unique constraint ensures one billing record per Stripe customer

### 2. Flexible Address Storage:
`billing_address` is JSONB - can store:
```json
{
  "street": "123 Main St",
  "apartment": "Apt 4B",
  "city": "San Francisco",
  "state": "CA",
  "postal_code": "94102",
  "country": "USA"
}
```

### 3. One Billing Record Per User:
- Unique constraint on `user_id`
- Each user can only have one billing record

### 4. Helper Function:
```sql
SELECT public.upsert_billing_info(
    user_id,
    email,
    stripe_customer_id,
    payment_method,
    billing_email,
    billing_name,
    billing_address,
    tax_id
);
```
- Creates new or updates existing billing info
- Returns billing record ID

---

## 🚀 How to Install:

1. **Supabase Dashboard** → **SQL Editor** → **New Query**
2. Copy from `supabase_table_billing_information.sql`
3. Paste and **Run** ▶️
4. Check **Table Editor** → `billing_information` appears

---

## 🚀 Auto-Creation on User Registration:

### ✅ Automatic Billing Record Creation:
When a user registers (Google, LinkedIn, or Email), the system automatically:
1. Creates `user_profiles` record (Table 1)
2. Creates `subscriptions` record with free trial (Table 2)  
3. Creates `billing_information` record (Table 3) ← **NEW!**

### 📋 What Gets Auto-Created:
```sql
-- Automatically populated on user signup:
user_id: NEW.id (from auth.users)
email: NEW.email (from auth.users)
billing_email: NEW.email (same as account email)
billing_name: NEW.raw_user_meta_data->>'full_name' (if available)
```

### 💳 When to Update Billing Records:

#### Scenario 1: User Adds Payment Method
1. User goes to billing settings
2. Adds credit card via Stripe
3. Update existing record with `stripe_customer_id`

#### Scenario 2: User Updates Billing Info
1. User changes billing address
2. User adds tax ID
3. Update existing record

---

## 🔗 Relationship with Other Tables:

```
auth.users
    ↓ (same user_id)
user_profiles (Table 1)
    ↓ (same user_id)
subscriptions (Table 2)
    ↓ (same user_id)
billing_information (Table 3) ← You are here
    ↓
payment_history (Table 4) ← Next
```

---

## 📊 Example Usage:

### Update Billing Info When User Adds Payment:
```javascript
// In your app after Stripe checkout (record already exists from signup)
const { data, error } = await supabase
  .from('billing_information')
  .update({
    stripe_customer_id: 'cus_stripe123',
    payment_method: 'card',
    billing_name: 'John Doe',
    billing_address: {
      street: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      postal_code: '94102',
      country: 'USA'
    }
  })
  .eq('user_id', user.id);
```

### Update Stripe Customer ID:
```javascript
const { data, error } = await supabase
  .from('billing_information')
  .update({ stripe_customer_id: 'cus_new123' })
  .eq('user_id', user.id);
```

### Get User's Billing Info:
```javascript
const { data, error } = await supabase
  .from('billing_information')
  .select('*')
  .eq('user_id', user.id)
  .single();
```

---

## 🔐 Security:

**Row Level Security enabled:**
- ✅ Users can only see their own billing info
- ✅ Users can only update their own billing info
- ❌ Users cannot see other users' billing info

**Sensitive data protected!**

---

## 🧪 Testing:

After installation:
1. Create billing record for a test user
2. Verify Stripe customer ID is unique
3. Test address JSON structure
4. Verify RLS (try accessing another user's billing - should fail)

---

## ⚠️ Important:

**DO NOT store credit card numbers directly!**
- ✅ Use Stripe customer ID
- ✅ Let Stripe handle card details
- ✅ Only store payment method type ('card', 'paypal')

---

Ready to install Table 3? Run the SQL in Supabase! 💳


# 💳 Table 4: Payment History - Setup Guide

## ✅ What's Included:

### All Requested Fields:
- ✅ `id` - UUID (primary key)
- ✅ `user_id` - UUID (references auth.users - SAME as other tables)
- ✅ `email` - text (SAME as other tables)
- ✅ `subscription_id` - UUID (references subscriptions)
- ✅ `amount` - decimal (10,2 precision)
- ✅ `currency` - text (USD, EUR, GBP, CAD, AUD, JPY)
- ✅ `payment_status` - text (succeeded, pending, failed, refunded, cancelled)
- ✅ `payment_method` - text
- ✅ `stripe_payment_id` - text (optional)
- ✅ `invoice_url` - text (optional)
- ✅ `payment_date` - timestamp
- ✅ `created_at` - timestamp

---

## 🎯 Key Features:

### 1. Stripe Integration Ready:
- `stripe_payment_id` field stores Stripe payment intent ID
- Links to Stripe dashboard for payment tracking

### 2. Subscription Linking:
- `subscription_id` references the subscriptions table
- Track which subscription each payment is for

### 3. Multiple Currency Support:
Supported currencies: USD, EUR, GBP, CAD, AUD, JPY

### 4. Payment Status Tracking:
- `succeeded` - Payment completed successfully
- `pending` - Payment processing
- `failed` - Payment failed
- `refunded` - Payment was refunded
- `cancelled` - Payment was cancelled

### 5. Helper Functions:
```sql
-- Record a new payment
SELECT public.record_payment(
    user_id,
    subscription_id,
    email,
    amount,
    currency,
    payment_status,
    payment_method,
    stripe_payment_id,
    invoice_url
);

-- Get user's payment history
SELECT * FROM public.get_user_payment_history(user_id);
```

---

## 🚀 How to Install:

1. **Supabase Dashboard** → **SQL Editor** → **New Query**
2. Copy from `supabase_table_payment_history.sql`
3. Paste and **Run** ▶️
4. Check **Table Editor** → `payment_history` appears

---

## 💡 When to Create Payment Records:

### Scenario 1: Successful Payment
1. User completes Stripe checkout
2. Stripe webhook confirms payment
3. Record payment with `succeeded` status
4. Update subscription status

### Scenario 2: Failed Payment
1. Stripe checkout fails
2. Record payment with `failed` status
3. Keep subscription as `trial` or `expired`

### Scenario 3: Refund Processing
1. Admin processes refund in Stripe
2. Update payment status to `refunded`
3. Update subscription if needed

---

## 🔗 Relationship with Other Tables:

```
auth.users
    ↓ (same user_id)
user_profiles (Table 1)
    ↓ (same user_id)
subscriptions (Table 2)
    ↓ (subscription_id)
payment_history (Table 4) ← You are here
    ↓
interview_sessions (Table 5 - next)
```

---

## 📊 Example Usage:

### Record Successful Payment:
```javascript
// After successful Stripe payment
const { data, error } = await supabase
  .rpc('record_payment', {
    p_user_id: user.id,
    p_subscription_id: subscription.id,
    p_email: user.email,
    p_amount: 29.99,
    p_currency: 'USD',
    p_payment_status: 'succeeded',
    p_payment_method: 'card',
    p_stripe_payment_id: 'pi_stripe123456',
    p_invoice_url: 'https://invoice.example.com/inv_123'
  });
```

### Get User's Payment History:
```javascript
const { data, error } = await supabase
  .rpc('get_user_payment_history', {
    p_user_id: user.id
  });
```

### Update Payment Status (Refund):
```javascript
const { data, error } = await supabase
  .from('payment_history')
  .update({ payment_status: 'refunded' })
  .eq('stripe_payment_id', 'pi_stripe123456');
```

---

## 🔐 Security:

**Row Level Security enabled:**
- ✅ Users can only see their own payment history
- ✅ Users can only insert their own payments
- ✅ Users can only update their own payments
- ❌ Users cannot see other users' payment history

**Financial data protected!**

---

## 🧪 Testing:

After installation:
1. Record a test payment
2. Verify currency constraints work
3. Test payment status updates
4. Verify RLS (try accessing another user's payments - should fail)

---

## 📈 Analytics Queries:

### Total Revenue:
```sql
SELECT 
    SUM(amount) as total_revenue,
    currency
FROM public.payment_history 
WHERE payment_status = 'succeeded'
GROUP BY currency;
```

### User Payment Summary:
```sql
SELECT 
    user_id,
    COUNT(*) as total_payments,
    SUM(amount) as total_spent,
    MAX(payment_date) as last_payment
FROM public.payment_history 
WHERE payment_status = 'succeeded'
GROUP BY user_id;
```

### Monthly Revenue:
```sql
SELECT 
    DATE_TRUNC('month', payment_date) as month,
    SUM(amount) as monthly_revenue
FROM public.payment_history 
WHERE payment_status = 'succeeded'
GROUP BY month
ORDER BY month DESC;
```

---

## ⚠️ Important:

**DO NOT store credit card numbers directly!**
- ✅ Use Stripe payment intent ID
- ✅ Let Stripe handle card details
- ✅ Only store payment method type ('card', 'paypal')

---

## 🎁 Bonus Features:

**1. Decimal Precision:**
- Amount stored with 2 decimal places
- No rounding errors in financial calculations

**2. Multiple Currency Support:**
- 6 major currencies supported
- Easy to add more if needed

**3. Comprehensive Status Tracking:**
- Track payment lifecycle from pending to succeeded/failed
- Handle refunds and cancellations

**4. Subscription Linking:**
- Each payment linked to specific subscription
- Easy to track which plan was paid for

---

Ready to install Table 4? Run the SQL in Supabase! 💳

---

## 📋 Progress:

✅ **Table 1:** user_profiles - CREATED  
✅ **Table 2:** subscriptions (plan_1, plan_2, plan_3) - CREATED  
✅ **Table 3:** billing_information (Stripe ready) - CREATED  
✅ **Table 4:** payment_history (Transaction records) - CREATED  
⏳ **Table 5:** interview_sessions (with scoring) - Next  
⏳ **Table 6:** affiliate/referral - Later

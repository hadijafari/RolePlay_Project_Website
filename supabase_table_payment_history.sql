-- ================================================
-- Table 4: payment_history (CLEAN VERSION)
-- Transaction records for all payments
-- Safe to run multiple times - handles existing objects
-- ================================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own payment history" ON public.payment_history;
DROP POLICY IF EXISTS "Users can insert own payment history" ON public.payment_history;
DROP POLICY IF EXISTS "Users can update own payment history" ON public.payment_history;
DROP POLICY IF EXISTS "Users can delete own payment history" ON public.payment_history;

-- Drop existing triggers
DROP TRIGGER IF EXISTS on_payment_history_updated ON public.payment_history;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.handle_payment_history_updated_at();
DROP FUNCTION IF EXISTS public.record_payment(UUID, UUID, TEXT, DECIMAL, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_user_payment_history(UUID);

-- Create the payment_history table
CREATE TABLE IF NOT EXISTS public.payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY')),
    payment_status TEXT NOT NULL CHECK (payment_status IN ('succeeded', 'pending', 'failed', 'refunded', 'cancelled')),
    payment_method TEXT,
    stripe_payment_id TEXT,
    invoice_url TEXT,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments to describe the table and columns
COMMENT ON TABLE public.payment_history IS 'Transaction records for all user payments';
COMMENT ON COLUMN public.payment_history.id IS 'Payment record ID (unique identifier)';
COMMENT ON COLUMN public.payment_history.user_id IS 'User ID (references auth.users - same as other tables)';
COMMENT ON COLUMN public.payment_history.email IS 'User email address (for quick reference)';
COMMENT ON COLUMN public.payment_history.subscription_id IS 'Subscription ID (references subscriptions table)';
COMMENT ON COLUMN public.payment_history.amount IS 'Payment amount (decimal with 2 decimal places)';
COMMENT ON COLUMN public.payment_history.currency IS 'Currency code (USD, EUR, GBP, CAD, AUD, JPY)';
COMMENT ON COLUMN public.payment_history.payment_status IS 'Payment status: succeeded, pending, failed, refunded, cancelled';
COMMENT ON COLUMN public.payment_history.payment_method IS 'Payment method used (card, paypal, etc.)';
COMMENT ON COLUMN public.payment_history.stripe_payment_id IS 'Stripe payment intent ID (optional)';
COMMENT ON COLUMN public.payment_history.invoice_url IS 'Invoice URL for download (optional)';
COMMENT ON COLUMN public.payment_history.payment_date IS 'When payment was processed';
COMMENT ON COLUMN public.payment_history.created_at IS 'When payment record was created';

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_payment_user_id ON public.payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_email ON public.payment_history(email);
CREATE INDEX IF NOT EXISTS idx_payment_subscription_id ON public.payment_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_status ON public.payment_history(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_date ON public.payment_history(payment_date);
CREATE INDEX IF NOT EXISTS idx_payment_stripe_id ON public.payment_history(stripe_payment_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view own payment history"
    ON public.payment_history
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment history"
    ON public.payment_history
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment history"
    ON public.payment_history
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment history"
    ON public.payment_history
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_payment_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update created_at
CREATE TRIGGER on_payment_history_updated
    BEFORE UPDATE ON public.payment_history
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_payment_history_updated_at();

-- ================================================
-- Helper Functions
-- ================================================

-- Function to record a new payment
CREATE OR REPLACE FUNCTION public.record_payment(
    p_user_id UUID,
    p_subscription_id UUID,
    p_email TEXT,
    p_amount DECIMAL,
    p_currency TEXT DEFAULT 'USD',
    p_payment_status TEXT DEFAULT 'pending',
    p_payment_method TEXT DEFAULT NULL,
    p_stripe_payment_id TEXT DEFAULT NULL,
    p_invoice_url TEXT DEFAULT NULL,
    p_payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS UUID AS $$
DECLARE
    v_payment_id UUID;
BEGIN
    INSERT INTO public.payment_history (
        user_id,
        subscription_id,
        email,
        amount,
        currency,
        payment_status,
        payment_method,
        stripe_payment_id,
        invoice_url,
        payment_date
    )
    VALUES (
        p_user_id,
        p_subscription_id,
        p_email,
        p_amount,
        p_currency,
        p_payment_status,
        p_payment_method,
        p_stripe_payment_id,
        p_invoice_url,
        p_payment_date
    )
    RETURNING id INTO v_payment_id;
    
    RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's payment history
CREATE OR REPLACE FUNCTION public.get_user_payment_history(p_user_id UUID)
RETURNS TABLE (
    payment_id UUID,
    amount DECIMAL,
    currency TEXT,
    payment_status TEXT,
    payment_method TEXT,
    payment_date TIMESTAMP WITH TIME ZONE,
    subscription_plan TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ph.id,
        ph.amount,
        ph.currency,
        ph.payment_status,
        ph.payment_method,
        ph.payment_date,
        s.plan_type
    FROM public.payment_history ph
    LEFT JOIN public.subscriptions s ON ph.subscription_id = s.id
    WHERE ph.user_id = p_user_id
    ORDER BY ph.payment_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- Example Usage Scenarios
-- ================================================

-- Example 1: Record successful payment
-- SELECT public.record_payment(
--     'user-id-here',
--     'subscription-id-here',
--     'user@example.com',
--     29.99,
--     'USD',
--     'succeeded',
--     'card',
--     'pi_stripe123456',
--     'https://invoice.example.com/inv_123'
-- );

-- Example 2: Record failed payment
-- SELECT public.record_payment(
--     'user-id-here',
--     'subscription-id-here',
--     'user@example.com',
--     29.99,
--     'USD',
--     'failed',
--     'card',
--     'pi_stripe123456'
-- );

-- Example 3: Record refund
-- UPDATE public.payment_history 
-- SET payment_status = 'refunded' 
-- WHERE stripe_payment_id = 'pi_stripe123456';

-- ================================================
-- Verification Queries (Run these to test)
-- ================================================

-- View all payment history
-- SELECT * FROM public.payment_history ORDER BY payment_date DESC;

-- View payment history with subscription details
-- SELECT 
--     ph.*,
--     s.plan_type,
--     s.status as subscription_status
-- FROM public.payment_history ph
-- LEFT JOIN public.subscriptions s ON ph.subscription_id = s.id
-- ORDER BY ph.payment_date DESC;

-- Get user's payment history
-- SELECT * FROM public.payment_history WHERE user_id = 'user-id-here';

-- Get successful payments only
-- SELECT * FROM public.payment_history WHERE payment_status = 'succeeded';

-- Get payments by date range
-- SELECT * FROM public.payment_history 
-- WHERE payment_date BETWEEN '2024-01-01' AND '2024-12-31';

-- Get total revenue by currency
-- SELECT 
--     currency,
--     COUNT(*) as payment_count,
--     SUM(amount) as total_amount
-- FROM public.payment_history 
-- WHERE payment_status = 'succeeded'
-- GROUP BY currency;

-- Get user's total spent
-- SELECT 
--     user_id,
--     SUM(amount) as total_spent,
--     COUNT(*) as payment_count
-- FROM public.payment_history 
-- WHERE payment_status = 'succeeded'
-- GROUP BY user_id;

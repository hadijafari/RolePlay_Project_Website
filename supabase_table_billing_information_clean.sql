-- ================================================
-- Table 3: billing_information (CLEAN VERSION)
-- Payment and billing details for Stripe integration
-- Safe to run multiple times - handles existing objects
-- ================================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own billing info" ON public.billing_information;
DROP POLICY IF EXISTS "Users can insert own billing info" ON public.billing_information;
DROP POLICY IF EXISTS "Users can update own billing info" ON public.billing_information;
DROP POLICY IF EXISTS "Users can delete own billing info" ON public.billing_information;

-- Drop existing triggers
DROP TRIGGER IF EXISTS on_billing_updated ON public.billing_information;
DROP TRIGGER IF EXISTS on_auth_user_created_billing ON auth.users;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.handle_billing_updated_at();
DROP FUNCTION IF EXISTS public.handle_new_user_billing();
DROP FUNCTION IF EXISTS public.upsert_billing_info(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT);

-- Create the billing_information table
CREATE TABLE IF NOT EXISTS public.billing_information (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    stripe_customer_id TEXT UNIQUE,
    payment_method TEXT CHECK (payment_method IN ('card', 'paypal', 'bank_transfer', 'other')),
    billing_email TEXT,
    billing_name TEXT,
    billing_address JSONB,
    tax_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_billing UNIQUE (user_id)
);

-- Add comments to describe the table and columns
COMMENT ON TABLE public.billing_information IS 'Billing and payment information for users';
COMMENT ON COLUMN public.billing_information.id IS 'Billing record ID (unique identifier)';
COMMENT ON COLUMN public.billing_information.user_id IS 'User ID (references auth.users - same as user_profiles and subscriptions)';
COMMENT ON COLUMN public.billing_information.email IS 'User email address (for quick reference)';
COMMENT ON COLUMN public.billing_information.stripe_customer_id IS 'Stripe customer ID for payment processing';
COMMENT ON COLUMN public.billing_information.payment_method IS 'Payment method: card, paypal, bank_transfer, other';
COMMENT ON COLUMN public.billing_information.billing_email IS 'Email for billing notifications (can differ from account email)';
COMMENT ON COLUMN public.billing_information.billing_name IS 'Name on billing account';
COMMENT ON COLUMN public.billing_information.billing_address IS 'Full billing address as JSON object';
COMMENT ON COLUMN public.billing_information.tax_id IS 'Tax ID or VAT number (optional)';
COMMENT ON COLUMN public.billing_information.created_at IS 'When billing info was created';
COMMENT ON COLUMN public.billing_information.updated_at IS 'Last update timestamp';

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_billing_user_id ON public.billing_information(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_email ON public.billing_information(email);
CREATE INDEX IF NOT EXISTS idx_billing_stripe_customer_id ON public.billing_information(stripe_customer_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.billing_information ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view own billing info"
    ON public.billing_information
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own billing info"
    ON public.billing_information
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own billing info"
    ON public.billing_information
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own billing info"
    ON public.billing_information
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_billing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update updated_at
CREATE TRIGGER on_billing_updated
    BEFORE UPDATE ON public.billing_information
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_billing_updated_at();

-- ================================================
-- Auto-Create Billing Record on User Registration
-- ================================================

-- Function to automatically create billing record when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_billing()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create if billing record doesn't already exist
    IF NOT EXISTS (SELECT 1 FROM public.billing_information WHERE user_id = NEW.id) THEN
        INSERT INTO public.billing_information (
            user_id,
            email,
            billing_email,
            billing_name
        )
        VALUES (
            NEW.id,
            NEW.email,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', '')
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create billing record on user registration
CREATE TRIGGER on_auth_user_created_billing
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_billing();

-- ================================================
-- Helper Functions
-- ================================================

-- Function to create or update billing information
CREATE OR REPLACE FUNCTION public.upsert_billing_info(
    p_user_id UUID,
    p_email TEXT,
    p_stripe_customer_id TEXT DEFAULT NULL,
    p_payment_method TEXT DEFAULT NULL,
    p_billing_email TEXT DEFAULT NULL,
    p_billing_name TEXT DEFAULT NULL,
    p_billing_address JSONB DEFAULT NULL,
    p_tax_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_billing_id UUID;
BEGIN
    INSERT INTO public.billing_information (
        user_id,
        email,
        stripe_customer_id,
        payment_method,
        billing_email,
        billing_name,
        billing_address,
        tax_id
    )
    VALUES (
        p_user_id,
        p_email,
        p_stripe_customer_id,
        p_payment_method,
        p_billing_email,
        p_billing_name,
        p_billing_address,
        p_tax_id
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
        stripe_customer_id = COALESCE(EXCLUDED.stripe_customer_id, public.billing_information.stripe_customer_id),
        payment_method = COALESCE(EXCLUDED.payment_method, public.billing_information.payment_method),
        billing_email = COALESCE(EXCLUDED.billing_email, public.billing_information.billing_email),
        billing_name = COALESCE(EXCLUDED.billing_name, public.billing_information.billing_name),
        billing_address = COALESCE(EXCLUDED.billing_address, public.billing_information.billing_address),
        tax_id = COALESCE(EXCLUDED.tax_id, public.billing_information.tax_id),
        updated_at = NOW()
    RETURNING id INTO v_billing_id;
    
    RETURN v_billing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- Example billing_address JSON structure:
-- ================================================
-- {
--   "street": "123 Main St",
--   "apartment": "Apt 4B",
--   "city": "San Francisco",
--   "state": "CA",
--   "postal_code": "94102",
--   "country": "USA"
-- }

-- ================================================
-- Verification Queries (Run these to test)
-- ================================================

-- View all billing information
-- SELECT * FROM public.billing_information ORDER BY created_at DESC;

-- View billing info with user details
-- SELECT 
--     b.*,
--     p.full_name,
--     p.company
-- FROM public.billing_information b
-- JOIN public.user_profiles p ON b.user_id = p.id
-- ORDER BY b.created_at DESC;

-- Get user's billing info
-- SELECT * FROM public.billing_information WHERE user_id = 'user-id-here';

-- Count users with Stripe customer ID
-- SELECT COUNT(*) FROM public.billing_information WHERE stripe_customer_id IS NOT NULL;

-- Example: Insert billing info with address
-- INSERT INTO public.billing_information (
--     user_id,
--     email,
--     stripe_customer_id,
--     payment_method,
--     billing_email,
--     billing_name,
--     billing_address,
--     tax_id
-- ) VALUES (
--     'user-id-here',
--     'user@example.com',
--     'cus_stripe123456',
--     'card',
--     'billing@example.com',
--     'John Doe',
--     '{"street": "123 Main St", "city": "San Francisco", "state": "CA", "postal_code": "94102", "country": "USA"}',
--     'US123456789'
-- );

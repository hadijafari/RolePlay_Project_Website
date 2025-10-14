-- ================================================
-- Table 2: subscriptions
-- Subscription and plan management
-- ================================================

-- Create the subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'basic', 'pro', 'enterprise')),
    status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'trial')) DEFAULT 'trial',
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    trial_end_date TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT false,
    interviews_remaining INTEGER DEFAULT 0,
    interviews_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments to describe the table and columns
COMMENT ON TABLE public.subscriptions IS 'User subscription plans and usage tracking';
COMMENT ON COLUMN public.subscriptions.id IS 'Subscription ID (unique identifier)';
COMMENT ON COLUMN public.subscriptions.user_id IS 'User ID (references auth.users - same as user_profiles)';
COMMENT ON COLUMN public.subscriptions.email IS 'User email address (for quick reference)';
COMMENT ON COLUMN public.subscriptions.plan_type IS 'Subscription plan: free, basic, pro, or enterprise';
COMMENT ON COLUMN public.subscriptions.status IS 'Subscription status: active, cancelled, expired, or trial';
COMMENT ON COLUMN public.subscriptions.start_date IS 'Subscription start date';
COMMENT ON COLUMN public.subscriptions.end_date IS 'Subscription end/expiry date';
COMMENT ON COLUMN public.subscriptions.trial_end_date IS 'Trial period end date (if applicable)';
COMMENT ON COLUMN public.subscriptions.auto_renew IS 'Whether subscription auto-renews';
COMMENT ON COLUMN public.subscriptions.interviews_remaining IS 'Number of interviews remaining in current period';
COMMENT ON COLUMN public.subscriptions.interviews_used IS 'Total interviews used';
COMMENT ON COLUMN public.subscriptions.created_at IS 'When subscription was created';
COMMENT ON COLUMN public.subscriptions.updated_at IS 'Last update timestamp';

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON public.subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_type ON public.subscriptions(plan_type);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON public.subscriptions(end_date);

-- Create index for active subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_active ON public.subscriptions(user_id, status) 
WHERE status = 'active';

-- Enable Row Level Security (RLS)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Policy 1: Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
    ON public.subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own subscriptions (for initial free plan)
CREATE POLICY "Users can insert own subscriptions"
    ON public.subscriptions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions"
    ON public.subscriptions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create a function to automatically create a free trial subscription for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
    -- Create a free trial subscription for new user
    INSERT INTO public.subscriptions (
        user_id, 
        email, 
        plan_type, 
        status, 
        start_date, 
        trial_end_date,
        end_date,
        interviews_remaining,
        interviews_used
    )
    VALUES (
        NEW.id,
        NEW.email,
        'free',
        'trial',
        NOW(),
        NOW() + INTERVAL '14 days', -- 14-day free trial
        NOW() + INTERVAL '14 days',
        3, -- 3 free interviews during trial
        0
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to create subscription when user profile is created
DROP TRIGGER IF EXISTS on_user_profile_created ON public.user_profiles;
CREATE TRIGGER on_user_profile_created
    AFTER INSERT ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_subscription();

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update updated_at
DROP TRIGGER IF EXISTS on_subscription_updated ON public.subscriptions;
CREATE TRIGGER on_subscription_updated
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_subscription_updated_at();

-- Create a function to check and update expired subscriptions
CREATE OR REPLACE FUNCTION public.check_expired_subscriptions()
RETURNS void AS $$
BEGIN
    UPDATE public.subscriptions
    SET status = 'expired'
    WHERE status IN ('active', 'trial')
    AND end_date < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to decrement interviews_remaining
CREATE OR REPLACE FUNCTION public.use_interview(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_remaining INTEGER;
BEGIN
    -- Get current subscription
    SELECT interviews_remaining INTO v_remaining
    FROM public.subscriptions
    WHERE user_id = p_user_id
    AND status IN ('active', 'trial')
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Check if user has interviews remaining
    IF v_remaining IS NULL OR v_remaining <= 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Decrement remaining and increment used
    UPDATE public.subscriptions
    SET 
        interviews_remaining = interviews_remaining - 1,
        interviews_used = interviews_used + 1
    WHERE user_id = p_user_id
    AND status IN ('active', 'trial')
    AND interviews_remaining > 0;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- Verification Queries (Run these to test)
-- ================================================

-- View all subscriptions
-- SELECT * FROM public.subscriptions ORDER BY created_at DESC;

-- View active subscriptions
-- SELECT * FROM public.subscriptions WHERE status = 'active' ORDER BY created_at DESC;

-- View subscriptions by plan type
-- SELECT plan_type, COUNT(*) as count FROM public.subscriptions GROUP BY plan_type;

-- Check a specific user's subscription
-- SELECT * FROM public.subscriptions WHERE user_id = 'your-user-id-here';

-- View expiring soon (next 7 days)
-- SELECT * FROM public.subscriptions 
-- WHERE status = 'active' 
-- AND end_date < NOW() + INTERVAL '7 days'
-- ORDER BY end_date;

-- Check subscription status with user info
-- SELECT 
--     s.*,
--     p.full_name,
--     p.company
-- FROM public.subscriptions s
-- JOIN public.user_profiles p ON s.user_id = p.id
-- ORDER BY s.created_at DESC;


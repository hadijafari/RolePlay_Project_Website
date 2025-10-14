-- ================================================
-- Table 1: user_profiles
-- Extended user information and preferences
-- ================================================

-- Create the user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    company TEXT,
    job_title TEXT,
    linkedin_url TEXT,
    language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments to describe the table and columns
COMMENT ON TABLE public.user_profiles IS 'Extended user profile information for AI Mock Interview platform';
COMMENT ON COLUMN public.user_profiles.id IS 'User ID (references auth.users)';
COMMENT ON COLUMN public.user_profiles.email IS 'User email address';
COMMENT ON COLUMN public.user_profiles.full_name IS 'User full name';
COMMENT ON COLUMN public.user_profiles.phone IS 'User phone number';
COMMENT ON COLUMN public.user_profiles.avatar_url IS 'URL to user profile picture';
COMMENT ON COLUMN public.user_profiles.company IS 'Current or target company';
COMMENT ON COLUMN public.user_profiles.job_title IS 'Current or target job title';
COMMENT ON COLUMN public.user_profiles.linkedin_url IS 'LinkedIn profile URL';
COMMENT ON COLUMN public.user_profiles.language IS 'Preferred language (ISO 639-1 code)';
COMMENT ON COLUMN public.user_profiles.timezone IS 'User timezone (IANA timezone format)';

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- Create index for faster lookups by created date
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON public.user_profiles(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.user_profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Policy 2: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
    ON public.user_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Policy 3: Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.user_profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy 4: Users can delete their own profile
CREATE POLICY "Users can delete own profile"
    ON public.user_profiles
    FOR DELETE
    USING (auth.uid() = id);

-- Create a function to automatically create a user profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update updated_at
DROP TRIGGER IF EXISTS on_user_profile_updated ON public.user_profiles;
CREATE TRIGGER on_user_profile_updated
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ================================================
-- Verification Queries (Run these to test)
-- ================================================

-- View all user profiles
-- SELECT * FROM public.user_profiles ORDER BY created_at DESC;

-- Count total users
-- SELECT COUNT(*) as total_users FROM public.user_profiles;

-- View users by language
-- SELECT language, COUNT(*) as count FROM public.user_profiles GROUP BY language;


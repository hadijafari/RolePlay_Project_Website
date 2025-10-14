-- ================================================
-- Table 5: interview_sessions (FRESH START)
-- Interview session records with scoring and feedback
-- Safe to run from scratch - no existing objects
-- ================================================

-- Create the interview_sessions table
CREATE TABLE public.interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    session_id TEXT NOT NULL UNIQUE,
    resume_filename TEXT,
    job_description_filename TEXT,
    interview_status TEXT NOT NULL DEFAULT 'in_progress' CHECK (interview_status IN ('completed', 'in_progress', 'cancelled')),
    total_questions INTEGER DEFAULT 0,
    questions_answered INTEGER DEFAULT 0,
    duration_minutes INTEGER DEFAULT 0,
    score DECIMAL(5,2),
    feedback JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Add comments to describe the table and columns
COMMENT ON TABLE public.interview_sessions IS 'Interview session records with scoring and feedback';
COMMENT ON COLUMN public.interview_sessions.id IS 'Interview session ID (unique identifier)';
COMMENT ON COLUMN public.interview_sessions.user_id IS 'User ID (references auth.users - same as other tables)';
COMMENT ON COLUMN public.interview_sessions.email IS 'User email address (for quick reference)';
COMMENT ON COLUMN public.interview_sessions.session_id IS 'Session ID from backend API (unique)';
COMMENT ON COLUMN public.interview_sessions.resume_filename IS 'Resume file name used in interview';
COMMENT ON COLUMN public.interview_sessions.job_description_filename IS 'Job description file name used in interview';
COMMENT ON COLUMN public.interview_sessions.interview_status IS 'Interview status: completed, in_progress, cancelled';
COMMENT ON COLUMN public.interview_sessions.total_questions IS 'Total number of questions in interview';
COMMENT ON COLUMN public.interview_sessions.questions_answered IS 'Number of questions answered by user';
COMMENT ON COLUMN public.interview_sessions.duration_minutes IS 'Interview duration in minutes';
COMMENT ON COLUMN public.interview_sessions.score IS 'Interview score (0-100, optional)';
COMMENT ON COLUMN public.interview_sessions.feedback IS 'AI feedback data as JSON object';
COMMENT ON COLUMN public.interview_sessions.created_at IS 'When interview session was created';
COMMENT ON COLUMN public.interview_sessions.completed_at IS 'When interview was completed (optional)';

-- Create indexes for faster queries
CREATE INDEX idx_interview_user_id ON public.interview_sessions(user_id);
CREATE INDEX idx_interview_email ON public.interview_sessions(email);
CREATE INDEX idx_interview_session_id ON public.interview_sessions(session_id);
CREATE INDEX idx_interview_status ON public.interview_sessions(interview_status);
CREATE INDEX idx_interview_created_at ON public.interview_sessions(created_at);
CREATE INDEX idx_interview_completed_at ON public.interview_sessions(completed_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view own interview sessions"
    ON public.interview_sessions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interview sessions"
    ON public.interview_sessions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interview sessions"
    ON public.interview_sessions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own interview sessions"
    ON public.interview_sessions
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create a function to automatically update completed_at when status changes
CREATE OR REPLACE FUNCTION public.handle_interview_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Set completed_at when status changes to 'completed'
    IF NEW.interview_status = 'completed' AND OLD.interview_status != 'completed' THEN
        NEW.completed_at = NOW();
    END IF;
    
    -- Clear completed_at when status changes away from 'completed'
    IF NEW.interview_status != 'completed' AND OLD.interview_status = 'completed' THEN
        NEW.completed_at = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to handle completion timestamp
CREATE TRIGGER on_interview_status_change
    BEFORE UPDATE ON public.interview_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_interview_completion();

-- ================================================
-- Helper Functions
-- ================================================

-- Function to create a new interview session
CREATE OR REPLACE FUNCTION public.create_interview_session(
    p_user_id UUID,
    p_email TEXT,
    p_session_id TEXT,
    p_resume_filename TEXT DEFAULT NULL,
    p_job_description_filename TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_session_id UUID;
BEGIN
    INSERT INTO public.interview_sessions (
        user_id,
        email,
        session_id,
        resume_filename,
        job_description_filename,
        interview_status,
        total_questions,
        questions_answered,
        duration_minutes
    )
    VALUES (
        p_user_id,
        p_email,
        p_session_id,
        p_resume_filename,
        p_job_description_filename,
        'in_progress',
        0,
        0,
        0
    )
    RETURNING id INTO v_session_id;
    
    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update interview progress
CREATE OR REPLACE FUNCTION public.update_interview_progress(
    p_session_id TEXT,
    p_questions_answered INTEGER,
    p_duration_minutes INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.interview_sessions
    SET 
        questions_answered = p_questions_answered,
        duration_minutes = p_duration_minutes,
        updated_at = NOW()
    WHERE session_id = p_session_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete interview with score and feedback
CREATE OR REPLACE FUNCTION public.complete_interview(
    p_session_id TEXT,
    p_score DECIMAL DEFAULT NULL,
    p_feedback JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.interview_sessions
    SET 
        interview_status = 'completed',
        score = p_score,
        feedback = p_feedback,
        completed_at = NOW()
    WHERE session_id = p_session_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's interview history
CREATE OR REPLACE FUNCTION public.get_user_interview_history(p_user_id UUID)
RETURNS TABLE (
    session_id UUID,
    session_api_id TEXT,
    interview_status TEXT,
    total_questions INTEGER,
    questions_answered INTEGER,
    duration_minutes INTEGER,
    score DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        iss.id,
        iss.session_id,
        iss.interview_status,
        iss.total_questions,
        iss.questions_answered,
        iss.duration_minutes,
        iss.score,
        iss.created_at,
        iss.completed_at
    FROM public.interview_sessions iss
    WHERE iss.user_id = p_user_id
    ORDER BY iss.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- Example Usage Scenarios
-- ================================================

-- Example 1: Create new interview session
-- SELECT public.create_interview_session(
--     'user-id-here',
--     'user@example.com',
--     'session_api_123456',
--     'resume.pdf',
--     'job_description.txt'
-- );

-- Example 2: Update interview progress
-- SELECT public.update_interview_progress(
--     'session_api_123456',
--     5,
--     15
-- );

-- Example 3: Complete interview with score
-- SELECT public.complete_interview(
--     'session_api_123456',
--     85.5,
--     '{"overall_score": 85.5, "strengths": ["technical knowledge"], "improvements": ["communication"]}'
-- );

-- ================================================
-- Verification Queries (Run these to test)
-- ================================================

-- View all interview sessions
-- SELECT * FROM public.interview_sessions ORDER BY created_at DESC;

-- View interview sessions with feedback
-- SELECT 
--     iss.session_id,
--     iss.interview_status,
--     iss.total_questions,
--     iss.questions_answered,
--     iss.duration_minutes,
--     iss.score,
--     iss.created_at,
--     iss.completed_at
-- FROM public.interview_sessions iss
-- ORDER BY iss.created_at DESC;

-- Get user's interview sessions
-- SELECT * FROM public.interview_sessions WHERE user_id = 'user-id-here';

-- Get completed interviews only
-- SELECT * FROM public.interview_sessions WHERE interview_status = 'completed';

-- Get interviews by date range
-- SELECT * FROM public.interview_sessions 
-- WHERE created_at BETWEEN '2024-01-01' AND '2024-12-31';

-- Get average score by user
-- SELECT 
--     iss.user_id,
--     AVG(iss.score) as average_score,
--     COUNT(*) as total_interviews
-- FROM public.interview_sessions iss
-- WHERE iss.interview_status = 'completed' AND iss.score IS NOT NULL
-- GROUP BY iss.user_id;

-- Get interview completion rate
-- SELECT 
--     COUNT(*) as total_sessions,
--     COUNT(CASE WHEN iss.interview_status = 'completed' THEN 1 END) as completed_sessions,
--     ROUND(
--         COUNT(CASE WHEN iss.interview_status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 
--         2
--     ) as completion_rate
-- FROM public.interview_sessions iss;

-- ================================================
-- Example feedback JSON structure:
-- ================================================
-- {
--   "overall_score": 85.5,
--   "technical_skills": {
--     "score": 90,
--     "feedback": "Strong technical knowledge demonstrated"
--   },
--   "communication": {
--     "score": 80,
--     "feedback": "Clear explanations, could improve on active listening"
--   },
--   "problem_solving": {
--     "score": 88,
--     "feedback": "Good analytical approach to complex problems"
--   },
--   "strengths": [
--     "Technical expertise",
--     "Problem-solving approach",
--     "Industry knowledge"
--   ],
--   "improvements": [
--     "Communication clarity",
--     "Time management",
--     "Question clarification"
--   ],
--   "recommendations": [
--     "Practice explaining technical concepts to non-technical audiences",
--     "Prepare specific examples of your work",
--     "Research the company culture and values"
--   ]
-- }

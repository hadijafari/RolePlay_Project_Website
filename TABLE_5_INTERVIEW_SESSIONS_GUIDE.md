# 🎯 Table 5: Interview Sessions - Setup Guide

## ✅ What's Included:

### All Requested Fields:
- ✅ `id` - UUID (primary key)
- ✅ `user_id` - UUID (references auth.users - SAME as other tables)
- ✅ `email` - text (SAME as other tables)
- ✅ `session_id` - text (unique, from backend API)
- ✅ `resume_filename` - text
- ✅ `job_description_filename` - text
- ✅ `interview_status` - text (completed, in_progress, cancelled)
- ✅ `total_questions` - integer
- ✅ `questions_answered` - integer
- ✅ `duration_minutes` - integer
- ✅ `score` - decimal (optional, 0-100)
- ✅ `feedback` - JSONB (optional, AI feedback data)
- ✅ `created_at` - timestamp
- ✅ `completed_at` - timestamp (optional)

---

## 🎯 Key Features:

### 1. Session Tracking:
- `session_id` links to your backend API
- Unique constraint prevents duplicate sessions
- Tracks resume and job description files used

### 2. Progress Monitoring:
- `total_questions` - Total questions in interview
- `questions_answered` - Progress tracking
- `duration_minutes` - Time spent in interview

### 3. Scoring System:
- `score` - Decimal score (0-100)
- `feedback` - Rich JSON feedback from AI
- `completed_at` - Auto-set when interview completes

### 4. Status Management:
- `in_progress` - Interview is active
- `completed` - Interview finished
- `cancelled` - Interview was cancelled

### 5. Auto-Completion:
- `completed_at` automatically set when status changes to 'completed'
- Cleared when status changes away from 'completed'

---

## 🚀 How to Install:

1. **Supabase Dashboard** → **SQL Editor** → **New Query**
2. Copy from `supabase_table_interview_sessions.sql`
3. Paste and **Run** ▶️
4. Check **Table Editor** → `interview_sessions` appears

---

## 💡 When to Create Interview Sessions:

### Scenario 1: User Starts Interview
1. User uploads resume and job description
2. Backend generates session_id
3. Create interview session with 'in_progress' status
4. Track files used

### Scenario 2: Interview Progress
1. User answers questions
2. Update `questions_answered` and `duration_minutes`
3. Keep session status as 'in_progress'

### Scenario 3: Interview Completion
1. AI generates score and feedback
2. Update status to 'completed'
3. Set score and feedback JSON
4. `completed_at` automatically set

---

## 🔗 Relationship with Other Tables:

```
auth.users
    ↓ (same user_id)
user_profiles (Table 1)
    ↓ (same user_id)
subscriptions (Table 2)
    ↓ (same user_id)
billing_information (Table 3)
    ↓ (same user_id)
payment_history (Table 4)
    ↓ (same user_id)
interview_sessions (Table 5) ← You are here
```

---

## 📊 Example Usage:

### Create New Interview Session:
```javascript
// When user starts interview
const { data, error } = await supabase
  .rpc('create_interview_session', {
    p_user_id: user.id,
    p_email: user.email,
    p_session_id: 'session_api_123456',
    p_resume_filename: 'resume.pdf',
    p_job_description_filename: 'job_description.txt'
  });
```

### Update Interview Progress:
```javascript
// During interview
const { data, error } = await supabase
  .rpc('update_interview_progress', {
    p_session_id: 'session_api_123456',
    p_questions_answered: 5,
    p_duration_minutes: 15
  });
```

### Complete Interview with Score:
```javascript
// When interview finishes
const { data, error } = await supabase
  .rpc('complete_interview', {
    p_session_id: 'session_api_123456',
    p_score: 85.5,
    p_feedback: {
      overall_score: 85.5,
      technical_skills: {
        score: 90,
        feedback: "Strong technical knowledge"
      },
      communication: {
        score: 80,
        feedback: "Clear explanations"
      },
      strengths: ["Technical expertise", "Problem-solving"],
      improvements: ["Communication clarity"],
      recommendations: ["Practice explaining concepts"]
    }
  });
```

### Get User's Interview History:
```javascript
// Get all user's interviews
const { data, error } = await supabase
  .rpc('get_user_interview_history', {
    p_user_id: user.id
  });
```

---

## 🔐 Security:

**Row Level Security enabled:**
- ✅ Users can only see their own interview sessions
- ✅ Users can only create their own sessions
- ✅ Users can only update their own sessions
- ❌ Users cannot see other users' interview data

**Interview data protected!**

---

## 🧪 Testing:

After installation:
1. Create a test interview session
2. Update progress during interview
3. Complete interview with score and feedback
4. Verify RLS (try accessing another user's sessions - should fail)

---

## 📈 Analytics Queries:

### User Interview Statistics:
```sql
SELECT 
    user_id,
    COUNT(*) as total_interviews,
    COUNT(CASE WHEN interview_status = 'completed' THEN 1 END) as completed_interviews,
    AVG(score) as average_score,
    SUM(duration_minutes) as total_time_minutes
FROM public.interview_sessions 
GROUP BY user_id;
```

### Interview Completion Rate:
```sql
SELECT 
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN interview_status = 'completed' THEN 1 END) as completed_sessions,
    ROUND(
        COUNT(CASE WHEN interview_status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 
        2
    ) as completion_rate
FROM public.interview_sessions;
```

### Average Score by Status:
```sql
SELECT 
    interview_status,
    COUNT(*) as session_count,
    AVG(score) as average_score,
    MIN(score) as min_score,
    MAX(score) as max_score
FROM public.interview_sessions 
WHERE score IS NOT NULL
GROUP BY interview_status;
```

---

## 🎁 Bonus Features:

**1. Automatic Completion Tracking:**
- `completed_at` automatically set when status changes to 'completed'
- Cleared when status changes away from 'completed'

**2. Rich Feedback Storage:**
- JSONB field stores complex AI feedback
- Structured feedback with scores, strengths, improvements
- Easy to query and analyze

**3. Progress Tracking:**
- Real-time progress updates
- Duration tracking
- Question completion monitoring

**4. Session Management:**
- Unique session_id prevents duplicates
- Links to backend API
- Tracks files used in interview

---

## 📋 Progress:

✅ **Table 1:** user_profiles - CREATED  
✅ **Table 2:** subscriptions - CREATED  
✅ **Table 3:** billing_information - CREATED  
✅ **Table 4:** payment_history - CREATED  
✅ **Table 5:** interview_sessions (with scoring) - CREATED  
⏳ **Table 6:** affiliate/referral - Next  

---

Ready to install Table 5? Run the SQL in Supabase! 🎯

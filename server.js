const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from parent directory
// Current dir: D:\...\agents\2_openai\Interview RolePlay Website
// Go up 2 levels to: D:\...\agents
const envPath = path.join(__dirname, '..', '..', '.env');
dotenv.config({ path: envPath });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// API endpoint to get the OpenAI API key
app.get('/api/config', (req, res) => {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
        return res.status(500).json({ 
            error: 'OPENAI_API_KEY not found in environment variables',
            message: 'Please make sure you have set OPENAI_API_KEY in your .env file'
        });
    }
    
    res.json({ 
        apiKey: apiKey,
        status: 'success'
    });
});

// API endpoint to get Supabase configuration
app.get('/api/supabase-config', (req, res) => {
    const supabaseUrl = process.env.SUPABASE_URL_ROLEPLAY_PROJECT;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY_ROLEPLAY_PROJECT;
    
    console.log('Supabase config request:');
    console.log('  - URL exists:', !!supabaseUrl);
    console.log('  - Anon Key exists:', !!supabaseAnonKey);
    console.log('  - URL value:', supabaseUrl ? 'Present' : 'Missing');
    console.log('  - All env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
    
    if (!supabaseUrl || !supabaseAnonKey) {
        return res.status(500).json({ 
            error: 'Supabase configuration not found',
            message: 'Please make sure SUPABASE_URL_ROLEPLAY_PROJECT and SUPABASE_ANON_KEY_ROLEPLAY_PROJECT are set in your .env file',
            debug: {
                urlExists: !!supabaseUrl,
                anonKeyExists: !!supabaseAnonKey,
                envPath: envPath,
                supabaseKeysFound: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
            }
        });
    }
    
    res.json({ 
        supabaseUrl: supabaseUrl,
        supabaseAnonKey: supabaseAnonKey,
        status: 'success'
    });
});

// API endpoint for feedback generation
app.post('/api/generate-feedback', async (req, res) => {
    try {
        const { system_prompt, user_message, model = 'gpt-4o-mini', max_tokens = 1500, temperature = 0.3 } = req.body;
        
        if (!system_prompt || !user_message) {
            return res.status(400).json({ error: 'system_prompt and user_message are required' });
        }
        
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'OpenAI API key not configured' });
        }
        
        const { OpenAI } = require('openai');
        const openai = new OpenAI({ apiKey });
        
        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                { role: 'system', content: system_prompt },
                { role: 'user', content: user_message }
            ],
            max_tokens: max_tokens,
            temperature: temperature
        });
        
        res.json({ content: response.choices[0].message.content });
        
    } catch (error) {
        console.error('Error generating feedback:', error);
        res.status(500).json({ error: 'Failed to generate feedback', details: error.message });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok',
        message: 'Server is running',
        hasApiKey: !!process.env.OPENAI_API_KEY
    });
});

// Serve the main landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'main.html'));
});

// Serve the Main page
app.get('/Main', (req, res) => {
    res.sendFile(path.join(__dirname, 'main.html'));
});

// Serve the profile/dashboard page
app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve the login/signup page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Serve the auth callback page
app.get('/auth/callback', (req, res) => {
    res.sendFile(path.join(__dirname, 'auth-callback.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${__dirname}`);
    console.log(`🔑 API Key loaded: ${process.env.OPENAI_API_KEY ? '✅ Yes' : '❌ No'}`);
    console.log(`🔐 Supabase URL loaded: ${process.env.SUPABASE_URL_ROLEPLAY_PROJECT ? '✅ Yes' : '❌ No'}`);
    console.log(`🔐 Supabase Anon Key loaded: ${process.env.SUPABASE_ANON_KEY_ROLEPLAY_PROJECT ? '✅ Yes' : '❌ No'}`);
    
    if (!process.env.OPENAI_API_KEY) {
        console.warn('⚠️  Warning: OPENAI_API_KEY not found in .env file');
        console.log(`Looking for .env at: ${envPath}`);
    }
    
    if (!process.env.SUPABASE_URL_ROLEPLAY_PROJECT || !process.env.SUPABASE_ANON_KEY_ROLEPLAY_PROJECT) {
        console.warn('⚠️  Warning: Supabase keys not found in .env file');
        console.log(`Looking for .env at: ${envPath}`);
    }
});


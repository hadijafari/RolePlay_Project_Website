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

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok',
        message: 'Server is running',
        hasApiKey: !!process.env.OPENAI_API_KEY
    });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve the new Main page
app.get('/Main', (req, res) => {
    res.sendFile(path.join(__dirname, 'main.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${__dirname}`);
    console.log(`🔑 API Key loaded: ${process.env.OPENAI_API_KEY ? '✅ Yes' : '❌ No'}`);
    
    if (!process.env.OPENAI_API_KEY) {
        console.warn('⚠️  Warning: OPENAI_API_KEY not found in .env file');
        console.log(`Looking for .env at: ${envPath}`);
    }
});


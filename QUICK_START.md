# 🚀 Quick Start Guide

## What Changed?

The application now **automatically loads your API key** from the `.env` file located at:
```
D:\workspaces\AI-Tutorials\AI Agents\MyAgentsTutorial\agents\.env
```

You no longer need to manually enter your API key in the web interface!

## How to Run

### Option 1: Using Batch Files (Easiest for Windows)

1. **First Time Setup:**
   - Double-click `install.bat`
   - Wait for the dependencies to install
   
2. **Every Time You Want to Use It:**
   - Double-click `start.bat`
   - Open browser to `http://localhost:3000`
   - Click "Connect" and start talking!

### Option 2: Using Command Line

```bash
# Navigate to the directory
cd "D:\workspaces\AI-Tutorials\AI Agents\MyAgentsTutorial\agents\2_openai\Interview RolePlay Website"

# First time only - install dependencies
npm install

# Start the server
npm start
```

Then open your browser to `http://localhost:3000`

## How It Works

1. **Backend Server (`server.js`):**
   - Reads your API key from the `.env` file
   - Serves the web application
   - Provides the API key to the frontend when needed

2. **Frontend (`app.js`):**
   - Automatically fetches the API key from the server
   - Falls back to manual input if server is unavailable
   - Connects to OpenAI's Realtime API

## Troubleshooting

### "API Key loaded: ❌ No"

If you see this when starting the server:
1. Check that your `.env` file exists at: `D:\workspaces\AI-Tutorials\AI Agents\MyAgentsTutorial\agents\.env`
2. Make sure it contains: `OPENAI_API_KEY=sk-your-actual-key`
3. No quotes around the key
4. No spaces before or after the `=`

### Server won't start

Make sure you have Node.js installed:
1. Open Command Prompt
2. Type: `node --version`
3. If you get an error, install Node.js from: https://nodejs.org/

### "npm install" fails

Try running as administrator:
1. Right-click Command Prompt
2. Select "Run as administrator"
3. Navigate to the directory
4. Run `npm install`

## What's New

### New Files Created:
- ✅ `server.js` - Backend server that loads the API key
- ✅ `package.json` - Node.js dependencies
- ✅ `install.bat` - Easy installation for Windows
- ✅ `start.bat` - Easy startup for Windows

### Files Modified:
- ✅ `app.js` - Now fetches API key automatically from server
- ✅ `index.html` - Updated UI text to reflect automatic loading
- ✅ `README.md` - Updated with new setup instructions

### Features:
- ✅ Automatic API key loading from `.env` file
- ✅ No need to manually enter API key
- ✅ Fallback to manual entry if needed
- ✅ Easy Windows batch file setup
- ✅ Server health check endpoint

## Next Steps

1. Make sure your `.env` file has your OpenAI API key
2. Run `install.bat` (first time only)
3. Run `start.bat`
4. Open `http://localhost:3000`
5. Click "Connect" and start talking with the AI!

Enjoy your voice conversations! 🎙️


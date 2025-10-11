# OpenAI Realtime Voice Agent

A modern web application that enables real-time voice conversations with OpenAI's GPT-4 Realtime API. Talk naturally with an AI agent that can hear you and respond with voice.

## Features

- 🎙️ **Real-time Voice Interaction** - Speak naturally and get instant voice responses
- 🎨 **Modern UI** - Beautiful, responsive interface with dark mode
- 📊 **Audio Visualization** - Visual feedback of audio input
- ⚙️ **Customizable Settings** - Choose voice, system instructions, and more
- 💬 **Conversation History** - See transcripts of your conversations
- 🔒 **Secure** - API key stored locally in your browser

## Prerequisites

- A modern web browser (Chrome, Firefox, Edge, Safari)
- OpenAI API key with access to the Realtime API
- Microphone access

## Quick Start (Windows)

1. Double-click `install.bat` to install dependencies (one-time setup)
2. Double-click `start.bat` to start the server
3. Open your browser to `http://localhost:3000`
4. Click "Connect" and start talking!

## Setup Instructions

### 1. Set Up Your OpenAI API Key

The API key should already be in your `.env` file at:
```
D:\workspaces\AI-Tutorials\AI Agents\MyAgentsTutorial\agents\.env
```

Make sure it contains:
```
OPENAI_API_KEY=sk-your-key-here
```

If you don't have an API key yet:
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to [API Keys](https://platform.openai.com/api-keys)
4. Create a new API key
5. Add it to the `.env` file

**Note:** The Realtime API is in beta. Make sure your account has access to it.

### 2. Install Dependencies

Open a terminal and navigate to the project directory:

```bash
cd "D:\workspaces\AI-Tutorials\AI Agents\MyAgentsTutorial\agents\2_openai\Interview RolePlay Website"
npm install
```

This will install the required Node.js packages (Express, dotenv, cors).

### 3. Start the Server

Run the application:

```bash
npm start
```

You should see:
```
🚀 Server is running on http://localhost:3000
📁 Serving files from: [your directory]
🔑 API Key loaded: ✅ Yes
```

If you see "❌ No" for the API key, check your `.env` file location and contents.

### 4. Open in Browser

Open your web browser and go to:
```
http://localhost:3000
```

### 5. Configure Settings (Optional)

1. Click the **"⚙️ Settings"** button (optional)
2. Choose your preferred voice:
   - **Alloy** - Neutral and balanced
   - **Echo** - Warm and friendly
   - **Shimmer** - Bright and enthusiastic
3. Customize the system instructions to change the agent's behavior
4. Settings are automatically saved in your browser

**Note:** The API key is automatically loaded from your `.env` file, so you don't need to enter it manually!

### 6. Start Talking!

1. Click the **"Connect"** button
2. Allow microphone access when prompted
3. Wait for the status to show "Connected - Listening"
4. Start speaking naturally - the AI will respond!

## Usage Tips

- **Natural Conversation**: Just speak naturally. The system automatically detects when you're done speaking.
- **Audio Visualization**: The waveform shows your audio input in real-time.
- **Conversation History**: All transcripts appear in the conversation box.
- **Clear Chat**: Click "Clear Chat" to remove conversation history from the screen.
- **Disconnect**: Click "Disconnect" when you're done to stop the session.

## Troubleshooting

### "Please enter your OpenAI API key"
- Make sure you've entered a valid API key in the Settings panel
- The key should start with `sk-`

### "Connection failed"
- Check your internet connection
- Verify your API key is correct and has access to the Realtime API
- Check the browser console (F12) for detailed error messages

### No audio/microphone issues
- Ensure your browser has microphone permissions
- Check if your microphone is working in other applications
- Try using HTTPS or localhost (some browsers require secure context for microphone access)

### Agent not responding
- Make sure the status shows "Connected - Listening"
- Try speaking louder or closer to the microphone
- Check if the audio visualization shows your voice

### Audio quality issues
- Check your microphone quality
- Reduce background noise
- Try a different voice in Settings

## API Costs

The OpenAI Realtime API charges based on usage:
- Audio input: ~$0.06 per minute
- Audio output: ~$0.24 per minute
- Text input/output: Standard GPT-4 pricing

Monitor your usage in the [OpenAI Dashboard](https://platform.openai.com/usage).

## Security Notes

- Your API key is stored in browser `localStorage` only
- The key never leaves your browser except to connect to OpenAI
- For production use, consider implementing a backend proxy to protect your API key
- Don't share your API key or commit it to version control

## Browser Compatibility

- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari (macOS/iOS)
- ⚠️ Older browsers may not support Web Audio API

## Technical Details

### Technologies Used
- **OpenAI Realtime API** - For real-time voice conversations
- **Web Audio API** - For audio processing and playback
- **WebSocket** - For bidirectional communication
- **MediaStream API** - For microphone access
- **Canvas API** - For audio visualization

### Audio Format
- Input: PCM16, 24kHz, mono
- Output: PCM16, 24kHz, mono
- Voice Activity Detection (VAD) for automatic turn detection

## Customization

### Changing System Instructions
Modify the agent's personality and behavior by editing the system instructions in Settings:

```
You are a helpful and friendly AI assistant. Be conversational and engaging.
```

Examples:
- **Tutor**: "You are a patient tutor helping students learn. Ask questions to check understanding."
- **Interviewer**: "You are a professional interviewer conducting a job interview."
- **Companion**: "You are a friendly companion having a casual conversation."

### Styling
Edit `styles.css` to customize colors, fonts, and layout. CSS variables are defined at the top for easy theming.

## License

This project is provided as-is for educational and personal use.

## Support

For issues with the OpenAI API:
- [OpenAI Documentation](https://platform.openai.com/docs/guides/realtime)
- [OpenAI Community Forum](https://community.openai.com/)
- [OpenAI Support](https://help.openai.com/)

## Credits

Built with OpenAI's GPT-4 Realtime API.


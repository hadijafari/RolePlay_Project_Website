// OpenAI Realtime Voice Agent
class RealtimeVoiceAgent {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.audioContext = null;
        this.mediaStream = null;
        this.mediaRecorder = null;
        this.audioQueue = [];
        this.isPlaying = false;
        this.currentAudioSource = null;
        this.isAgentSpeaking = false;
        
        // UI Elements
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('statusText');
        this.conversationBox = document.getElementById('conversationBox');
        this.connectBtn = document.getElementById('connectBtn');
        this.disconnectBtn = document.getElementById('disconnectBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.apiKeyInput = document.getElementById('apiKeyInput');
        this.voiceSelect = document.getElementById('voiceSelect');
        this.instructionsInput = document.getElementById('instructionsInput');
        this.agentStartsCheckbox = document.getElementById('agentStartsCheckbox');
        this.settingsToggle = document.getElementById('settingsToggle');
        this.settingsContent = document.getElementById('settingsContent');
        this.visualizer = document.getElementById('visualizer');
        
        // Audio visualization
        this.canvasContext = this.visualizer.getContext('2d');
        this.analyser = null;
        this.dataArray = null;
        
        this.setupEventListeners();
        this.loadSettings();
        this.startVisualization();
    }
    
    setupEventListeners() {
        this.connectBtn.addEventListener('click', () => this.connect());
        this.disconnectBtn.addEventListener('click', () => this.disconnect());
        this.clearBtn.addEventListener('click', () => this.clearConversation());
        this.settingsToggle.addEventListener('click', () => this.toggleSettings());
        
        // Save settings on change
        this.apiKeyInput.addEventListener('change', () => this.saveSettings());
        this.voiceSelect.addEventListener('change', () => this.saveSettings());
        this.instructionsInput.addEventListener('change', () => this.saveSettings());
        this.agentStartsCheckbox.addEventListener('change', () => this.saveSettings());
    }
    
    toggleSettings() {
        this.settingsContent.classList.toggle('open');
    }
    
    loadSettings() {
        const apiKey = localStorage.getItem('openai_api_key');
        const voice = localStorage.getItem('voice_setting') || 'alloy';
        const instructions = localStorage.getItem('system_instructions') || 'You are a helpful and friendly AI assistant. Be conversational and engaging.';
        const agentStarts = localStorage.getItem('agent_starts_conversation');
        
        if (apiKey) this.apiKeyInput.value = apiKey;
        this.voiceSelect.value = voice;
        this.instructionsInput.value = instructions;
        this.agentStartsCheckbox.checked = agentStarts !== 'false'; // Default to true
    }
    
    saveSettings() {
        localStorage.setItem('openai_api_key', this.apiKeyInput.value);
        localStorage.setItem('voice_setting', this.voiceSelect.value);
        localStorage.setItem('system_instructions', this.instructionsInput.value);
        localStorage.setItem('agent_starts_conversation', this.agentStartsCheckbox.checked);
    }
    
    async connect() {
        try {
            this.updateStatus('connecting', 'Connecting...');
            this.connectBtn.disabled = true;
            
            // Fetch API key from server
            let apiKey = null;
            try {
                const response = await fetch('/api/config');
                const data = await response.json();
                
                if (data.apiKey) {
                    apiKey = data.apiKey;
                    console.log('✅ API key loaded from server');
                } else {
                    throw new Error(data.message || 'No API key found');
                }
            } catch (fetchError) {
                console.warn('Failed to fetch API key from server:', fetchError);
                // Fallback to manual input
                apiKey = this.apiKeyInput.value.trim();
                
                if (!apiKey) {
                    alert('Could not load API key from server and no manual key provided.\n\nPlease either:\n1. Make sure the server is running and .env file has OPENAI_API_KEY set, or\n2. Enter your API key manually in settings.');
                    this.toggleSettings();
                    this.connectBtn.disabled = false;
                    this.updateStatus('error', 'No API key');
                    return;
                }
                console.log('Using manually entered API key');
            }
            
            // Setup audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
            
            // Get microphone access
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    channelCount: 1,
                    sampleRate: 24000,
                    echoCancellation: true,
                    noiseSuppression: true,
                }
            });
            
            // Setup audio visualization
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            source.connect(this.analyser);
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            
            // Connect to OpenAI Realtime API
            const model = 'gpt-4o-realtime-preview-2024-10-01';
            this.ws = new WebSocket(
                `wss://api.openai.com/v1/realtime?model=${model}`,
                ['realtime', `openai-insecure-api-key.${apiKey}`, 'openai-beta.realtime-v1']
            );
            
            this.ws.onopen = () => this.onWebSocketOpen();
            this.ws.onmessage = (event) => this.onWebSocketMessage(event);
            this.ws.onerror = (error) => this.onWebSocketError(error);
            this.ws.onclose = () => this.onWebSocketClose();
            
        } catch (error) {
            console.error('Connection error:', error);
            this.updateStatus('error', 'Connection failed');
            this.connectBtn.disabled = false;
            alert(`Failed to connect: ${error.message}`);
        }
    }
    
    onWebSocketOpen() {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.updateStatus('connected', 'Connected - Listening');
        this.connectBtn.disabled = true;
        this.disconnectBtn.disabled = false;
        
        // Configure the session
        this.sendEvent({
            type: 'session.update',
            session: {
                modalities: ['text', 'audio'],
                instructions: this.instructionsInput.value,
                voice: this.voiceSelect.value,
                input_audio_format: 'pcm16',
                output_audio_format: 'pcm16',
                input_audio_transcription: {
                    model: 'whisper-1',
                    language: 'en'
                },
                turn_detection: {
                    type: 'server_vad',
                    threshold: 0.5,
                    prefix_padding_ms: 300,
                    silence_duration_ms: 500
                }
            }
        });
        
        // Start streaming audio
        this.startAudioStreaming();
        
        // Clear welcome message
        const welcomeMsg = this.conversationBox.querySelector('.welcome-message');
        if (welcomeMsg) {
            welcomeMsg.remove();
        }
        
        // Make the agent start the conversation (if enabled in settings)
        if (this.agentStartsCheckbox.checked) {
            // Wait a bit for the session to be fully configured
            setTimeout(() => {
                this.triggerAgentGreeting();
            }, 500);
        }
    }
    
    triggerAgentGreeting() {
        // Create a conversation item to trigger the agent to speak first
        this.sendEvent({
            type: 'conversation.item.create',
            item: {
                type: 'message',
                role: 'user',
                content: [
                    {
                        type: 'input_text',
                        text: 'Hello! Please introduce yourself and start our conversation.'
                    }
                ]
            }
        });
        
        // Trigger a response from the agent
        this.sendEvent({
            type: 'response.create'
        });
        
        this.updateStatus('connected', 'Agent is greeting you...');
    }
    
    onWebSocketMessage(event) {
        const data = JSON.parse(event.data);
        console.log('Received:', data.type, data);
        
        switch (data.type) {
            case 'session.created':
            case 'session.updated':
                console.log('Session configured:', data.session);
                break;
                
            case 'conversation.item.created':
                // Conversation item added
                break;
                
            case 'input_audio_buffer.speech_started':
                this.updateStatus('connected', 'You are speaking...');
                // User interrupted - stop the agent immediately
                this.handleUserInterruption();
                break;
                
            case 'input_audio_buffer.speech_stopped':
                this.updateStatus('connected', 'Processing...');
                break;
                
            case 'conversation.item.input_audio_transcription.completed':
                if (data.transcript) {
                    this.addMessage('user', data.transcript);
                }
                break;
                
            case 'response.audio_transcript.delta':
                // Agent is generating text
                break;
                
            case 'response.audio_transcript.done':
                if (data.transcript) {
                    this.addMessage('assistant', data.transcript);
                }
                this.updateStatus('connected', 'Connected - Listening');
                break;
                
            case 'response.audio.delta':
                // Audio chunk received
                if (data.delta) {
                    this.playAudioChunk(data.delta);
                }
                this.isAgentSpeaking = true;
                this.updateStatus('connected', 'Agent speaking...');
                break;
                
            case 'response.audio.done':
                this.isAgentSpeaking = false;
                this.updateStatus('connected', 'Connected - Listening');
                break;
                
            case 'error':
                console.error('API error:', data.error);
                this.addMessage('system', `Error: ${data.error.message}`);
                break;
        }
    }
    
    onWebSocketError(error) {
        console.error('WebSocket error:', error);
        this.updateStatus('error', 'Connection error');
    }
    
    onWebSocketClose() {
        console.log('WebSocket closed');
        this.isConnected = false;
        this.updateStatus('disconnected', 'Disconnected');
        this.connectBtn.disabled = false;
        this.disconnectBtn.disabled = true;
        
        // Stop audio streaming
        this.stopAudioStreaming();
        
        // Clear any playing audio
        this.stopAgentAudio();
    }
    
    handleUserInterruption() {
        console.log('User interrupted - stopping agent');
        
        // Only interrupt if agent is currently speaking
        if (this.isAgentSpeaking || this.audioQueue.length > 0) {
            // Cancel the current response from the API
            this.sendEvent({
                type: 'response.cancel'
            });
            
            // Stop all audio playback immediately
            this.stopAgentAudio();
            
            console.log('Agent interrupted and stopped');
        }
    }
    
    stopAgentAudio() {
        // Stop currently playing audio
        if (this.currentAudioSource) {
            try {
                this.currentAudioSource.stop();
                this.currentAudioSource.disconnect();
            } catch (e) {
                // Already stopped, ignore
            }
            this.currentAudioSource = null;
        }
        
        // Clear the audio queue
        this.audioQueue = [];
        this.isPlaying = false;
        this.isAgentSpeaking = false;
    }
    
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
    
    sendEvent(event) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(event));
        }
    }
    
    async startAudioStreaming() {
        if (!this.mediaStream) return;
        
        // Create a ScriptProcessor or AudioWorklet to capture audio
        const audioTrack = this.mediaStream.getAudioTracks()[0];
        const mediaStreamSource = this.audioContext.createMediaStreamSource(this.mediaStream);
        
        // Use ScriptProcessor (deprecated but widely supported)
        const bufferSize = 4096;
        const processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
        
        processor.onaudioprocess = (e) => {
            if (!this.isConnected) return;
            
            const inputData = e.inputBuffer.getChannelData(0);
            
            // Convert Float32Array to Int16Array (PCM16)
            const pcm16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
                const s = Math.max(-1, Math.min(1, inputData[i]));
                pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
            
            // Convert to base64
            const base64 = this.arrayBufferToBase64(pcm16.buffer);
            
            // Send to API
            this.sendEvent({
                type: 'input_audio_buffer.append',
                audio: base64
            });
        };
        
        mediaStreamSource.connect(processor);
        processor.connect(this.audioContext.destination);
        
        this.processor = processor;
    }
    
    stopAudioStreaming() {
        if (this.processor) {
            this.processor.disconnect();
            this.processor = null;
        }
        
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
    
    async playAudioChunk(base64Audio) {
        // Decode base64 to ArrayBuffer
        const audioData = this.base64ToArrayBuffer(base64Audio);
        
        // Convert PCM16 to Float32Array
        const pcm16 = new Int16Array(audioData);
        const float32 = new Float32Array(pcm16.length);
        for (let i = 0; i < pcm16.length; i++) {
            float32[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7FFF);
        }
        
        // Create audio buffer
        const audioBuffer = this.audioContext.createBuffer(1, float32.length, 24000);
        audioBuffer.getChannelData(0).set(float32);
        
        // Queue and play
        this.audioQueue.push(audioBuffer);
        if (!this.isPlaying) {
            this.playNextAudioBuffer();
        }
    }
    
    playNextAudioBuffer() {
        if (this.audioQueue.length === 0) {
            this.isPlaying = false;
            this.currentAudioSource = null;
            return;
        }
        
        this.isPlaying = true;
        const audioBuffer = this.audioQueue.shift();
        
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.audioContext.destination);
        
        // Store reference to current audio source so we can stop it if needed
        this.currentAudioSource = source;
        
        source.onended = () => {
            this.currentAudioSource = null;
            this.playNextAudioBuffer();
        };
        
        source.start();
    }
    
    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
    
    base64ToArrayBuffer(base64) {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }
    
    updateStatus(status, text) {
        this.statusIndicator.className = `status-indicator ${status}`;
        this.statusText.textContent = text;
    }
    
    addMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'message-header';
        headerDiv.textContent = role === 'user' ? 'You' : role === 'assistant' ? 'Agent' : 'System';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;
        
        messageDiv.appendChild(headerDiv);
        messageDiv.appendChild(contentDiv);
        
        this.conversationBox.appendChild(messageDiv);
        this.conversationBox.scrollTop = this.conversationBox.scrollHeight;
    }
    
    clearConversation() {
        this.conversationBox.innerHTML = '';
    }
    
    startVisualization() {
        const draw = () => {
            requestAnimationFrame(draw);
            
            const width = this.visualizer.width;
            const height = this.visualizer.height;
            
            this.canvasContext.fillStyle = '#0f172a';
            this.canvasContext.fillRect(0, 0, width, height);
            
            if (this.analyser && this.isConnected) {
                this.analyser.getByteTimeDomainData(this.dataArray);
                
                this.canvasContext.lineWidth = 2;
                this.canvasContext.strokeStyle = '#10a37f';
                this.canvasContext.beginPath();
                
                const sliceWidth = width / this.dataArray.length;
                let x = 0;
                
                for (let i = 0; i < this.dataArray.length; i++) {
                    const v = this.dataArray[i] / 128.0;
                    const y = v * height / 2;
                    
                    if (i === 0) {
                        this.canvasContext.moveTo(x, y);
                    } else {
                        this.canvasContext.lineTo(x, y);
                    }
                    
                    x += sliceWidth;
                }
                
                this.canvasContext.lineTo(width, height / 2);
                this.canvasContext.stroke();
            } else {
                // Draw a flat line when not connected
                this.canvasContext.strokeStyle = '#475569';
                this.canvasContext.lineWidth = 2;
                this.canvasContext.beginPath();
                this.canvasContext.moveTo(0, height / 2);
                this.canvasContext.lineTo(width, height / 2);
                this.canvasContext.stroke();
            }
        };
        
        draw();
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const agent = new RealtimeVoiceAgent();
});


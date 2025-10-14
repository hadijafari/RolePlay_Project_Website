// Feedback Agent for Interview Analysis
class FeedbackAgent {
    constructor(openaiApiKey) {
        this.openaiApiKey = openaiApiKey;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            console.log('Initializing Feedback Agent...');
            this.isInitialized = true;
            console.log('✅ Feedback Agent initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Feedback Agent:', error);
            throw error;
        }
    }

    async generateFeedback(question, answer, questionNumber = 1) {
        try {
            console.log(`Generating feedback for question ${questionNumber}`);
            
            const systemPrompt = this.getSystemPrompt();
            const userMessage = this.createUserMessage(question, answer, questionNumber);
            
            const response = await this.callOpenAI(systemPrompt, userMessage);
            const feedbackData = this.parseFeedbackResponse(response);
            
            // Add metadata
            feedbackData.question_number = questionNumber;
            feedbackData.timestamp = new Date().toISOString();
            feedbackData.question = question;
            answer = answer;
            
            console.log(`✅ Feedback generated successfully for question ${questionNumber}`);
            return feedbackData;
            
        } catch (error) {
            console.error(`Error generating feedback for question ${questionNumber}:`, error);
            return this.getFallbackFeedback(question, answer, questionNumber);
        }
    }

    getSystemPrompt() {
        return `You are an expert technical interviewer and career coach with deep knowledge across multiple technical domains including software engineering, data science, AI/ML, cybersecurity, cloud computing, and system design.

Your role is to provide comprehensive, constructive feedback on interview Q&A pairs. For each question and answer, you must analyze:

1. **Technical Accuracy**: Is the answer technically correct?
2. **Completeness**: Does the answer address all parts of the question?
3. **Clarity**: Is the answer clear and well-structured?
4. **Depth**: Does the answer show appropriate depth of knowledge?
5. **Practical Experience**: Does the answer demonstrate real-world experience?
6. **Communication Skills**: How well is the answer communicated?

For each analysis, provide:
- **Strengths**: What the candidate did well
- **Weaknesses**: Areas that need improvement
- **Ideal Answer**: What a strong answer would look like
- **Technical Assessment**: Professional evaluation of technical knowledge
- **Improvement Suggestions**: Specific actionable advice

Be constructive, professional, and specific. Focus on helping the candidate improve while being honest about gaps in knowledge or communication.

Format your response as JSON with these exact keys:
{
    "strengths": ["strength1", "strength2", ...],
    "weaknesses": ["weakness1", "weakness2", ...],
    "ideal_answer": "Detailed ideal answer that addresses the question comprehensively",
    "technical_assessment": "Professional technical evaluation",
    "improvement_suggestions": ["suggestion1", "suggestion2", ...],
    "overall_score": 0.85,
    "summary": "Brief overall assessment"
}`;
    }

    createUserMessage(question, answer, questionNumber) {
        return `Please analyze this interview Q&A pair and provide comprehensive feedback:

**Question ${questionNumber}:**
${question}

**Answer:**
${answer}

Please provide detailed technical feedback including strengths, weaknesses, ideal answer, and improvement suggestions. Be specific and constructive in your analysis.`;
    }

    async callOpenAI(systemPrompt, userMessage) {
        try {
            const response = await fetch('/api/generate-feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    system_prompt: systemPrompt,
                    user_message: userMessage,
                    model: 'gpt-4o-mini',
                    max_tokens: 1500,
                    temperature: 0.3
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.content;
            
        } catch (error) {
            console.error('OpenAI API call failed:', error);
            throw error;
        }
    }

    parseFeedbackResponse(response) {
        try {
            // Try to find JSON in the response
            const startIdx = response.indexOf('{');
            const endIdx = response.lastIndexOf('}') + 1;
            
            if (startIdx !== -1 && endIdx > startIdx) {
                const jsonStr = response.substring(startIdx, endIdx);
                const feedback = JSON.parse(jsonStr);
                
                // Validate required keys
                const requiredKeys = ["strengths", "weaknesses", "ideal_answer", "technical_assessment", "improvement_suggestions"];
                for (const key of requiredKeys) {
                    if (!(key in feedback)) {
                        feedback[key] = "Not provided";
                    }
                }
                
                // Ensure overall_score is a float
                if (!("overall_score" in feedback)) {
                    feedback.overall_score = 0.5;
                } else {
                    try {
                        feedback.overall_score = parseFloat(feedback.overall_score);
                    } catch (e) {
                        feedback.overall_score = 0.5;
                    }
                }
                
                return feedback;
            } else {
                console.warn("No JSON found in response, using fallback");
                return this.getFallbackFeedback("", "", 1);
            }
            
        } catch (error) {
            console.warn("Failed to parse JSON response:", error);
            return this.getFallbackFeedback("", "", 1);
        }
    }

    getFallbackFeedback(question, answer, questionNumber) {
        return {
            strengths: ["Attempted to answer the question", "Showed engagement"],
            weaknesses: ["Answer could be more detailed", "Consider providing specific examples"],
            ideal_answer: "A comprehensive answer that directly addresses the question with specific examples and technical details.",
            technical_assessment: "Unable to assess due to technical issues. Please try again.",
            improvement_suggestions: [
                "Provide more specific examples",
                "Structure your answer clearly",
                "Include technical details when relevant"
            ],
            overall_score: 0.5,
            summary: "Feedback generation encountered technical issues. Please try again.",
            question_number: questionNumber,
            timestamp: new Date().toISOString(),
            question: question,
            answer: answer,
            is_fallback: true
        };
    }

    formatFeedbackForDisplay(feedback) {
        try {
            const formatted = `
**FEEDBACK FOR QUESTION ${feedback.question_number || 'N/A'}:**

**Strengths:**
${feedback.strengths.map(s => `• ${s}`).join('\n')}

**Weaknesses:**
${feedback.weaknesses.map(w => `• ${w}`).join('\n')}

**Ideal Answer:**
${feedback.ideal_answer || 'Not provided'}

**Technical Assessment:**
${feedback.technical_assessment || 'Not provided'}

**Improvement Suggestions:**
${feedback.improvement_suggestions.map(s => `• ${s}`).join('\n')}

**Overall Score:** ${(feedback.overall_score || 0.5).toFixed(2)}/1.0
**Summary:** ${feedback.summary || 'No summary available'}
`;
            return formatted.trim();
            
        } catch (error) {
            console.error("Error formatting feedback:", error);
            return `Error formatting feedback: ${error.message}`;
        }
    }
}

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
        
        // Feedback agent
        this.feedbackAgent = null;
        this.currentQuestion = null;
        this.questionNumber = 1;
        this.waitingForAnswer = false;
        
        // UI Elements
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('statusText');
        this.conversationBox = document.getElementById('conversationBox');
        this.connectBtn = document.getElementById('connectBtn');
        this.disconnectBtn = document.getElementById('disconnectBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.voiceSelect = document.getElementById('voiceSelect');
        this.instructionsInput = document.getElementById('instructionsInput');
        this.agentStartsCheckbox = document.getElementById('agentStartsCheckbox');
        this.settingsToggle = document.getElementById('settingsToggle');
        this.settingsContent = document.getElementById('settingsContent');
        this.visualizer = document.getElementById('visualizer');
        
        // Upload elements
        this.resumeUpload = document.getElementById('resumeUpload');
        this.jobDescUpload = document.getElementById('jobDescUpload');
        this.resumeFileInfo = document.getElementById('resumeFileInfo');
        this.jobDescFileInfo = document.getElementById('jobDescFileInfo');
        this.generatePlanBtn = document.getElementById('generatePlanBtn');
        this.planResponse = document.getElementById('planResponse');
        
        // Feedback elements
        this.feedbackBox = document.getElementById('feedbackBox');
        
        // Store uploaded files
        this.resumeFile = null;
        this.jobDescFile = null;
        
        // Polling variables
        this.pollingInterval = null;
        this.currentSessionId = null;
        
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
        this.voiceSelect.addEventListener('change', () => this.saveSettings());
        this.instructionsInput.addEventListener('change', () => this.saveSettings());
        this.agentStartsCheckbox.addEventListener('change', () => this.saveSettings());
        
        // File upload listeners
        this.resumeUpload.addEventListener('change', (e) => this.handleFileSelect(e, 'resume'));
        this.jobDescUpload.addEventListener('change', (e) => this.handleFileSelect(e, 'jobDesc'));
        
        // Generate plan button listener
        this.generatePlanBtn.addEventListener('click', () => this.generateInterviewPlan());
    }
    
    handleFileSelect(event, type) {
        const file = event.target.files[0];
        const fileInfoElement = type === 'resume' ? this.resumeFileInfo : this.jobDescFileInfo;
        
        if (file) {
            const fileName = file.name;
            const fileExtension = fileName.split('.').pop().toUpperCase();
            
            // Store the file
            if (type === 'resume') {
                this.resumeFile = file;
            } else {
                this.jobDescFile = file;
            }
            
            fileInfoElement.innerHTML = `
                <div class="file-name">📎 ${fileName}</div>
                <div class="file-size">${fileExtension} file</div>
            `;
            fileInfoElement.classList.add('active');
        } else {
            fileInfoElement.classList.remove('active');
            
            // Clear stored file
            if (type === 'resume') {
                this.resumeFile = null;
            } else {
                this.jobDescFile = null;
            }
        }
    }
    
    async generateInterviewPlan() {
        // Validate files are uploaded
        if (!this.resumeFile || !this.jobDescFile) {
            alert('Please upload both Resume and Job Description files before generating the plan.');
            return;
        }
        
        try {
            // Disable button and show loading
            this.generatePlanBtn.disabled = true;
            this.generatePlanBtn.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">Generating...</span>';
            
            // Create FormData
            const formData = new FormData();
            formData.append('resume', this.resumeFile);
            formData.append('job_description', this.jobDescFile);
            
            // Send API request
            const response = await fetch('https://roleplay-project.onrender.com/create-interview-plan', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            // Display initial response
            this.planResponse.innerHTML = `
                <div class="response-title">🔄 Processing...</div>
                <pre>${JSON.stringify(data, null, 2)}</pre>
            `;
            this.planResponse.classList.add('active');
            
            // Store session_id and start polling
            if (data.session_id) {
                this.currentSessionId = data.session_id;
                this.startPolling();
            } else {
                throw new Error('No session_id received from server');
            }
            
        } catch (error) {
            console.error('Error generating interview plan:', error);
            
            // Show error
            this.planResponse.innerHTML = `
                <div class="response-title">❌ Error:</div>
                <pre>${error.message}</pre>
            `;
            this.planResponse.classList.add('active');
            
            // Re-enable button
            this.generatePlanBtn.disabled = false;
            this.generatePlanBtn.innerHTML = '<span class="btn-icon">📋</span><span class="btn-text">Generate Interview Plan</span>';
            
            alert('Failed to generate interview plan: ' + error.message);
        }
    }
    
    startPolling() {
        // Clear any existing polling interval
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        
        // Poll every 5 seconds
        this.pollingInterval = setInterval(() => {
            this.checkStatus();
        }, 5000);
        
        // Also check immediately
        this.checkStatus();
    }
    
    async checkStatus() {
        if (!this.currentSessionId) {
            this.stopPolling();
            return;
        }
        
        try {
            const response = await fetch(`https://roleplay-project.onrender.com/status/${this.currentSessionId}`);
            const data = await response.json();
            
            // Check if completed
            if (data.overall_status === 'completed') {
                // Stop polling
                this.stopPolling();
                
                // Display final interview plan
                this.planResponse.innerHTML = `
                    <div class="response-title">✅ Interview Plan Generated Successfully!</div>
                    <pre>${JSON.stringify(data, null, 2)}</pre>
                `;
                
                // Extract questions and update system instructions
                this.updateSystemInstructionsWithQuestions(data);
                
                // Re-enable button
                this.generatePlanBtn.disabled = false;
                this.generatePlanBtn.innerHTML = '<span class="btn-icon">📋</span><span class="btn-text">Generate Interview Plan</span>';
                
            } else if (data.overall_status === 'error' || data.error) {
                // Stop polling on error
                this.stopPolling();
                
                // Display error
                this.planResponse.innerHTML = `
                    <div class="response-title">❌ Error During Processing:</div>
                    <pre>${JSON.stringify(data, null, 2)}</pre>
                `;
                
                // Re-enable button
                this.generatePlanBtn.disabled = false;
                this.generatePlanBtn.innerHTML = '<span class="btn-icon">📋</span><span class="btn-text">Generate Interview Plan</span>';
                
            } else {
                // Still processing - update display
                this.planResponse.innerHTML = `
                    <div class="response-title">🔄 Processing... (Status: ${data.overall_status})</div>
                    <pre>${JSON.stringify(data, null, 2)}</pre>
                `;
            }
            
        } catch (error) {
            console.error('Error checking status:', error);
            // Don't stop polling on network errors, might be temporary
        }
    }
    
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        this.currentSessionId = null;
    }
    
    updateSystemInstructionsWithQuestions(data) {
        try {
            // Extract interview sections from the response
            const interviewSections = data.result?.interview_plan?.interview_sections;
            
            if (!interviewSections || !Array.isArray(interviewSections)) {
                console.warn('No interview sections found in response');
                return;
            }
            
            // Extract all questions from all sections
            let allQuestions = [];
            let questionNumber = 1;
            
            interviewSections.forEach(section => {
                if (section.questions && Array.isArray(section.questions)) {
                    section.questions.forEach(q => {
                        if (q.question_text) {
                            allQuestions.push(`${questionNumber}. ${q.question_text}`);
                            questionNumber++;
                        }
                    });
                }
            });
            
            // Build the numbered questions string
            const numberedQuestions = allQuestions.join('\n');
            
            // Create the new system instructions
            const newInstructions = `You are conducting a natural interview conversation. 
When the conversation starts, immediately greet the user by saying exactly: "Hello! Welcome to your interview. I'm excited to learn more about your background. Could you please introduce yourself and tell me a bit about your experience?" 

After greeting, wait for the user to speak and when the user is finished, you need to ask these questions in this exact order, but make it sound like a normal conversation:

${numberedQuestions}

CRITICAL INSTRUCTIONS:

- The agent will say the initial message and asks that the interviewee introduces himself.
- After the interviewee introduces himself, the agent will respond in one or 2 sentence and then asks the first question.
- Ask these questions in the exact order listed above
- Make it sound like a natural conversation - don't say question numbers or "first question", "second question", etc.
- After each answer, provide brief constructive feedback (1-2 sentences) when the answer could be improved or when clarification would be helpful
- If the answer is good and complete, simply acknowledge it briefly and move to the next question without excessive praise
- Be encouraging and supportive, but focus on helping the interviewee improve rather than just praising
- If an answer from the user is not relevant to the question asked at all, ask the same question one more time to guide them back on track
- If you think a follow-up question would be valuable, you can ask ONLY ONE follow-up question. After the follow-up response, you must proceed to the next question
- Do NOT skip questions or ask them out of order
- Do NOT create your own questions
- Keep the conversation flowing naturally
- Start with the first question from the questions list and if no question is available, ask this: 'Tell me about your experience and background.'
You are a friendly, professional interviewer conducting a comprehensive interview to assess the candidate's technical skills, experience, and cultural fit for the role.`;
            
            // Update the textarea
            this.instructionsInput.value = newInstructions;
            
            // Save to localStorage
            this.saveSettings();
            
            console.log(`✅ System instructions updated with ${allQuestions.length} questions`);
            
        } catch (error) {
            console.error('Error updating system instructions:', error);
        }
    }
    
    toggleSettings() {
        this.settingsContent.classList.toggle('open');
    }
    
    loadSettings() {
        const voice = localStorage.getItem('voice_setting') || 'alloy';
        const instructions = localStorage.getItem('system_instructions') || 'Your name is "goozoo" and you should always start the conversation by introducing yourself.';
        const agentStarts = localStorage.getItem('agent_starts_conversation');
        
        this.voiceSelect.value = voice;
        this.instructionsInput.value = instructions;
        this.agentStartsCheckbox.checked = agentStarts !== 'false'; // Default to true
    }
    
    saveSettings() {
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
                alert('Could not load API key from server.\n\nPlease make sure:\n1. The server is running (npm start)\n2. Your .env file exists at: D:\\workspaces\\AI-Tutorials\\AI Agents\\MyAgentsTutorial\\agents\\.env\n3. The .env file contains: OPENAI_API_KEY=sk-your-key');
                this.connectBtn.disabled = false;
                this.updateStatus('error', 'No API key');
                return;
            }
            
            // Initialize feedback agent
            this.feedbackAgent = new FeedbackAgent(apiKey);
            await this.feedbackAgent.initialize();
            console.log('✅ Feedback Agent initialized');
            
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
                    // If we have a question and are waiting for an answer, trigger feedback
                    if (this.waitingForAnswer && this.currentQuestion && this.feedbackAgent) {
                        this.generateFeedbackAsync(this.currentQuestion, data.transcript);
                        this.waitingForAnswer = false;
                        this.currentQuestion = null;
                    }
                }
                break;
                
            case 'response.audio_transcript.delta':
                // Agent is generating text
                break;
                
            case 'response.audio_transcript.done':
                if (data.transcript) {
                    this.addMessage('assistant', data.transcript);
                    // Store the agent's question for feedback tracking
                    this.currentQuestion = data.transcript;
                    this.waitingForAnswer = true;
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

    async generateFeedbackAsync(question, answer) {
        try {
            console.log('Generating feedback for Q&A pair...');
            
            // Generate feedback asynchronously (non-blocking)
            setTimeout(async () => {
                try {
                    const feedback = await this.feedbackAgent.generateFeedback(question, answer, this.questionNumber);
                    this.displayFeedback(question, answer, feedback);
                    this.questionNumber++;
                } catch (error) {
                    console.error('Error generating feedback:', error);
                    this.displayFeedbackError(question, answer, error);
                }
            }, 100); // Small delay to ensure non-blocking
            
        } catch (error) {
            console.error('Error in generateFeedbackAsync:', error);
        }
    }

    displayFeedback(question, answer, feedback) {
        // Remove welcome message if it exists
        const welcomeMsg = this.feedbackBox.querySelector('.feedback-welcome');
        if (welcomeMsg) {
            welcomeMsg.remove();
        }

        const feedbackItem = document.createElement('div');
        feedbackItem.className = 'feedback-item';
        
        feedbackItem.innerHTML = `
            <div class="feedback-question">
                <div class="feedback-question-label">Interviewer asked:</div>
                <div class="feedback-content">${question}</div>
            </div>
            
            <div class="feedback-answer">
                <div class="feedback-answer-label">Interviewee answered:</div>
                <div class="feedback-content">${answer}</div>
            </div>
            
            <div class="feedback-analysis">
                <div class="feedback-agent-label">Feedback agent:</div>
                <div class="feedback-content">
                    <div class="feedback-strengths">
                        <strong>Strengths:</strong><br>
                        ${feedback.strengths.map(s => `• ${s}`).join('<br>')}
                    </div>
                    <br>
                    <div class="feedback-weaknesses">
                        <strong>Weaknesses:</strong><br>
                        ${feedback.weaknesses.map(w => `• ${w}`).join('<br>')}
                    </div>
                    <br>
                    <div class="feedback-suggestions">
                        <strong>Improvement Suggestions:</strong><br>
                        ${feedback.improvement_suggestions.map(s => `• ${s}`).join('<br>')}
                    </div>
                    <br>
                    <div><strong>Overall Score:</strong> ${(feedback.overall_score || 0.5).toFixed(2)}/1.0</div>
                    <div><strong>Summary:</strong> ${feedback.summary || 'No summary available'}</div>
                </div>
            </div>
        `;
        
        this.feedbackBox.appendChild(feedbackItem);
        
        // Scroll to bottom
        this.feedbackBox.scrollTop = this.feedbackBox.scrollHeight;
    }

    displayFeedbackError(question, answer, error) {
        // Remove welcome message if it exists
        const welcomeMsg = this.feedbackBox.querySelector('.feedback-welcome');
        if (welcomeMsg) {
            welcomeMsg.remove();
        }

        const feedbackItem = document.createElement('div');
        feedbackItem.className = 'feedback-item';
        
        feedbackItem.innerHTML = `
            <div class="feedback-question">
                <div class="feedback-question-label">Interviewer asked:</div>
                <div class="feedback-content">${question}</div>
            </div>
            
            <div class="feedback-answer">
                <div class="feedback-answer-label">Interviewee answered:</div>
                <div class="feedback-content">${answer}</div>
            </div>
            
            <div class="feedback-analysis">
                <div class="feedback-agent-label">Feedback agent:</div>
                <div class="feedback-content" style="color: #ea4335;">
                    Error generating feedback: ${error.message}
                </div>
            </div>
        `;
        
        this.feedbackBox.appendChild(feedbackItem);
        
        // Scroll to bottom
        this.feedbackBox.scrollTop = this.feedbackBox.scrollHeight;
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


// ES Module integration with HeyGen Streaming Avatar SDK
import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  VoiceEmotion,
  VoiceChatTransport,
  STTProvider,
  TaskType,
} from '@heygen/streaming-avatar';

console.log('✅ HeyGen SDK imported successfully');
console.log('StreamingAvatar:', StreamingAvatar);

const state = {
  avatar: null,
  stream: null,
  connected: false,
  isVoiceChatActive: false,
  currentUserMessage: '',
  currentAvatarMessage: '',
};

const els = {
  video: document.getElementById('avatarVideo'),
  startVoice: document.getElementById('btnStartVoice'),
  startText: document.getElementById('btnStartText'),
  stop: document.getElementById('btnStop'),
  mute: document.getElementById('btnMute'),
  unmute: document.getElementById('btnUnmute'),
  badge: document.getElementById('connectionBadge'),
  avatarId: document.getElementById('avatarId'),
  avatarIdApi: document.getElementById('avatarIdApi'),
  language: document.getElementById('language'),
  voiceRate: document.getElementById('voiceRate'),
  systemPrompt: document.getElementById('systemPrompt'),
  greetingText: document.getElementById('greetingText'),
  transcriptPanel: document.getElementById('transcriptPanel'),
  messageContainer: document.getElementById('messageContainer'),
};

function setConnected(connected) {
  state.connected = connected;
  els.badge.textContent = connected ? 'Connected' : 'Disconnected';
  els.stop.disabled = !connected;
  els.mute.disabled = !connected;
  els.unmute.disabled = !connected;
  
  // Show/hide transcript panel
  if (connected) {
    els.transcriptPanel.style.display = 'block';
  }
}

function clearTranscript() {
  els.messageContainer.innerHTML = '<div class="no-messages">Start a conversation to see the transcript...</div>';
  els.transcriptPanel.style.display = 'none';
  state.currentUserMessage = '';
  state.currentAvatarMessage = '';
}

function addMessage(sender, text, isFinal = true) {
  // Remove "no messages" placeholder
  const noMessages = els.messageContainer.querySelector('.no-messages');
  if (noMessages) {
    noMessages.remove();
  }

  const messageClass = sender === 'user' ? 'user' : 'avatar';
  const timestamp = new Date().toLocaleTimeString();
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${messageClass}`;
  messageDiv.innerHTML = `
    <div>${text}</div>
    <div class="message-time">${timestamp}</div>
  `;

  els.messageContainer.appendChild(messageDiv);
  
  // Auto-scroll to bottom
  els.messageContainer.scrollTop = els.messageContainer.scrollHeight;
  
  console.log(`💬 Added ${sender} message:`, text);
}

function updateLastMessage(sender, text) {
  const messages = els.messageContainer.querySelectorAll('.message');
  const lastMessage = messages[messages.length - 1];
  
  if (lastMessage && lastMessage.classList.contains(sender)) {
    const textDiv = lastMessage.querySelector('div:first-child');
    if (textDiv) {
      textDiv.textContent = text;
    }
    // Auto-scroll to bottom
    els.messageContainer.scrollTop = els.messageContainer.scrollHeight;
  } else {
    // No existing message to update, create new one
    addMessage(sender, text, false);
  }
}

async function fetchAccessToken() {
  const resp = await fetch('/api/heygen/get-access-token', { method: 'POST' });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error('Failed to get access token: ' + text);
  }
  return resp.text();
}

async function loadLanguagesFromAPI() {
  try {
    console.log('🌐 Loading languages from API...');
    const resp = await fetch('/api/heygen/list-languages');
    
    if (!resp.ok) {
      let errorMsg = `HTTP ${resp.status}: ${resp.statusText}`;
      try {
        const error = await resp.json();
        console.error('Failed to load languages:', error);
        errorMsg = error.error || errorMsg;
      } catch {
        const text = await resp.text();
        console.error('Failed to load languages (HTML response):', text.substring(0, 200));
      }
      els.language.innerHTML = '<option value="English">English (default)</option>';
      console.warn('Using default language only');
      return;
    }

    const data = await resp.json();
    console.log('✅ Languages loaded:', data);

    // Clear loading message
    els.language.innerHTML = '';

    // HeyGen API returns languages as array in data.data
    const languageList = data.data || [];
    
    if (Array.isArray(languageList) && languageList.length > 0) {
      // Add English first as default
      const englishIndex = languageList.findIndex(lang => 
        lang.language_name === 'English' || lang.language === 'English'
      );
      
      if (englishIndex !== -1) {
        const english = languageList[englishIndex];
        const option = document.createElement('option');
        option.value = english.language_name || english.language || 'English';
        option.textContent = english.language_name || english.language || 'English';
        option.selected = true;
        els.language.appendChild(option);
        
        // Remove English from list to avoid duplicate
        languageList.splice(englishIndex, 1);
      }

      // Add all other languages alphabetically
      languageList.sort((a, b) => {
        const nameA = a.language_name || a.language || '';
        const nameB = b.language_name || b.language || '';
        return nameA.localeCompare(nameB);
      });

      languageList.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang.language_name || lang.language;
        option.textContent = lang.language_name || lang.language;
        els.language.appendChild(option);
      });
      
      console.log(`✅ Loaded ${languageList.length + 1} languages from API`);
    } else {
      els.language.innerHTML = '<option value="English">English (default)</option>';
      console.warn('No languages found in API response, using default');
    }
  } catch (error) {
    console.error('Error loading languages:', error);
    els.language.innerHTML = '<option value="English">English (default)</option>';
  }
}

async function loadAvatarsFromAPI() {
  try {
    console.log('📥 Loading avatars from API...');
    const resp = await fetch('/api/heygen/list-avatars');
    
    if (!resp.ok) {
      let errorMsg = `HTTP ${resp.status}: ${resp.statusText}`;
      try {
        const error = await resp.json();
        console.error('Failed to load avatars:', error);
        errorMsg = error.error || errorMsg;
      } catch {
        const text = await resp.text();
        console.error('Failed to load avatars (HTML response):', text.substring(0, 200));
      }
      els.avatarIdApi.innerHTML = `<option value="">Failed: ${errorMsg}</option>`;
      return;
    }

    const data = await resp.json();
    console.log('✅ Avatars loaded:', data);

    // Clear loading message
    els.avatarIdApi.innerHTML = '<option value="">-- Select --</option>';

    // Populate dropdown with avatars from API
    // HeyGen API returns data directly in 'data' array, not 'data.avatars'
    const avatarList = data.data || [];
    
    if (Array.isArray(avatarList) && avatarList.length > 0) {
      avatarList.forEach(avatar => {
        const option = document.createElement('option');
        option.value = avatar.avatar_id;
        // Use pose_name if available, otherwise fallback to avatar_id
        option.textContent = avatar.pose_name || avatar.avatar_name || avatar.avatar_id;
        els.avatarIdApi.appendChild(option);
      });
      console.log(`✅ Loaded ${avatarList.length} avatars from API`);
    } else {
      els.avatarIdApi.innerHTML = '<option value="">No avatars available</option>';
      console.warn('No avatars found in API response');
    }
  } catch (error) {
    console.error('Error loading avatars:', error);
    els.avatarIdApi.innerHTML = '<option value="">Server not restarted - Restart server</option>';
  }
}

// Handle dropdown selection logic - disable one when other is selected
function setupAvatarDropdownLogic() {
  els.avatarId.addEventListener('change', () => {
    if (els.avatarId.value) {
      els.avatarIdApi.disabled = true;
      els.avatarIdApi.value = '';
    } else {
      els.avatarIdApi.disabled = false;
    }
  });

  els.avatarIdApi.addEventListener('change', () => {
    if (els.avatarIdApi.value) {
      els.avatarId.disabled = true;
      els.avatarId.value = '';
    } else {
      els.avatarId.disabled = false;
    }
  });
}

function attachCommonEvents(avatar) {
  avatar.on(StreamingEvents.STREAM_READY, (event) => {
    console.log('🎥 Stream ready event:', event);
    state.stream = event.detail;
    els.video.srcObject = state.stream;
    els.video.onloadedmetadata = () => {
      console.log('▶️ Playing video...');
      els.video.play();
    };
    setConnected(true);
  });
  
  avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
    console.log('🔌 Stream disconnected');
    setConnected(false);
    els.video.srcObject = null;
    state.stream = null;
  });

  avatar.on(StreamingEvents.AVATAR_START_TALKING, () => {
    console.log('🗣️ Avatar started talking');
  });

  avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
    console.log('🤐 Avatar stopped talking');
  });

  // Transcript events - User messages
  avatar.on(StreamingEvents.USER_START, () => {
    console.log('👤 User started speaking');
    state.currentUserMessage = '';
    // Create initial empty message for user
    addMessage('user', '', false);
  });

  avatar.on(StreamingEvents.USER_TALKING_MESSAGE, (event) => {
    console.log('👤 User talking:', event);
    const text = event.detail?.message || event.message || '';
    if (text) {
      // Accumulate the user's message
      state.currentUserMessage += (state.currentUserMessage ? ' ' : '') + text;
      updateLastMessage('user', state.currentUserMessage);
    }
  });

  avatar.on(StreamingEvents.USER_END_MESSAGE, (event) => {
    console.log('👤 User message ended:', event);
    // Just finalize the accumulated message, don't add a new one
    state.currentUserMessage = '';
  });

  // Transcript events - Avatar messages
  avatar.on(StreamingEvents.AVATAR_START_TALKING, () => {
    console.log('🗣️ Avatar started talking');
    state.currentAvatarMessage = '';
    // Create initial empty message for avatar
    addMessage('avatar', '', false);
  });

  avatar.on(StreamingEvents.AVATAR_TALKING_MESSAGE, (event) => {
    console.log('🤖 Avatar talking:', event);
    const text = event.detail?.message || event.message || '';
    if (text) {
      // Accumulate the avatar's message
      state.currentAvatarMessage += (state.currentAvatarMessage ? ' ' : '') + text;
      updateLastMessage('avatar', state.currentAvatarMessage);
    }
  });

  avatar.on(StreamingEvents.AVATAR_END_MESSAGE, (event) => {
    console.log('🤖 Avatar message ended:', event);
    // Just finalize the accumulated message, don't add a new one
    state.currentAvatarMessage = '';
  });
}

async function startSession({ isVoiceChat }) {
  try {
    console.log('🚀 Starting session...', { isVoiceChat });
    
    const token = await fetchAccessToken();
    console.log('🔑 Got access token:', token.substring(0, 20) + '...');
    
    const basePath = 'https://api.heygen.com';

    console.log('🏗️ Creating StreamingAvatar instance...');
    state.avatar = new StreamingAvatar({ token, basePath });
    console.log('✅ StreamingAvatar instance created:', state.avatar);
    
    attachCommonEvents(state.avatar);

    // Get avatar ID from whichever dropdown is selected
    const avatarName = (els.avatarIdApi.value || els.avatarId.value || 'default').trim();
    const language = els.language.value || 'en';
    const rate = Math.min(1.5, Math.max(0.5, parseFloat(els.voiceRate.value) || 1.2));
    const systemPrompt = els.systemPrompt.value.trim();

    const startConfig = {
      quality: AvatarQuality.Low,
      avatarName,
      language,
      voiceChatTransport: VoiceChatTransport.WEBSOCKET,
      sttSettings: { provider: STTProvider.DEEPGRAM },
      voice: {
        rate,
        emotion: VoiceEmotion.EXCITED,
      },
    };

    // Add system prompt if provided
    if (systemPrompt) {
      startConfig.knowledgeBase = systemPrompt;
      console.log('📝 Using custom system prompt:', systemPrompt);
    }

    console.log('📋 Starting avatar with config:', startConfig);
    await state.avatar.createStartAvatar(startConfig);
    console.log('✅ Avatar session started');
    
    // Speak greeting if provided
    const greetingText = els.greetingText.value.trim();
    if (greetingText) {
      console.log('👋 Speaking greeting:', greetingText);
      await state.avatar.speak({ 
        text: greetingText,
        task_type: TaskType.REPEAT
      });
      console.log('✅ Greeting spoken');
    }
    
    if (isVoiceChat) {
      console.log('🎤 Starting voice chat...');
      await state.avatar.startVoiceChat();
      state.isVoiceChatActive = true;
      console.log('✅ Voice chat started');
    }
  } catch (err) {
    console.error('❌ Error starting session:', err);
    alert('Error starting session: ' + (err?.message || String(err)));
  }
}

async function stopSession() {
  try {
    console.log('🛑 Stopping session...');
    if (state.avatar) {
      await state.avatar.stopAvatar();
      console.log('✅ Session stopped');
    }
  } catch (err) {
    console.error('❌ Stop error:', err);
  } finally {
    setConnected(false);
    state.avatar = null;
    state.stream = null;
    els.video.srcObject = null;
    clearTranscript();
  }
}

// Event listeners
els.startVoice.addEventListener('click', () => {
  console.log('👆 Start Voice Chat clicked');
  startSession({ isVoiceChat: true });
});

els.startText.addEventListener('click', () => {
  console.log('👆 Start Text Chat clicked');
  startSession({ isVoiceChat: false });
});

els.stop.addEventListener('click', () => {
  console.log('👆 Stop clicked');
  stopSession();
});

els.mute.addEventListener('click', async () => {
  try {
    if (state.avatar && state.connected) {
      console.log('🔇 Muting mic...');
      await state.avatar.muteInputAudio?.();
    }
  } catch (err) {
    console.error('Mute error:', err);
  }
});

els.unmute.addEventListener('click', async () => {
  try {
    if (state.avatar && state.connected) {
      console.log('🔊 Unmuting mic...');
      await state.avatar.unmuteInputAudio?.();
    }
  } catch (err) {
    console.error('Unmute error:', err);
  }
});

// Initialize page
(async () => {
  console.log('📄 HeyGen page initializing...');
  
  // Load languages and avatars from API in parallel
  await Promise.all([
    loadLanguagesFromAPI(),
    loadAvatarsFromAPI()
  ]);
  
  // Setup dropdown logic
  setupAvatarDropdownLogic();
  
  console.log('✅ HeyGen page ready!');
})();

// ES Module integration with HeyGen Streaming Avatar SDK
import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  VoiceEmotion,
  VoiceChatTransport,
  STTProvider,
} from '@heygen/streaming-avatar';

console.log('✅ HeyGen SDK imported successfully');
console.log('StreamingAvatar:', StreamingAvatar);

const state = {
  avatar: null,
  stream: null,
  connected: false,
  isVoiceChatActive: false,
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
  language: document.getElementById('language'),
  voiceRate: document.getElementById('voiceRate'),
  systemPrompt: document.getElementById('systemPrompt'),
};

function setConnected(connected) {
  state.connected = connected;
  els.badge.textContent = connected ? 'Connected' : 'Disconnected';
  els.stop.disabled = !connected;
  els.mute.disabled = !connected;
  els.unmute.disabled = !connected;
}

async function fetchAccessToken() {
  const resp = await fetch('/api/heygen/get-access-token', { method: 'POST' });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error('Failed to get access token: ' + text);
  }
  return resp.text();
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

    const avatarName = (els.avatarId.value || 'default').trim();
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

console.log('📄 HeyGen page ready!');

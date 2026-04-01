import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Volume2, 
  VolumeX,
  ArrowLeft,
  Loader2,
  MessageCircle,
  Settings,
  X,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import useConversationStore from '../store/conversationStore';
import socketService from '../services/socket.service';
import { AppLayout } from '../components/Layout';

const VoiceCall = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addMessage, messages, setCurrentConversation, clearCurrentConversation, updateTitle } = useConversationStore();
  
  const accessToken = localStorage.getItem('accessToken');

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.9);
  const [speechPitch, setSpeechPitch] = useState(1);
  const [browserWarning, setBrowserWarning] = useState('');

  // Check browser compatibility
  useEffect(() => {
    const ua = navigator.userAgent;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

    if (!window.isSecureContext && !isLocalhost) {
      setBrowserWarning('Voice features require HTTPS in production. Please open the app over https:// and allow microphone access.');
      return;
    }

    if (!SpeechRecognition) {
      if (/Firefox/i.test(ua)) {
        setBrowserWarning('Firefox does not support the Web Speech API. Please use Google Chrome or Microsoft Edge for the best experience.');
      } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
        setBrowserWarning('Safari has limited Web Speech API support. For the best experience, please use Google Chrome or Microsoft Edge.');
      } else {
        setBrowserWarning('Your browser does not support speech recognition. Please use Google Chrome or Microsoft Edge.');
      }
    }
  }, []);

  // Refs
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(window.speechSynthesis);
  const callTimerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const handleSendMessageRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize Speech Recognition
  const initializeSpeechRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onstart = () => {
      console.log('Speech recognition started');
      setIsListening(true);
      setTranscript('');
      setFinalTranscript('');
    };

    recognition.onresult = (event) => {
      console.log('Speech recognition result event:', event.results);
      let interimTranscript = '';
      let accumulatedFinal = '';

      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          accumulatedFinal += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      setFinalTranscript(accumulatedFinal.trim());
      setTranscript(accumulatedFinal + interimTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      if (event.error === 'no-speech') {
        console.log('No speech detected, continuing...');
      } else if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please enable microphone permissions.');
      }
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
    };

    return recognition;
  }, []);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = synthesisRef.current.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
        const defaultVoice = voices.find(v => 
          v.lang.includes('en-IN') || v.name.includes('Google') || v.lang.includes('hi-IN')
        ) || voices.find(v => v.lang.includes('en')) || voices[0];
        setSelectedVoice(defaultVoice);
        console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
      }
    };

    loadVoices();
    synthesisRef.current.onvoiceschanged = loadVoices;
  }, []);

  // Text-to-Speech function
  const speak = useCallback((text) => {
    if (!isSpeakerOn) return;

    synthesisRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    } else {
      utterance.lang = 'en-IN';
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    utterance.onerror = () => setIsSpeaking(false);

    synthesisRef.current.speak(utterance);
  }, [isSpeakerOn, selectedVoice, speechRate, speechPitch]);

  // Test voice function
  const testVoice = () => {
    const testText = "Hello! I am your farming assistant. How can I help you today?";
    speak(testText);
  };

  // Connect to socket on mount
  useEffect(() => {
    const connect = async () => {
      if (!accessToken) {
        console.error('No access token available');
        setError('Please login again');
        toast.error('Session expired. Please login again.');
        navigate('/login');
        return;
      }
      
      try {
        console.log('Attempting to connect to socket...');
        await socketService.connect(accessToken);
        setIsConnected(true);
        setError(null);
        console.log('Socket connected successfully');
      } catch (error) {
        console.error('Failed to connect:', error);
        toast.error('Failed to connect to server: ' + error.message);
        setError('Failed to connect to server. Please try again.');
      }
    };

    connect();

    recognitionRef.current = initializeSpeechRecognition();
    synthesisRef.current.getVoices();

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
      synthesisRef.current.cancel();
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [accessToken, initializeSpeechRecognition]);

  // Start call
  const startCall = async () => {
    try {
      setIsProcessing(true);
      const response = await socketService.startConversation();
      
      setConversationId(response.conversationId);
      setCurrentConversation({
        _id: response.conversationId,
        title: 'New Conversation',
        messages: []
      });
      
      addMessage({
        role: 'assistant',
        content: response.welcomeMessage,
        timestamp: new Date()
      });

      setIsCallActive(true);
      setIsMicOn(true);
      
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      speak(response.welcomeMessage);
      toast.success('Call started!');
    } catch (error) {
      console.error('Failed to start call:', error);
      toast.error('Failed to start call');
    } finally {
      setIsProcessing(false);
    }
  };

  // End call
  const endCall = async () => {
    try {
      if (conversationId) {
        await socketService.endConversation(conversationId);
      }
      
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
      synthesisRef.current.cancel();
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      setIsCallActive(false);
      setIsMicOn(false);
      setIsListening(false);
      setIsSpeaking(false);

      toast.success(`Call ended. Duration: ${formatDuration(callDuration)}`);
      
      setTimeout(() => {
        clearCurrentConversation();
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Failed to end call:', error);
      toast.error('Error ending call');
    }
  };

  // Send message to AI
  const handleSendMessage = async (text) => {
    console.log('handleSendMessage called with:', text, 'conversationId:', conversationId);
    
    if (!text.trim()) {
      console.log('Empty text, returning');
      return;
    }
    
    if (!conversationId) {
      console.log('No conversationId, returning');
      toast.error('No active conversation');
      return;
    }

    try {
      setIsProcessing(true);
      console.log('Sending message to AI...');
      
      addMessage({
        role: 'user',
        content: text,
        timestamp: new Date()
      });

      const response = await socketService.sendMessage(conversationId, text);
      console.log('Got response from AI:', response);
      
      addMessage({
        role: 'assistant',
        content: response.response,
        timestamp: new Date()
      });

      if (response.title) {
        updateTitle(response.title);
      }

      speak(response.response);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to get response: ' + error.message);
    } finally {
      setIsProcessing(false);
      setTranscript('');
    }
  };

  useEffect(() => {
    handleSendMessageRef.current = handleSendMessage;
  }, [conversationId, speak, addMessage, updateTitle]);

  // Toggle microphone
  const toggleMic = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not available');
      return;
    }

    if (isMicOn) {
      recognitionRef.current.abort();
      setIsListening(false);
    }
    setIsMicOn(!isMicOn);
  };

  // Toggle speaker
  const toggleSpeaker = () => {
    if (isSpeakerOn) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
    }
    setIsSpeakerOn(!isSpeakerOn);
  };

  // Toggle listening - Start or Stop and Send
  const toggleListening = () => {
    console.log('toggleListening called', { 
      hasRecognition: !!recognitionRef.current, 
      isMicOn, 
      isListening, 
      isSpeaking,
      isProcessing,
      transcript
    });
    
    if (!recognitionRef.current) {
      toast.error('Speech recognition not initialized');
      return;
    }
    
    if (!isMicOn) {
      toast.error('Microphone is off');
      return;
    }
    
    if (isSpeaking) {
      toast.error('Please wait for AI to finish speaking');
      return;
    }
    
    if (isProcessing) {
      toast.error('Please wait for response');
      return;
    }

    if (isListening) {
      console.log('Stopping speech recognition and sending message...');
      recognitionRef.current.stop();
      setIsListening(false);
      
      const textToSend = finalTranscript || transcript;
      if (textToSend && textToSend.trim()) {
        console.log('Sending accumulated transcript:', textToSend);
        handleSendMessageRef.current(textToSend.trim());
      } else {
        toast.error('No speech detected. Please try again.');
      }
      setTranscript('');
      setFinalTranscript('');
    } else {
      try {
        console.log('Starting speech recognition...');
        setTranscript('');
        setFinalTranscript('');
        recognitionRef.current.start();
      } catch (e) {
        console.error('Failed to start recognition:', e);
        toast.error('Failed to start listening: ' + e.message);
      }
    }
  };

  // Format duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Render error state
  if (error && !isConnected) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="card p-8 max-w-md text-center animate-fadeIn">
          <div className="w-14 h-14 bg-red-50 rounded-sm flex items-center justify-center mx-auto mb-4">
            <PhoneOff className="w-7 h-7 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">Connection Error</h2>
          <p className="text-sm text-neutral-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col">
      {/* Browser Compatibility Warning */}
      {browserWarning && (
        <div className="bg-amber-500/90 text-neutral-900 px-4 py-3 flex items-center justify-center gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{browserWarning}</span>
          <button onClick={() => setBrowserWarning('')} className="ml-2 hover:text-neutral-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Voice Settings Modal */}
      {showVoiceSettings && (
        <div className="modal-overlay" onClick={() => setShowVoiceSettings(false)}>
          <div 
            className="modal w-full max-w-md animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-neutral-200">
              <h2 className="text-base font-semibold text-neutral-900">Voice Settings</h2>
              <button onClick={() => setShowVoiceSettings(false)} className="btn-icon">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-5">
              {/* Voice Selection */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Voice ({availableVoices.length} available)
                </label>
                <select
                  value={selectedVoice?.name || ''}
                  onChange={(e) => {
                    const voice = availableVoices.find(v => v.name === e.target.value);
                    setSelectedVoice(voice);
                  }}
                  className="select"
                >
                  {availableVoices.map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>

              {/* Speech Rate */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Speed: {speechRate.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={speechRate}
                  onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                  className="w-full accent-neutral-900"
                />
                <div className="flex justify-between text-xs text-neutral-500 mt-1">
                  <span>Slow</span>
                  <span>Normal</span>
                  <span>Fast</span>
                </div>
              </div>

              {/* Speech Pitch */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Pitch: {speechPitch.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={speechPitch}
                  onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                  className="w-full accent-neutral-900"
                />
                <div className="flex justify-between text-xs text-neutral-500 mt-1">
                  <span>Low</span>
                  <span>Normal</span>
                  <span>High</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-neutral-100">
              <button
                onClick={testVoice}
                disabled={isSpeaking}
                className="btn-primary w-full justify-center"
              >
                {isSpeaking ? 'Speaking...' : 'Test Voice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-neutral-800/50 backdrop-blur border-b border-neutral-700 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => isCallActive ? null : navigate('/dashboard')}
            disabled={isCallActive}
            className="flex items-center text-neutral-400 hover:text-white disabled:opacity-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <div className="text-center">
            <h1 className="text-white font-semibold">Farmer Assistant</h1>
            {isCallActive && (
              <p className="text-primary-500 text-sm font-medium">{formatDuration(callDuration)}</p>
            )}
          </div>
          <button
            onClick={() => setShowVoiceSettings(true)}
            className="flex items-center text-neutral-400 hover:text-white p-2 rounded-sm hover:bg-neutral-700 transition-colors"
            title="Voice Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4">
        {/* Messages Area */}
        <div className="flex-1 bg-neutral-800/30 rounded-sm border border-neutral-700 mb-4 overflow-hidden">
          <div className="h-full overflow-y-auto p-4 space-y-3" style={{ maxHeight: 'calc(100vh - 350px)' }}>
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-neutral-500">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Start a call to begin your conversation</p>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-sm px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-neutral-100 text-neutral-900'
                        : 'bg-neutral-700 text-neutral-100'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-neutral-700 text-neutral-100 rounded-sm px-4 py-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Transcript Display */}
        {(isListening || transcript) && (
          <div className="bg-neutral-800/50 rounded-sm p-4 mb-4 border border-neutral-700">
            <p className="text-sm text-neutral-300">
              {isListening ? (
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></span>
                  Listening: {transcript || '...'}
                </span>
              ) : (
                transcript
              )}
            </p>
          </div>
        )}

        {/* Status Indicators */}
        <div className="flex justify-center gap-3 mb-4">
          {isSpeaking && (
            <div className="bg-accent-500/20 text-accent-500 px-4 py-2 rounded-sm text-sm flex items-center">
              <Volume2 className="w-4 h-4 mr-2 animate-pulse" />
              AI is speaking...
            </div>
          )}
          {isListening && (
            <div className="bg-primary-500/20 text-primary-500 px-4 py-2 rounded-sm text-sm flex items-center">
              <Mic className="w-4 h-4 mr-2 animate-pulse" />
              Listening...
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-neutral-800/50 backdrop-blur rounded-sm border border-neutral-700 p-6">
          {!isCallActive ? (
            <div className="text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-primary-500 rounded-sm flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Phone className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-white mb-2">Ready to Call</h2>
                <p className="text-sm text-neutral-400">Tap the button below to start your voice conversation</p>
              </div>
              <button
                onClick={startCall}
                disabled={!isConnected || isProcessing}
                className="px-8 py-4 bg-primary-500 hover:bg-primary-500/90 disabled:bg-neutral-600 text-white rounded-sm font-medium text-base transition-all flex items-center justify-center mx-auto"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Phone className="w-5 h-5 mr-2" />
                )}
                Start Call
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4 sm:gap-6">
              {/* Mic Toggle */}
              <button
                onClick={toggleMic}
                className={`w-14 h-14 rounded-sm flex items-center justify-center transition-all ${
                  isMicOn
                    ? 'bg-neutral-700 hover:bg-neutral-600 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </button>

              {/* Push to Talk - Toggle Button */}
              <button
                onClick={toggleListening}
                disabled={!isMicOn || isSpeaking || isProcessing}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-sm flex flex-col items-center justify-center transition-all ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 scale-105'
                    : 'bg-primary-500 hover:bg-primary-500/90 disabled:bg-neutral-600'
                } text-white shadow-lg`}
              >
                <Mic className="w-7 h-7" />
                <span className="text-xs mt-1 font-medium">{isListening ? 'Send' : 'Speak'}</span>
              </button>

              {/* Speaker Toggle */}
              <button
                onClick={toggleSpeaker}
                className={`w-14 h-14 rounded-sm flex items-center justify-center transition-all ${
                  isSpeakerOn
                    ? 'bg-neutral-700 hover:bg-neutral-600 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
              </button>

              {/* End Call */}
              <button
                onClick={endCall}
                className="w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-sm flex items-center justify-center transition-all"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>

        {/* Instructions */}
        {isCallActive && (
          <p className="text-center text-neutral-500 text-sm mt-4">
            {isListening 
              ? 'Speak your question, then tap the button again to send' 
              : 'Tap the green button to start speaking'}
          </p>
        )}
      </main>
    </div>
  );
};

export default VoiceCall;

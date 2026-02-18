import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Send, 
  Loader2, 
  MessageSquare, 
  Bot,
  User,
  ImagePlus,
  X,
  Download,
  Moon,
  Sun
} from 'lucide-react';
import toast from 'react-hot-toast';
import conversationService from '../services/conversation.service';

const ChatBot = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're resuming an existing conversation
  const resumeData = location.state?.resumeConversation || null;

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [conversationTitle, setConversationTitle] = useState('New Chat');
  const [isInitializing, setIsInitializing] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize conversation
  useEffect(() => {
    const init = async () => {
      try {
        if (resumeData) {
          // Resume an existing conversation
          const response = await conversationService.resumeConversation(resumeData.id);
          if (response.success) {
            setConversationId(response.conversation.id);
            setConversationTitle(response.conversation.title);
            setMessages(response.conversation.messages.map(msg => ({
              role: msg.role,
              content: msg.content,
              timestamp: msg.timestamp
            })));
          }
        } else {
          // Create a new conversation
          const response = await conversationService.createConversation();
          if (response.success) {
            setConversationId(response.conversation.id);
            setMessages([{
              role: 'assistant',
              content: response.conversation.welcomeMessage || "Namaste! I am your Farming Assistant. Type your question and I'll help you with any agricultural queries!",
              timestamp: new Date()
            }]);
          }
        }
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        toast.error('Failed to start chat');
      } finally {
        setIsInitializing(false);
      }
    };

    init();
  }, []);

  // Handle send message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    
    const text = inputMessage.trim();
    if (!text && !selectedImage) return;
    if (!conversationId) {
      toast.error('Chat not initialized');
      return;
    }

    // Add user message to UI
    const userMessage = {
      role: 'user',
      content: text || '📷 Image sent for analysis',
      timestamp: new Date(),
      imagePreview: imagePreview
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Clear image
    setSelectedImage(null);
    setImagePreview(null);

    try {
      const response = await conversationService.sendMessage(conversationId, text);
      
      if (response.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.response,
          timestamp: new Date()
        }]);
        
        if (response.conversation?.title) {
          setConversationTitle(response.conversation.title);
        }
      }
    } catch (error) {
      console.error('Send message error:', error);
      toast.error('Failed to get response');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Handle end conversation
  const handleEndChat = async () => {
    if (conversationId) {
      try {
        await conversationService.endConversation(conversationId);
        toast.success('Chat ended');
      } catch (error) {
        console.error('End chat error:', error);
      }
    }
    navigate('/dashboard');
  };

  // Export conversation
  const handleExport = () => {
    const text = messages.map(msg => {
      const role = msg.role === 'user' ? 'You' : 'Assistant';
      const time = new Date(msg.timestamp).toLocaleString('en-IN');
      return `[${time}] ${role}: ${msg.content}`;
    }).join('\n\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conversationTitle || 'chat'}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Conversation exported!');
  };

  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format time
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">
            {resumeData ? 'Resuming conversation...' : 'Starting new chat...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={handleEndChat}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <div className="text-center flex-1 mx-4">
            <h1 className="text-gray-900 dark:text-white font-semibold flex items-center justify-center">
              <MessageSquare className="w-5 h-5 mr-2 text-green-600" />
              {conversationTitle}
            </h1>
            {resumeData && (
              <span className="text-xs text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                Continued
              </span>
            )}
          </div>
          <button
            onClick={handleExport}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Export conversation"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col p-4">
          <div className="flex-1 overflow-y-auto space-y-4 pb-4" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div className={`flex items-start gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
                  }`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  
                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-green-600 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm border border-gray-100 dark:border-gray-600'
                    }`}
                  >
                    {msg.imagePreview && (
                      <img 
                        src={msg.imagePreview} 
                        alt="Uploaded" 
                        className="max-w-[200px] rounded-lg mb-2"
                      />
                    )}
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    <p className={`text-xs mt-1 ${
                      msg.role === 'user' ? 'text-green-200' : 'text-gray-400 dark:text-gray-500'
                    }`}>
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex justify-start animate-fadeIn">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-2xl px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-600">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* Image Preview */}
      {imagePreview && (
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2 flex items-center gap-2 mb-2">
            <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded object-cover" />
            <span className="text-sm text-gray-600 dark:text-gray-300 flex-1">Image attached</span>
            <button 
              onClick={() => { setSelectedImage(null); setImagePreview(null); }}
              className="p-1 text-gray-500 hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            {/* Image Upload Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              title="Upload image for crop diagnosis"
            >
              <ImagePlus className="w-5 h-5" />
            </button>

            {/* Text Input */}
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your farming question..."
                rows={1}
                className="w-full resize-none rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-3 pr-12 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                style={{ maxHeight: '120px', minHeight: '48px' }}
                disabled={isLoading}
              />
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={isLoading || (!inputMessage.trim() && !selectedImage)}
              className="p-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white rounded-xl transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;

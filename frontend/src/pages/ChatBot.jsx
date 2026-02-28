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
  Download
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
      content: text || 'Image sent for analysis',
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
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400 mx-auto mb-4" />
          <p className="text-sm text-neutral-500">
            {resumeData ? 'Resuming conversation...' : 'Starting new chat...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col">
      {/* Header */}
      <header className="topbar sticky top-0 z-40">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
          <button
            onClick={handleEndChat}
            className="btn-ghost gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-neutral-400" />
            <span className="font-medium text-neutral-900 dark:text-white text-sm">
              {conversationTitle}
            </span>
            {resumeData && (
              <span className="chip text-xs">Continued</span>
            )}
          </div>

          <button
            onClick={handleExport}
            className="btn-icon"
            title="Export conversation"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col px-4 py-6">
          <div className="flex-1 overflow-y-auto space-y-4 scrollbar-hide" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={`flex items-start gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' 
                      ? 'bg-primary-600' 
                      : 'bg-secondary-100 dark:bg-secondary-900/30'
                  }`}>
                    {msg.role === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-secondary-600 dark:text-secondary-400" />
                    )}
                  </div>
                  
                  {/* Message Bubble */}
                  <div
                    className={`rounded-sm px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-800'
                    }`}
                  >
                    {msg.imagePreview && (
                      <img 
                        src={msg.imagePreview} 
                        alt="Uploaded" 
                        className="max-w-[200px] rounded-sm mb-2"
                      />
                    )}
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    <p className={`text-xs mt-2 ${
                      msg.role === 'user' 
                        ? 'text-neutral-400 dark:text-neutral-500' 
                        : 'text-neutral-400'
                    }`}>
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-sm bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                  </div>
                  <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm px-4 py-3">
                    <div className="flex space-x-1.5">
                      <div className="w-2 h-2 bg-neutral-300 dark:bg-neutral-600 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-neutral-300 dark:bg-neutral-600 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-neutral-300 dark:bg-neutral-600 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
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
          <div className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm p-3 flex items-center gap-3 mb-2">
            <img src={imagePreview} alt="Preview" className="w-12 h-12 rounded-sm object-cover" />
            <span className="text-sm text-neutral-600 dark:text-neutral-400 flex-1">Image attached</span>
            <button 
              onClick={() => { setSelectedImage(null); setImagePreview(null); }}
              className="btn-icon p-1.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4">
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
              className="btn-icon"
              title="Upload image for crop diagnosis"
            >
              <ImagePlus className="w-4 h-4" />
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
                className="input resize-none py-3"
                style={{ maxHeight: '120px', minHeight: '48px' }}
                disabled={isLoading}
              />
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={isLoading || (!inputMessage.trim() && !selectedImage)}
              className="btn-primary px-4 py-3 disabled:opacity-40"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
          <p className="text-xs text-neutral-400 mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;

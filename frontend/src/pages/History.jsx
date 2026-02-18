import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  History as HistoryIcon, 
  Trash2, 
  Clock, 
  MessageCircle,
  ChevronRight,
  Phone,
  Loader2,
  Search,
  MessageSquarePlus,
  Download,
  AlertTriangle,
  Mic,
  Type
} from 'lucide-react';
import toast from 'react-hot-toast';
import useConversationStore from '../store/conversationStore';
import conversationService from '../services/conversation.service';

const History = () => {
  const navigate = useNavigate();
  const { conversations, fetchConversations, deleteConversation, isLoading } = useConversationStore();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationDetails, setConversationDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, title: '' });

  useEffect(() => {
    fetchConversations().catch(console.error);
  }, [fetchConversations]);

  // Delete confirmation modal helpers
  const openDeleteModal = (e, id, title) => {
    e.stopPropagation();
    setDeleteModal({ open: true, id, title });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ open: false, id: null, title: '' });
  };

  const confirmDelete = async () => {
    try {
      await deleteConversation(deleteModal.id);
      if (selectedConversation === deleteModal.id) {
        setSelectedConversation(null);
        setConversationDetails(null);
      }
      toast.success('Conversation deleted');
    } catch (error) {
      toast.error('Failed to delete conversation');
    } finally {
      closeDeleteModal();
    }
  };

  const handleSelectConversation = async (id) => {
    setSelectedConversation(id);
    setLoadingDetails(true);
    try {
      const response = await conversationService.getConversation(id);
      setConversationDetails(response.conversation);
    } catch (error) {
      toast.error('Failed to load conversation');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Continue chat – navigate to chatbot with conversation data
  const handleContinueChat = () => {
    if (conversationDetails) {
      navigate('/chat', {
        state: {
          resumeConversation: {
            id: conversationDetails._id,
            title: conversationDetails.title,
            messages: conversationDetails.messages
          }
        }
      });
    }
  };

  // Export conversation as .txt
  const handleExport = () => {
    if (!conversationDetails) return;

    const text = [
      `Conversation: ${conversationDetails.title}`,
      `Date: ${formatDate(conversationDetails.createdAt)}`,
      `Duration: ${formatDuration(conversationDetails.duration)}`,
      `Messages: ${conversationDetails.messages?.length || 0}`,
      `${'='.repeat(50)}`,
      '',
      ...conversationDetails.messages.map(msg => {
        const role = msg.role === 'user' ? 'You' : 'Assistant';
        const time = new Date(msg.timestamp).toLocaleString('en-IN');
        return `[${time}] ${role}:\n${msg.content}\n`;
      })
    ].join('\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conversationDetails.title || 'conversation'}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Conversation exported!');
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return formatDate(date);
  };

  const filteredConversations = conversations.filter(conv => 
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getModeIcon = (mode) => {
    switch (mode) {
      case 'voice': return <Mic className="w-3 h-3" />;
      case 'text': return <Type className="w-3 h-3" />;
      case 'continued': return <MessageSquarePlus className="w-3 h-3" />;
      default: return <Mic className="w-3 h-3" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors">
      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
              Delete Conversation
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center text-sm mb-6">
              Are you sure you want to delete &quot;{deleteModal.title}&quot;? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={closeDeleteModal}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <HistoryIcon className="w-5 h-5 mr-2" />
            Conversation History
          </h1>
          <div className="w-32"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Conversation List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden transition-colors">
              {/* Search */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* List */}
              <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No conversations found</p>
                    <button
                      onClick={() => navigate('/chat')}
                      className="mt-4 text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                      Start a new chat →
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredConversations.map((conv) => (
                      <div
                        key={conv._id}
                        onClick={() => handleSelectConversation(conv._id)}
                        className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                          selectedConversation === conv._id ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 dark:text-white truncate">{conv.title}</h4>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1 flex-wrap">
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatDuration(conv.duration)}
                              </span>
                              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                                conv.isActive 
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                                  : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                              }`}>
                                {getModeIcon(conv.mode)}
                                {conv.isActive ? 'Active' : 'Completed'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatRelativeTime(conv.createdAt)}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => openDeleteModal(e, conv._id, conv.title)}
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Conversation Details */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden h-[calc(100vh-200px)] transition-colors">
              {!selectedConversation ? (
                <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <Phone className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Select a conversation to view details</p>
                    <p className="text-sm mt-2">Or start a new conversation</p>
                    <div className="flex gap-3 justify-center mt-4">
                      <button
                        onClick={() => navigate('/call')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-2"
                      >
                        <Mic className="w-4 h-4" /> Voice Call
                      </button>
                      <button
                        onClick={() => navigate('/chat')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
                      >
                        <MessageCircle className="w-4 h-4" /> Text Chat
                      </button>
                    </div>
                  </div>
                </div>
              ) : loadingDetails ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                </div>
              ) : conversationDetails ? (
                <div className="h-full flex flex-col">
                  {/* Header */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{conversationDetails.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <span>{formatDate(conversationDetails.createdAt)}</span>
                          <span>•</span>
                          <span>{conversationDetails.messages?.length || 0} messages</span>
                          <span>•</span>
                          <span>{formatDuration(conversationDetails.duration)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Export Button */}
                        <button
                          onClick={handleExport}
                          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Export conversation"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {/* Continue Chat Button */}
                        {!conversationDetails.isActive && (
                          <button
                            onClick={handleContinueChat}
                            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            <MessageSquarePlus className="w-4 h-4" />
                            Continue Chat
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {conversationDetails.messages?.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                            msg.role === 'user'
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p className={`text-xs mt-1 ${
                            msg.role === 'user' ? 'text-green-200' : 'text-gray-400 dark:text-gray-500'
                          }`}>
                            {new Date(msg.timestamp).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default History;

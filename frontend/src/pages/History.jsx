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
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 transition-colors">
      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <>
          <div className="modal-overlay" onClick={closeDeleteModal} />
          <div className="modal max-w-sm">
            <div className="modal-body text-center">
              <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-sm flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                Delete Conversation
              </h3>
              <p className="text-sm text-neutral-500 mb-6">
                Are you sure you want to delete &quot;{deleteModal.title}&quot;? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={closeDeleteModal}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="btn-primary flex-1"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Header */}
      <header className="topbar sticky top-0 z-40">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-ghost gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <HistoryIcon className="w-4 h-4 text-neutral-400" />
            <h1 className="font-semibold text-neutral-900 dark:text-white">
              History
            </h1>
          </div>
          <div className="w-20"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="content-canvas animate-fade-in">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Conversation List */}
          <div className="lg:col-span-1">
            <div className="card overflow-hidden">
              {/* Search */}
              <div className="p-4 border-b border-neutral-100 dark:border-neutral-800">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>

              {/* List */}
              <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="empty-state py-12">
                    <MessageCircle className="empty-state-icon w-10 h-10" />
                    <p className="empty-state-title">No conversations</p>
                    <p className="empty-state-description">Start a new chat to see it here</p>
                    <button
                      onClick={() => navigate('/chat')}
                      className="btn-primary mt-4 text-sm"
                    >
                      Start Chat
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {filteredConversations.map((conv, index) => (
                      <div
                        key={conv._id}
                        onClick={() => handleSelectConversation(conv._id)}
                        className={`p-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors animate-fade-in-up stagger-${Math.min(index + 1, 6)} ${
                          selectedConversation === conv._id 
                            ? 'bg-neutral-100 dark:bg-neutral-800 border-l-2 border-l-neutral-900 dark:border-l-white' 
                            : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-neutral-900 dark:text-white text-sm truncate">
                              {conv.title}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1.5 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDuration(conv.duration)}
                              </span>
                              <span className={`chip text-xs ${conv.isActive ? 'chip-active' : ''}`}>
                                {getModeIcon(conv.mode)}
                                {conv.isActive ? 'Active' : 'Done'}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-400 mt-1.5">
                              {formatRelativeTime(conv.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => openDeleteModal(e, conv._id, conv.title)}
                              className="btn-icon p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <ChevronRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600" />
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
            <div className="card overflow-hidden h-[calc(100vh-200px)]">
              {!selectedConversation ? (
                <div className="h-full flex items-center justify-center">
                  <div className="empty-state">
                    <Phone className="empty-state-icon w-12 h-12" />
                    <p className="empty-state-title">Select a conversation</p>
                    <p className="empty-state-description">Choose from the list or start a new one</p>
                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => navigate('/call')}
                        className="btn-primary gap-2 text-sm"
                      >
                        <Mic className="w-4 h-4" /> Voice
                      </button>
                      <button
                        onClick={() => navigate('/chat')}
                        className="btn-secondary gap-2 text-sm"
                      >
                        <MessageCircle className="w-4 h-4" /> Chat
                      </button>
                    </div>
                  </div>
                </div>
              ) : loadingDetails ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                </div>
              ) : conversationDetails ? (
                <div className="h-full flex flex-col">
                  {/* Header */}
                  <div className="card-header flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-neutral-900 dark:text-white truncate">
                        {conversationDetails.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1 flex-wrap">
                        <span>{formatDate(conversationDetails.createdAt)}</span>
                        <span className="w-1 h-1 bg-neutral-300 dark:bg-neutral-600 rounded-full" />
                        <span>{conversationDetails.messages?.length || 0} messages</span>
                        <span className="w-1 h-1 bg-neutral-300 dark:bg-neutral-600 rounded-full" />
                        <span>{formatDuration(conversationDetails.duration)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={handleExport}
                        className="btn-icon"
                        title="Export"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {!conversationDetails.isActive && (
                        <button
                          onClick={handleContinueChat}
                          className="btn-primary gap-2 text-sm"
                        >
                          <MessageSquarePlus className="w-4 h-4" />
                          <span className="hidden sm:inline">Continue</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50 dark:bg-neutral-950">
                    {conversationDetails.messages?.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                      >
                        <div
                          className={`max-w-[80%] rounded-sm px-4 py-3 ${
                            msg.role === 'user'
                              ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                              : 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-800'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <p className={`text-xs mt-2 ${
                            msg.role === 'user' 
                              ? 'text-neutral-400 dark:text-neutral-500' 
                              : 'text-neutral-400'
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

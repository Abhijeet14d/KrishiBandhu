import { useEffect } from 'react';
import { Phone, History, User as UserIcon, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useConversationStore from '../store/conversationStore';

const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const { conversations, fetchConversations } = useConversationStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchConversations().catch(console.error);
  }, [fetchConversations]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleStartCall = () => {
    navigate('/call');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                Farmer Assistant
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 font-medium">
                Welcome, {user?.name}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:text-red-700 font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Your Dashboard
          </h1>
          <p className="text-gray-600">
            Start a voice call to get instant answers to your farming questions
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Start Call */}
          <button 
            onClick={handleStartCall}
            className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                <Phone className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Start Call</h3>
              <p className="text-green-100">
                Begin voice conversation with AI assistant
              </p>
            </div>
          </button>

          {/* History */}
          <button 
            onClick={() => navigate('/history')}
            className="bg-white rounded-2xl p-8 shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <History className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">History</h3>
              <p className="text-gray-600">
                {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
              </p>
            </div>
          </button>

          {/* Profile */}
          <button 
            onClick={() => navigate('/profile')}
            className="bg-white rounded-2xl p-8 shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <UserIcon className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Profile</h3>
              <p className="text-gray-600">
                Manage your account settings
              </p>
            </div>
          </button>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Information</h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <UserIcon className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">{user?.name}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">{user?.phone}</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="w-5 h-5 text-gray-400">✉️</span>
              <span className="text-gray-700">{user?.email}</span>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            How to use:
          </h3>
          <ul className="list-disc list-inside space-y-1 text-blue-800">
            <li>Click "Start Call" to begin a voice conversation</li>
            <li>Speak your farming questions clearly</li>
            <li>The AI will respond with expert guidance</li>
            <li>Check "History" to review past conversations</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

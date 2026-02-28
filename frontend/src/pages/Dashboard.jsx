import { useEffect, useState } from 'react';
import { 
  Phone, 
  History, 
  User as UserIcon, 
  LogOut, 
  Cloud, 
  Sun, 
  CloudRain, 
  Wind, 
  Droplets,
  Thermometer,
  MapPin,
  FileText,
  ExternalLink,
  Loader2,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  Moon,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useConversationStore from '../store/conversationStore';
import dataService from '../services/data.service';
import adminService from '../services/admin.service';

// Weather icon mapping
const getWeatherIcon = (condition) => {
  const cond = condition?.toLowerCase() || '';
  if (cond.includes('rain') || cond.includes('drizzle')) return <CloudRain className="w-6 h-6" />;
  if (cond.includes('cloud')) return <Cloud className="w-6 h-6" />;
  return <Sun className="w-6 h-6" />;
};

const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const { conversations, fetchConversations } = useConversationStore();
  const navigate = useNavigate();

  const [weather, setWeather] = useState(null);
  const [schemes, setSchemes] = useState([]);
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);
  const [isLoadingSchemes, setIsLoadingSchemes] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  // Toggle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    fetchConversations().catch(console.error);
    fetchWeatherData();
    fetchSchemesData();
  }, [fetchConversations]);

  const fetchWeatherData = async () => {
    setIsLoadingWeather(true);
    try {
      const response = await dataService.getCurrentWeather();
      if (response.success && response.data) {
        setWeather(response.data);
      } else {
        setMockWeather();
      }
    } catch (error) {
      console.error('Weather fetch error:', error);
      setMockWeather();
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const setMockWeather = () => {
    setWeather({
      location: user?.location?.city || user?.location?.district || 'Your Location',
      temperature: { current: 28, feelsLike: 30, min: 24, max: 32, unit: '°C' },
      humidity: 65,
      windSpeed: 12,
      condition: 'Partly Cloudy',
      description: 'scattered clouds',
      isMockData: true
    });
  };

  const fetchSchemesData = async () => {
    setIsLoadingSchemes(true);
    try {
      const response = await adminService.getPublicSchemes();
      if (response.success && response.data?.length > 0) {
        setSchemes(response.data);
      } else {
        setSchemes([]);
      }
    } catch (error) {
      console.error('Schemes fetch error:', error);
      setSchemes([]);
    } finally {
      setIsLoadingSchemes(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleStartCall = () => {
    navigate('/call');
  };

  const hasLocation = user?.location?.state;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 transition-colors">
      {/* Top Navigation */}
      <header className="topbar sticky top-0 z-40">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-600 flex items-center justify-center rounded-sm">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-neutral-900 dark:text-white hidden sm:block">
              Farmer Assistant
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="btn-icon"
              title="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-sm">
              <UserIcon className="w-4 h-4 text-neutral-500" />
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {user?.name}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="btn-icon text-neutral-500 hover:text-red-600"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="content-canvas animate-fade-in">
        
        {/* Location Warning */}
        {!hasLocation && (
          <div className="card p-4 mb-6 flex items-center justify-between gap-4 border-l-4 border-l-neutral-400">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-neutral-500" />
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                Set your location in Profile to get personalized weather and market data.
              </span>
            </div>
            <button 
              onClick={() => navigate('/profile')}
              className="btn-secondary text-sm"
            >
              Set Location
            </button>
          </div>
        )}

        {/* Weather Card */}
        <div className="card p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-neutral-400" />
              <span className="text-sm text-neutral-500">
                {weather?.location || user?.location?.district || user?.location?.state || 'Your Location'}
              </span>
              {weather?.isMockData && (
                <span className="chip text-xs">Sample</span>
              )}
            </div>
            <button 
              onClick={fetchWeatherData}
              className="btn-icon"
              title="Refresh weather"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingWeather ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {isLoadingWeather ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
            </div>
          ) : weather ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Temperature */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Temperature</p>
                    <p className="text-3xl font-semibold text-neutral-900 dark:text-white">
                      {weather.temperature?.current}°
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      Feels {weather.temperature?.feelsLike}°
                    </p>
                  </div>
                  <Thermometer className="w-5 h-5 text-neutral-400" />
                </div>
              </div>

              {/* Condition */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Condition</p>
                    <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                      {weather.condition}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1 capitalize">
                      {weather.description}
                    </p>
                  </div>
                  <span className="text-neutral-400">{getWeatherIcon(weather.condition)}</span>
                </div>
              </div>

              {/* Humidity */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Humidity</p>
                    <p className="text-3xl font-semibold text-neutral-900 dark:text-white">
                      {weather.humidity}%
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {weather.humidity > 70 ? 'High' : weather.humidity > 40 ? 'Moderate' : 'Low'}
                    </p>
                  </div>
                  <Droplets className="w-5 h-5 text-neutral-400" />
                </div>
              </div>

              {/* Wind */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Wind Speed</p>
                    <p className="text-3xl font-semibold text-neutral-900 dark:text-white">
                      {weather.windSpeed}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">km/h</p>
                  </div>
                  <Wind className="w-5 h-5 text-neutral-400" />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-neutral-500 text-center py-8">Weather data unavailable</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Voice Call */}
          <button 
            onClick={handleStartCall}
            className="card card-hover p-6 text-left group"
          >
            <div className="w-12 h-12 bg-primary-600 rounded-sm flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">
              Voice Call
            </h3>
            <p className="text-sm text-neutral-500">
              Speak with AI assistant
            </p>
            <ChevronRight className="w-4 h-4 text-primary-600 mt-4 transition-transform group-hover:translate-x-1" />
          </button>

          {/* Text Chat */}
          <button 
            onClick={() => navigate('/chat')}
            className="card card-hover p-6 text-left group"
          >
            <div className="w-12 h-12 bg-accent-500 rounded-sm flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">
              Text Chat
            </h3>
            <p className="text-sm text-neutral-500">
              Type your farming questions
            </p>
            <ChevronRight className="w-4 h-4 text-accent-500 mt-4 transition-transform group-hover:translate-x-1" />
          </button>

          {/* History */}
          <button 
            onClick={() => navigate('/history')}
            className="card card-hover p-6 text-left group"
          >
            <div className="w-12 h-12 bg-secondary-500 rounded-sm flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
              <History className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">
              History
            </h3>
            <p className="text-sm text-neutral-500">
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </p>
            <ChevronRight className="w-4 h-4 text-secondary-500 mt-4 transition-transform group-hover:translate-x-1" />
          </button>

          {/* Profile */}
          <button 
            onClick={() => navigate('/profile')}
            className="card card-hover p-6 text-left group"
          >
            <div className="w-12 h-12 bg-earth-500 rounded-sm flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">
              Profile
            </h3>
            <p className="text-sm text-neutral-500">
              Manage your settings
            </p>
            <ChevronRight className="w-4 h-4 text-earth-500 mt-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Government Schemes Section */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-neutral-500" />
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Government Schemes
              </h2>
            </div>
            <button 
              onClick={fetchSchemesData}
              className="btn-icon"
              title="Refresh schemes"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingSchemes ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="card-body">
            {isLoadingSchemes ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
              </div>
            ) : schemes.length === 0 ? (
              <div className="empty-state py-12">
                <FileText className="empty-state-icon w-12 h-12" />
                <p className="empty-state-title">No schemes available</p>
                <p className="empty-state-description">
                  Check back later for government scheme updates
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {schemes.map((scheme, index) => (
                  <div 
                    key={scheme._id}
                    className={`p-4 border border-neutral-200 dark:border-neutral-800 rounded-sm hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors animate-fade-in-up stagger-${Math.min(index + 1, 6)}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="chip">
                        {scheme.category || 'General'}
                      </span>
                      <span className={`chip ${scheme.type === 'central' ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' : ''}`}>
                        {scheme.type === 'central' ? 'Central' : scheme.state}
                      </span>
                    </div>
                    <h3 className="font-medium text-neutral-900 dark:text-white mb-2 line-clamp-2">
                      {scheme.title}
                    </h3>
                    <p className="text-sm text-neutral-500 mb-4 line-clamp-2">
                      {scheme.description}
                    </p>
                    <div className="flex items-center justify-between">
                      {scheme.benefits && (
                        <span className="text-xs text-neutral-400">
                          {scheme.benefits}
                        </span>
                      )}
                      {scheme.link && (
                        <a 
                          href={scheme.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-icon p-1"
                          title="Visit portal"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

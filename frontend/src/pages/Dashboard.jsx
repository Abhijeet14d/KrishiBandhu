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
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useConversationStore from '../store/conversationStore';
import dataService from '../services/data.service';

// Weather icon mapping
const getWeatherIcon = (condition) => {
  const cond = condition?.toLowerCase() || '';
  if (cond.includes('rain') || cond.includes('drizzle')) return <CloudRain className="w-8 h-8 text-blue-200" />;
  if (cond.includes('cloud')) return <Cloud className="w-8 h-8 text-blue-200" />;
  return <Sun className="w-8 h-8 text-yellow-300" />;
};

const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const { conversations, fetchConversations } = useConversationStore();
  const navigate = useNavigate();

  const [weather, setWeather] = useState(null);
  const [schemes, setSchemes] = useState([]);
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);
  const [isLoadingSchemes, setIsLoadingSchemes] = useState(true);

  const getMockSchemes = () => [
    {
      name: 'PM-KISAN',
      description: 'Direct income support of ₹6,000 per year to farmer families',
      benefits: '₹6,000 per year in 3 installments',
      category: 'Income Support',
      link: 'https://pmkisan.gov.in'
    },
    {
      name: 'PM Fasal Bima Yojana',
      description: 'Crop insurance scheme to protect against crop loss',
      benefits: 'Insurance coverage up to 98% premium subsidy',
      category: 'Crop Insurance',
      link: 'https://pmfby.gov.in'
    },
    {
      name: 'Kisan Credit Card',
      description: 'Affordable credit for agricultural needs',
      benefits: 'Credit at 4% interest rate',
      category: 'Credit/Loan',
      link: 'https://www.nabard.org'
    },
    {
      name: 'PM Krishi Sinchai Yojana',
      description: 'Promotes efficient water use through micro-irrigation',
      benefits: 'Up to 55-90% subsidy on irrigation',
      category: 'Irrigation',
      link: 'https://pmksy.gov.in'
    },
    {
      name: 'Soil Health Card',
      description: 'Free soil testing and crop-wise nutrient recommendations',
      benefits: 'Free soil testing service',
      category: 'Soil Health',
      link: 'https://soilhealth.dac.gov.in'
    },
    {
      name: 'National Mission on Sustainable Agriculture',
      description: 'Promotes sustainable farming practices and climate resilience',
      benefits: 'Training and financial support',
      category: 'Sustainable Farming',
      link: 'https://nmsa.dac.gov.in'
    }
  ];

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
      const response = await dataService.getGovernmentSchemes();
      if (response.success && response.data?.schemes?.length > 0) {
        setSchemes(response.data.schemes);
      } else {
        setSchemes(getMockSchemes());
      }
    } catch (error) {
      console.error('Schemes fetch error:', error);
      setSchemes(getMockSchemes());
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Location Warning */}
        {!hasLocation && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
              <span className="text-yellow-800">
                Set your location in Profile to get personalized weather and market data for your area.
              </span>
            </div>
            <button 
              onClick={() => navigate('/profile')}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
            >
              Set Location
            </button>
          </div>
        )}

        {/* Weather Card */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 mb-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center mb-2">
                <MapPin className="w-4 h-4 mr-1" />
                <span className="text-blue-100 text-sm">
                  {weather?.location || user?.location?.district || user?.location?.state || 'Your Location'}
                </span>
                {weather?.isMockData && (
                  <span className="ml-2 text-xs bg-blue-400/50 px-2 py-0.5 rounded">Sample</span>
                )}
              </div>
              <h2 className="text-lg font-semibold mb-4">Current Weather</h2>
            </div>
            <button 
              onClick={fetchWeatherData}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Refresh weather"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingWeather ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {isLoadingWeather ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : weather ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Temperature */}
              <div className="bg-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Temperature</p>
                    <p className="text-3xl font-bold">{weather.temperature?.current}°C</p>
                    <p className="text-blue-200 text-xs">Feels like {weather.temperature?.feelsLike}°C</p>
                  </div>
                  <Thermometer className="w-8 h-8 text-blue-200" />
                </div>
              </div>

              {/* Condition */}
              <div className="bg-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Condition</p>
                    <p className="text-xl font-semibold">{weather.condition}</p>
                    <p className="text-blue-200 text-xs capitalize">{weather.description}</p>
                  </div>
                  {getWeatherIcon(weather.condition)}
                </div>
              </div>

              {/* Humidity */}
              <div className="bg-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Humidity</p>
                    <p className="text-3xl font-bold">{weather.humidity}%</p>
                    <p className="text-blue-200 text-xs">
                      {weather.humidity > 70 ? 'High' : weather.humidity > 40 ? 'Moderate' : 'Low'}
                    </p>
                  </div>
                  <Droplets className="w-8 h-8 text-blue-200" />
                </div>
              </div>

              {/* Wind */}
              <div className="bg-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Wind Speed</p>
                    <p className="text-3xl font-bold">{weather.windSpeed}</p>
                    <p className="text-blue-200 text-xs">km/h</p>
                  </div>
                  <Wind className="w-8 h-8 text-blue-200" />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-blue-100">Weather data unavailable</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
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

        {/* Government Schemes Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <FileText className="w-6 h-6 text-green-600 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">Government Schemes for Farmers</h2>
            </div>
            <button 
              onClick={fetchSchemesData}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Refresh schemes"
            >
              <RefreshCw className={`w-4 h-4 text-gray-500 ${isLoadingSchemes ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {isLoadingSchemes ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schemes.slice(0, 6).map((scheme, index) => (
                <div 
                  key={index}
                  className="border border-gray-200 rounded-xl p-4 hover:border-green-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                      {scheme.category}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{scheme.name}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{scheme.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      💰 {scheme.benefits}
                    </span>
                    {scheme.link && (
                      <a 
                        href={scheme.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700 p-1"
                        title="Learn more"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

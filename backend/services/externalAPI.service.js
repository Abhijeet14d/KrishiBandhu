const axios = require('axios');

/**
 * External API Service
 * Handles fetching data from market prices, weather, and government schemes APIs
 */
class ExternalAPIService {
  constructor() {
    // API configurations - Replace with actual API keys and endpoints
    this.marketPriceAPI = {
      baseURL: process.env.MARKET_PRICE_API_URL || 'https://api.data.gov.in/resource',
      apiKey: process.env.MARKET_PRICE_API_KEY || ''
    };

    this.weatherAPI = {
      baseURL: process.env.WEATHER_API_URL || 'https://api.openweathermap.org/data/2.5',
      apiKey: process.env.WEATHER_API_KEY || ''
    };

    this.governmentSchemeAPI = {
      baseURL: process.env.GOV_SCHEME_API_URL || 'https://api.data.gov.in/resource',
      apiKey: process.env.GOV_SCHEME_API_KEY || ''
    };

    // Cache for API responses (TTL: 30 minutes)
    this.cache = new Map();
    this.cacheTTL = 30 * 60 * 1000; // 30 minutes
  }

  /**
   * Get cached data or fetch fresh
   */
  getCachedOrFetch(cacheKey, fetchFn) {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log(`📦 Cache hit for: ${cacheKey}`);
      return cached.data;
    }
    return fetchFn();
  }

  /**
   * Set cache with timestamp
   */
  setCache(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  // ==================== MARKET PRICE APIs ====================

  /**
   * Fetch market prices for crops based on location
   * @param {Object} params - { state, district, market, commodity }
   * @returns {Promise<Object>} Market price data
   */
  async getMarketPrices(params = {}) {
    const { state, district, market, commodity } = params;
    const cacheKey = `market_${state}_${district}_${commodity}`;

    return this.getCachedOrFetch(cacheKey, async () => {
      try {
        // Using data.gov.in Agmarknet API
        // Resource: Current Daily Price of Various Commodities from Various Markets (Mandi)
        const apiParams = {
          'api-key': this.marketPriceAPI.apiKey,
          format: 'json',
          limit: 50
        };

        // Add filters if provided (data.gov.in uses specific filter format)
        const filters = {};
        if (state) filters.state = state;
        if (district) filters.district = district;
        if (market) filters.market = market;
        if (commodity) filters.commodity = commodity;
        
        if (Object.keys(filters).length > 0) {
          // data.gov.in filter format: filters[column_name]=value
          Object.entries(filters).forEach(([key, value]) => {
            apiParams[`filters[${key}]`] = value;
          });
        }

        console.log('📊 Fetching market prices from data.gov.in...');
        const response = await axios.get(`${this.marketPriceAPI.baseURL}/9ef84268-d588-465a-a308-a864a43d0070`, {
          params: apiParams,
          timeout: 15000
        });

        if (response.data && response.data.records && response.data.records.length > 0) {
          const data = this.formatMarketPriceData(response.data);
          this.setCache(cacheKey, data);
          console.log(`✅ Market prices fetched: ${data.totalRecords} records`);
          return data;
        } else {
          console.log('⚠️ No market data found, using mock data');
          return this.getMockMarketPrices(state, district, commodity);
        }
      } catch (error) {
        console.error('❌ Market Price API Error:', error.message);
        // Check if rate limited
        if (error.response?.data?.error?.includes('Rate limit')) {
          console.log('⚠️ API rate limited, using cached/mock data');
        }
        return this.getMockMarketPrices(state, district, commodity);
      }
    });
  }

  /**
   * Format market price data for AI consumption
   */
  formatMarketPriceData(rawData) {
    if (!rawData || !rawData.records) {
      return { prices: [], summary: 'No market data available' };
    }

    const prices = rawData.records.map(record => ({
      commodity: record.commodity,
      variety: record.variety,
      market: record.market,
      minPrice: record.min_price,
      maxPrice: record.max_price,
      modalPrice: record.modal_price,
      priceUnit: 'INR/Quintal',
      arrivalDate: record.arrival_date
    }));

    return {
      prices,
      totalRecords: prices.length,
      summary: `Found ${prices.length} market price records`,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Mock market prices for testing/fallback
   */
  getMockMarketPrices(state, district, commodity) {
    const mockData = {
      prices: [
        { commodity: commodity || 'Wheat', variety: 'Local', market: district || 'Local Market', minPrice: 2200, maxPrice: 2500, modalPrice: 2350, priceUnit: 'INR/Quintal' },
        { commodity: commodity || 'Rice', variety: 'Basmati', market: district || 'Local Market', minPrice: 3500, maxPrice: 4200, modalPrice: 3800, priceUnit: 'INR/Quintal' },
        { commodity: 'Tomato', variety: 'Hybrid', market: district || 'Local Market', minPrice: 1500, maxPrice: 2500, modalPrice: 2000, priceUnit: 'INR/Quintal' },
        { commodity: 'Onion', variety: 'Red', market: district || 'Local Market', minPrice: 1200, maxPrice: 1800, modalPrice: 1500, priceUnit: 'INR/Quintal' },
        { commodity: 'Potato', variety: 'Local', market: district || 'Local Market', minPrice: 800, maxPrice: 1200, modalPrice: 1000, priceUnit: 'INR/Quintal' }
      ],
      totalRecords: 5,
      summary: `Market prices for ${state || 'your region'} (Sample Data)`,
      lastUpdated: new Date().toISOString(),
      isMockData: true
    };
    return mockData;
  }

  // ==================== WEATHER APIs ====================

  /**
   * Fetch current weather data
   * @param {Object} location - { lat, lon } or { city, state }
   * @returns {Promise<Object>} Weather data
   */
  async getCurrentWeather(location = {}) {
    const { lat, lon, city, state } = location;
    const cacheKey = `weather_current_${lat || city}_${lon || state}`;

    return this.getCachedOrFetch(cacheKey, async () => {
      try {
        let params = {
          appid: this.weatherAPI.apiKey,
          units: 'metric',
          lang: 'en'
        };

        if (lat && lon) {
          params.lat = lat;
          params.lon = lon;
        } else {
          params.q = `${city},${state},IN`;
        }

        const response = await axios.get(`${this.weatherAPI.baseURL}/weather`, {
          params,
          timeout: 10000
        });

        const data = this.formatWeatherData(response.data);
        this.setCache(cacheKey, data);
        return data;
      } catch (error) {
        console.error('❌ Weather API Error:', error.message);
        return this.getMockWeatherData(city, state);
      }
    });
  }

  /**
   * Fetch weather forecast (5 days)
   * @param {Object} location - { lat, lon } or { city, state }
   * @returns {Promise<Object>} Forecast data
   */
  async getWeatherForecast(location = {}) {
    const { lat, lon, city, state } = location;
    const cacheKey = `weather_forecast_${lat || city}_${lon || state}`;

    return this.getCachedOrFetch(cacheKey, async () => {
      try {
        let params = {
          appid: this.weatherAPI.apiKey,
          units: 'metric',
          cnt: 40 // 5 days * 8 (3-hour intervals)
        };

        if (lat && lon) {
          params.lat = lat;
          params.lon = lon;
        } else {
          params.q = `${city},${state},IN`;
        }

        const response = await axios.get(`${this.weatherAPI.baseURL}/forecast`, {
          params,
          timeout: 10000
        });

        const data = this.formatForecastData(response.data);
        this.setCache(cacheKey, data);
        return data;
      } catch (error) {
        console.error('❌ Weather Forecast API Error:', error.message);
        return this.getMockForecastData(city, state);
      }
    });
  }

  /**
   * Format current weather data
   */
  formatWeatherData(rawData) {
    return {
      location: rawData.name,
      temperature: {
        current: rawData.main.temp,
        feelsLike: rawData.main.feels_like,
        min: rawData.main.temp_min,
        max: rawData.main.temp_max,
        unit: '°C'
      },
      humidity: rawData.main.humidity,
      pressure: rawData.main.pressure,
      windSpeed: rawData.wind.speed,
      windDirection: rawData.wind.deg,
      condition: rawData.weather[0]?.main,
      description: rawData.weather[0]?.description,
      visibility: rawData.visibility,
      clouds: rawData.clouds?.all,
      rainfall: rawData.rain?.['1h'] || 0,
      sunrise: new Date(rawData.sys.sunrise * 1000).toLocaleTimeString('en-IN'),
      sunset: new Date(rawData.sys.sunset * 1000).toLocaleTimeString('en-IN'),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Format forecast data
   */
  formatForecastData(rawData) {
    const dailyForecasts = {};
    
    rawData.list.forEach(item => {
      const date = new Date(item.dt * 1000).toLocaleDateString('en-IN');
      if (!dailyForecasts[date]) {
        dailyForecasts[date] = {
          date,
          tempMin: item.main.temp_min,
          tempMax: item.main.temp_max,
          humidity: item.main.humidity,
          condition: item.weather[0]?.main,
          description: item.weather[0]?.description,
          rainfall: item.rain?.['3h'] || 0,
          windSpeed: item.wind.speed
        };
      } else {
        dailyForecasts[date].tempMin = Math.min(dailyForecasts[date].tempMin, item.main.temp_min);
        dailyForecasts[date].tempMax = Math.max(dailyForecasts[date].tempMax, item.main.temp_max);
        dailyForecasts[date].rainfall += item.rain?.['3h'] || 0;
      }
    });

    return {
      location: rawData.city.name,
      forecasts: Object.values(dailyForecasts).slice(0, 5),
      summary: this.generateWeatherSummary(Object.values(dailyForecasts)),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Generate weather summary for farming advice
   */
  generateWeatherSummary(forecasts) {
    const hasRain = forecasts.some(f => f.rainfall > 0 || f.condition === 'Rain');
    const avgTemp = forecasts.reduce((sum, f) => sum + (f.tempMin + f.tempMax) / 2, 0) / forecasts.length;
    const highHumidity = forecasts.some(f => f.humidity > 80);

    let summary = `Next ${forecasts.length} days: Average temp ${avgTemp.toFixed(1)}°C. `;
    if (hasRain) summary += 'Rain expected - plan irrigation accordingly. ';
    if (highHumidity) summary += 'High humidity - watch for fungal diseases. ';
    
    return summary;
  }

  /**
   * Mock weather data for testing/fallback
   */
  getMockWeatherData(city, state) {
    return {
      location: city || state || 'Your Location',
      temperature: { current: 28, feelsLike: 30, min: 24, max: 32, unit: '°C' },
      humidity: 65,
      pressure: 1013,
      windSpeed: 12,
      condition: 'Partly Cloudy',
      description: 'scattered clouds',
      visibility: 10000,
      rainfall: 0,
      sunrise: '06:15 AM',
      sunset: '06:30 PM',
      lastUpdated: new Date().toISOString(),
      isMockData: true
    };
  }

  /**
   * Mock forecast data for testing/fallback
   */
  getMockForecastData(city, state) {
    const forecasts = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      forecasts.push({
        date: date.toLocaleDateString('en-IN'),
        tempMin: 22 + Math.random() * 5,
        tempMax: 30 + Math.random() * 5,
        humidity: 60 + Math.random() * 20,
        condition: ['Clear', 'Clouds', 'Rain'][Math.floor(Math.random() * 3)],
        description: 'Weather forecast',
        rainfall: Math.random() > 0.7 ? Math.random() * 10 : 0,
        windSpeed: 8 + Math.random() * 10
      });
    }

    return {
      location: city || state || 'Your Location',
      forecasts,
      summary: 'Weather is expected to be mostly pleasant with occasional clouds.',
      lastUpdated: new Date().toISOString(),
      isMockData: true
    };
  }

  // ==================== GOVERNMENT SCHEMES APIs ====================

  /**
   * Fetch government schemes based on criteria
   * @param {Object} params - { state, category, farmerType }
   * @returns {Promise<Object>} Schemes data
   */
  async getGovernmentSchemes(params = {}) {
    const { state, category, farmerType } = params;
    const cacheKey = `schemes_${state}_${category}_${farmerType}`;

    return this.getCachedOrFetch(cacheKey, async () => {
      try {
        // Example: Using government API for schemes
        // Replace with your actual government schemes API
        const response = await axios.get(`${this.governmentSchemeAPI.baseURL}/schemes`, {
          params: {
            'api-key': this.governmentSchemeAPI.apiKey,
            format: 'json',
            state: state,
            category: category
          },
          timeout: 10000
        });

        const data = this.formatSchemesData(response.data, state);
        this.setCache(cacheKey, data);
        return data;
      } catch (error) {
        console.error('❌ Government Schemes API Error:', error.message);
        return this.getMockGovernmentSchemes(state, category);
      }
    });
  }

  /**
   * Format schemes data
   */
  formatSchemesData(rawData, state) {
    if (!rawData || !rawData.records) {
      return this.getMockGovernmentSchemes(state);
    }

    const schemes = rawData.records.map(record => ({
      name: record.scheme_name,
      description: record.description,
      benefits: record.benefits,
      eligibility: record.eligibility,
      applicationProcess: record.application_process,
      deadline: record.deadline,
      ministry: record.ministry,
      state: record.state || 'All India',
      category: record.category,
      subsidyAmount: record.subsidy_amount,
      link: record.application_link
    }));

    return {
      schemes,
      totalSchemes: schemes.length,
      summary: `Found ${schemes.length} government schemes for farmers`,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Mock government schemes for testing/fallback
   */
  getMockGovernmentSchemes(state, category) {
    const schemes = [
      {
        name: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
        description: 'Direct income support of ₹6,000 per year to farmer families',
        benefits: '₹6,000 per year in 3 equal installments',
        eligibility: 'All land-holding farmer families',
        applicationProcess: 'Apply online at pmkisan.gov.in or through CSC centers',
        ministry: 'Ministry of Agriculture',
        state: 'All India',
        category: 'Income Support',
        subsidyAmount: '₹6,000/year',
        link: 'https://pmkisan.gov.in'
      },
      {
        name: 'PM Fasal Bima Yojana (PMFBY)',
        description: 'Crop insurance scheme to protect farmers against crop loss',
        benefits: 'Insurance coverage for crop loss due to natural calamities',
        eligibility: 'All farmers growing notified crops',
        applicationProcess: 'Apply through bank, CSC or PMFBY portal',
        ministry: 'Ministry of Agriculture',
        state: 'All India',
        category: 'Crop Insurance',
        subsidyAmount: 'Premium subsidy up to 98%',
        link: 'https://pmfby.gov.in'
      },
      {
        name: 'Kisan Credit Card (KCC)',
        description: 'Provides farmers with affordable credit for agricultural needs',
        benefits: 'Credit at 4% interest rate (with timely repayment)',
        eligibility: 'All farmers, sharecroppers, tenant farmers',
        applicationProcess: 'Apply at any bank branch with land documents',
        ministry: 'Ministry of Finance',
        state: 'All India',
        category: 'Credit/Loan',
        subsidyAmount: 'Interest subvention of 3%',
        link: 'https://www.nabard.org'
      },
      {
        name: 'Soil Health Card Scheme',
        description: 'Provides soil health cards with crop-wise nutrient recommendations',
        benefits: 'Free soil testing and recommendations',
        eligibility: 'All farmers',
        applicationProcess: 'Contact nearest Krishi Vigyan Kendra or agriculture office',
        ministry: 'Ministry of Agriculture',
        state: 'All India',
        category: 'Soil Health',
        subsidyAmount: 'Free service',
        link: 'https://soilhealth.dac.gov.in'
      },
      {
        name: 'PM Krishi Sinchai Yojana (PMKSY)',
        description: 'Promotes efficient water use through micro-irrigation',
        benefits: 'Subsidy on drip and sprinkler irrigation systems',
        eligibility: 'All farmers',
        applicationProcess: 'Apply through state agriculture department',
        ministry: 'Ministry of Agriculture',
        state: state || 'All India',
        category: 'Irrigation',
        subsidyAmount: 'Up to 55-90% subsidy',
        link: 'https://pmksy.gov.in'
      },
      {
        name: 'National Mission on Sustainable Agriculture (NMSA)',
        description: 'Promotes sustainable farming practices',
        benefits: 'Training and financial support for sustainable practices',
        eligibility: 'All farmers adopting sustainable practices',
        applicationProcess: 'Contact district agriculture officer',
        ministry: 'Ministry of Agriculture',
        state: 'All India',
        category: 'Sustainable Farming',
        subsidyAmount: 'Varies by component',
        link: 'https://nmsa.dac.gov.in'
      }
    ];

    // Add state-specific schemes
    if (state) {
      schemes.push({
        name: `${state} Kisan Kalyan Yojana`,
        description: `State-specific welfare scheme for farmers in ${state}`,
        benefits: 'Additional financial support and subsidies',
        eligibility: `Farmers residing in ${state}`,
        applicationProcess: 'Apply through state agriculture portal',
        ministry: `${state} Agriculture Department`,
        state: state,
        category: 'State Scheme',
        subsidyAmount: 'Varies',
        link: '#'
      });
    }

    return {
      schemes,
      totalSchemes: schemes.length,
      summary: `Found ${schemes.length} government schemes for farmers${state ? ` in ${state}` : ''}`,
      lastUpdated: new Date().toISOString(),
      isMockData: true
    };
  }

  // ==================== COMBINED DATA FETCHING ====================

  /**
   * Fetch all relevant data for a user's location
   * @param {Object} userLocation - User's location data
   * @returns {Promise<Object>} Combined data from all APIs
   */
  async getAllDataForLocation(userLocation) {
    const { state, district, city, lat, lon } = userLocation;

    console.log(`📍 Fetching data for location: ${city || district}, ${state}`);

    try {
      // Fetch all data in parallel
      const [marketData, weatherData, forecastData, schemesData] = await Promise.all([
        this.getMarketPrices({ state, district }),
        this.getCurrentWeather({ lat, lon, city: city || district, state }),
        this.getWeatherForecast({ lat, lon, city: city || district, state }),
        this.getGovernmentSchemes({ state })
      ]);

      return {
        success: true,
        location: userLocation,
        marketPrices: marketData,
        currentWeather: weatherData,
        weatherForecast: forecastData,
        governmentSchemes: schemesData,
        fetchedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error fetching combined data:', error);
      return {
        success: false,
        error: error.message,
        location: userLocation
      };
    }
  }

  /**
   * Clear cache (useful for admin/refresh)
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ API cache cleared');
  }
}

// Export singleton instance
module.exports = new ExternalAPIService();

const externalAPIService = require('./externalAPI.service');

/**
 * Data Aggregator Service
 * Combines, refines, and formats data from multiple APIs for AI consumption
 */
class DataAggregatorService {
  constructor() {
    // Keywords that trigger different data fetches
    this.triggerKeywords = {
      marketPrice: ['price', 'rate', 'mandi', 'market', 'sell', 'cost', 'bhav', 'daam', 'बाजार', 'मंडी', 'दाम'],
      weather: ['weather', 'rain', 'temperature', 'mausam', 'barish', 'garmi', 'sardi', 'मौसम', 'बारिश', 'तापमान'],
      schemes: ['scheme', 'yojana', 'subsidy', 'government', 'sarkar', 'loan', 'insurance', 'bima', 'योजना', 'सरकार', 'सब्सिडी'],
      forecast: ['forecast', 'next week', 'coming days', 'agle din', 'agla hafta', 'prediction']
    };
  }

  /**
   * Analyze user message to determine what data to fetch
   * @param {string} message - User's message
   * @returns {Object} Data requirements
   */
  analyzeDataNeeds(message) {
    const lowerMessage = message.toLowerCase();
    const needs = {
      marketPrice: false,
      weather: false,
      forecast: false,
      schemes: false,
      commodity: null
    };

    // Check for market price triggers
    if (this.triggerKeywords.marketPrice.some(kw => lowerMessage.includes(kw))) {
      needs.marketPrice = true;
      needs.commodity = this.extractCommodity(message);
    }

    // Check for weather triggers
    if (this.triggerKeywords.weather.some(kw => lowerMessage.includes(kw))) {
      needs.weather = true;
    }

    // Check for forecast triggers
    if (this.triggerKeywords.forecast.some(kw => lowerMessage.includes(kw))) {
      needs.forecast = true;
      needs.weather = true; // Also include current weather
    }

    // Check for scheme triggers
    if (this.triggerKeywords.schemes.some(kw => lowerMessage.includes(kw))) {
      needs.schemes = true;
    }

    return needs;
  }

  /**
   * Extract commodity/crop name from message
   * @param {string} message - User's message
   * @returns {string|null} Commodity name
   */
  extractCommodity(message) {
    const commodities = [
      'wheat', 'rice', 'paddy', 'cotton', 'sugarcane', 'maize', 'corn',
      'tomato', 'onion', 'potato', 'soybean', 'groundnut', 'mustard',
      'chana', 'dal', 'arhar', 'moong', 'urad', 'masoor',
      'banana', 'mango', 'apple', 'orange', 'grapes',
      'गेहूं', 'चावल', 'धान', 'कपास', 'गन्ना', 'मक्का',
      'टमाटर', 'प्याज', 'आलू', 'सोयाबीन'
    ];

    const lowerMessage = message.toLowerCase();
    return commodities.find(c => lowerMessage.includes(c.toLowerCase())) || null;
  }

  /**
   * Fetch and aggregate data based on user needs
   * @param {string} message - User's message
   * @param {Object} userLocation - User's location
   * @returns {Promise<Object>} Aggregated data
   */
  async fetchRelevantData(message, userLocation) {
    const needs = this.analyzeDataNeeds(message);
    const data = {
      fetched: false,
      marketPrices: null,
      weather: null,
      forecast: null,
      schemes: null,
      context: ''
    };

    // If no specific needs detected, return empty
    if (!needs.marketPrice && !needs.weather && !needs.forecast && !needs.schemes) {
      return data;
    }

    data.fetched = true;
    const fetchPromises = [];

    // Fetch market prices if needed
    if (needs.marketPrice) {
      fetchPromises.push(
        externalAPIService.getMarketPrices({
          state: userLocation.state,
          district: userLocation.district,
          commodity: needs.commodity
        }).then(result => { data.marketPrices = result; })
      );
    }

    // Fetch weather if needed
    if (needs.weather) {
      fetchPromises.push(
        externalAPIService.getCurrentWeather({
          city: userLocation.city || userLocation.district,
          state: userLocation.state,
          lat: userLocation.lat,
          lon: userLocation.lon
        }).then(result => { data.weather = result; })
      );
    }

    // Fetch forecast if needed
    if (needs.forecast) {
      fetchPromises.push(
        externalAPIService.getWeatherForecast({
          city: userLocation.city || userLocation.district,
          state: userLocation.state,
          lat: userLocation.lat,
          lon: userLocation.lon
        }).then(result => { data.forecast = result; })
      );
    }

    // Fetch schemes if needed
    if (needs.schemes) {
      fetchPromises.push(
        externalAPIService.getGovernmentSchemes({
          state: userLocation.state
        }).then(result => { data.schemes = result; })
      );
    }

    // Wait for all fetches to complete
    await Promise.all(fetchPromises);

    // Generate context string for AI
    data.context = this.generateContextString(data, userLocation);

    return data;
  }

  /**
   * Generate a formatted context string for the AI
   * @param {Object} data - Aggregated data
   * @param {Object} userLocation - User's location
   * @returns {string} Formatted context
   */
  generateContextString(data, userLocation) {
    let context = `\n\n--- REAL-TIME DATA FOR ${userLocation.district || userLocation.city}, ${userLocation.state} ---\n`;

    // Add market prices context
    if (data.marketPrices && data.marketPrices.prices.length > 0) {
      context += '\n📊 CURRENT MARKET PRICES:\n';
      data.marketPrices.prices.slice(0, 5).forEach(price => {
        context += `• ${price.commodity} (${price.variety}): ₹${price.modalPrice}/Quintal (Min: ₹${price.minPrice}, Max: ₹${price.maxPrice})\n`;
      });
      if (data.marketPrices.isMockData) {
        context += '(Note: These are approximate/sample prices. For exact rates, visit your local mandi.)\n';
      }
    }

    // Add weather context
    if (data.weather) {
      context += '\n🌤️ CURRENT WEATHER:\n';
      context += `• Location: ${data.weather.location}\n`;
      context += `• Temperature: ${data.weather.temperature.current}°C (Feels like ${data.weather.temperature.feelsLike}°C)\n`;
      context += `• Condition: ${data.weather.condition} - ${data.weather.description}\n`;
      context += `• Humidity: ${data.weather.humidity}%\n`;
      context += `• Wind: ${data.weather.windSpeed} km/h\n`;
      if (data.weather.rainfall > 0) {
        context += `• Rainfall: ${data.weather.rainfall}mm in last hour\n`;
      }
    }

    // Add forecast context
    if (data.forecast && data.forecast.forecasts) {
      context += '\n📅 5-DAY WEATHER FORECAST:\n';
      data.forecast.forecasts.forEach(day => {
        context += `• ${day.date}: ${day.condition}, ${day.tempMin.toFixed(0)}°C - ${day.tempMax.toFixed(0)}°C`;
        if (day.rainfall > 0) context += `, Rain: ${day.rainfall.toFixed(1)}mm`;
        context += '\n';
      });
      context += `Summary: ${data.forecast.summary}\n`;
    }

    // Add schemes context
    if (data.schemes && data.schemes.schemes.length > 0) {
      context += '\n🏛️ RELEVANT GOVERNMENT SCHEMES:\n';
      data.schemes.schemes.slice(0, 4).forEach(scheme => {
        context += `\n• ${scheme.name}\n`;
        context += `  - Benefits: ${scheme.benefits}\n`;
        context += `  - Eligibility: ${scheme.eligibility}\n`;
        context += `  - How to Apply: ${scheme.applicationProcess}\n`;
      });
    }

    context += '\n--- END OF REAL-TIME DATA ---\n';
    context += 'Use this data to provide accurate, location-specific advice to the farmer.\n';

    return context;
  }

  /**
   * Refine AI response with actual data
   * @param {string} aiResponse - Original AI response
   * @param {Object} data - Fetched data
   * @returns {string} Refined response
   */
  refineResponse(aiResponse, data) {
    // The AI should already incorporate the context, but we can add data cards
    let refined = aiResponse;

    // Add quick data summary if available
    if (data.fetched) {
      // The AI response should already include the data
      // This method can be extended for additional post-processing
    }

    return refined;
  }

  /**
   * Get comprehensive data summary for dashboard
   * @param {Object} userLocation - User's location
   * @returns {Promise<Object>} Complete data summary
   */
  async getDashboardData(userLocation) {
    return externalAPIService.getAllDataForLocation(userLocation);
  }

  /**
   * Get quick market update
   * @param {Object} userLocation - User's location
   * @param {string} commodity - Specific commodity (optional)
   * @returns {Promise<Object>} Market data
   */
  async getQuickMarketUpdate(userLocation, commodity = null) {
    return externalAPIService.getMarketPrices({
      state: userLocation.state,
      district: userLocation.district,
      commodity
    });
  }

  /**
   * Get farming advice based on current conditions
   * @param {Object} userLocation - User's location
   * @returns {Promise<Object>} Advice data
   */
  async getFarmingAdvice(userLocation) {
    const [weather, forecast] = await Promise.all([
      externalAPIService.getCurrentWeather({
        city: userLocation.city || userLocation.district,
        state: userLocation.state
      }),
      externalAPIService.getWeatherForecast({
        city: userLocation.city || userLocation.district,
        state: userLocation.state
      })
    ]);

    const advice = [];

    // Weather-based advice
    if (weather.humidity > 80) {
      advice.push({
        type: 'warning',
        category: 'Disease Prevention',
        message: 'High humidity detected. Monitor crops for fungal diseases.'
      });
    }

    if (weather.temperature.current > 35) {
      advice.push({
        type: 'warning',
        category: 'Heat Stress',
        message: 'High temperature. Ensure adequate irrigation and consider mulching.'
      });
    }

    // Forecast-based advice
    const rainExpected = forecast.forecasts?.some(f => f.rainfall > 0 || f.condition === 'Rain');
    if (rainExpected) {
      advice.push({
        type: 'info',
        category: 'Irrigation',
        message: 'Rain expected in coming days. Adjust irrigation schedule accordingly.'
      });
      advice.push({
        type: 'warning',
        category: 'Harvesting',
        message: 'If crops are ready for harvest, consider harvesting before rain.'
      });
    }

    return {
      currentConditions: weather,
      forecast: forecast,
      advice,
      generatedAt: new Date().toISOString()
    };
  }
}

// Export singleton instance
module.exports = new DataAggregatorService();

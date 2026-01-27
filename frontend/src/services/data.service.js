import api from './api';

/**
 * Data Service - Handles external API data (market prices, weather, schemes)
 */

/**
 * Get dashboard data for user's location
 * @returns {Promise} Dashboard data with all information
 */
export const getDashboardData = async () => {
  try {
    const response = await api.get('/data/dashboard');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch dashboard data' };
  }
};

/**
 * Get market prices
 * @param {Object} params - { commodity, state, district }
 * @returns {Promise} Market price data
 */
export const getMarketPrices = async (params = {}) => {
  try {
    const response = await api.get('/data/market-prices', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch market prices' };
  }
};

/**
 * Get current weather
 * @param {Object} params - { city, state, lat, lon }
 * @returns {Promise} Weather data
 */
export const getCurrentWeather = async (params = {}) => {
  try {
    const response = await api.get('/data/weather', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch weather data' };
  }
};

/**
 * Get weather forecast
 * @param {Object} params - { city, state, lat, lon }
 * @returns {Promise} Forecast data
 */
export const getWeatherForecast = async (params = {}) => {
  try {
    const response = await api.get('/data/weather/forecast', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch forecast data' };
  }
};

/**
 * Get government schemes
 * @param {Object} params - { state, category }
 * @returns {Promise} Schemes data
 */
export const getGovernmentSchemes = async (params = {}) => {
  try {
    const response = await api.get('/data/schemes', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch government schemes' };
  }
};

/**
 * Get farming advice based on weather
 * @returns {Promise} Farming advice data
 */
export const getFarmingAdvice = async () => {
  try {
    const response = await api.get('/data/farming-advice');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch farming advice' };
  }
};

/**
 * Update user location
 * @param {Object} location - { state, district, city, village, pincode, lat, lon }
 * @returns {Promise} Updated location
 */
export const updateUserLocation = async (location) => {
  try {
    const response = await api.put('/auth/location', location);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update location' };
  }
};

/**
 * Update farming profile
 * @param {Object} profile - { landSize, primaryCrops, irrigationType, soilType }
 * @returns {Promise} Updated farming profile
 */
export const updateFarmingProfile = async (profile) => {
  try {
    const response = await api.put('/auth/farming-profile', profile);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update farming profile' };
  }
};

export default {
  getDashboardData,
  getMarketPrices,
  getCurrentWeather,
  getWeatherForecast,
  getGovernmentSchemes,
  getFarmingAdvice,
  updateUserLocation,
  updateFarmingProfile
};

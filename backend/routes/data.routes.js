const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const externalAPIService = require('../services/externalAPI.service');
const dataAggregatorService = require('../services/dataAggregator.service');

/**
 * @desc    Get all data for user's location (dashboard)
 * @route   GET /api/data/dashboard
 * @access  Private
 */
router.get('/dashboard', protect, async (req, res) => {
  try {
    const userLocation = req.user.location || {};
    
    if (!userLocation.state) {
      return res.status(400).json({
        success: false,
        message: 'Please set your location in profile to get personalized data'
      });
    }

    const dashboardData = await dataAggregatorService.getDashboardData({
      state: userLocation.state,
      district: userLocation.district,
      city: userLocation.city,
      lat: userLocation.coordinates?.lat,
      lon: userLocation.coordinates?.lon
    });

    res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
});

/**
 * @desc    Get market prices
 * @route   GET /api/data/market-prices
 * @access  Private
 */
router.get('/market-prices', protect, async (req, res) => {
  try {
    const { commodity, state, district } = req.query;
    const userLocation = req.user.location || {};

    const marketData = await externalAPIService.getMarketPrices({
      state: state || userLocation.state,
      district: district || userLocation.district,
      commodity: commodity
    });

    res.status(200).json({
      success: true,
      data: marketData
    });
  } catch (error) {
    console.error('Market prices error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching market prices'
    });
  }
});

/**
 * @desc    Get current weather
 * @route   GET /api/data/weather
 * @access  Private
 */
router.get('/weather', protect, async (req, res) => {
  try {
    const { city, state, lat, lon } = req.query;
    const userLocation = req.user.location || {};

    const weatherData = await externalAPIService.getCurrentWeather({
      city: city || userLocation.city || userLocation.district,
      state: state || userLocation.state,
      lat: lat || userLocation.coordinates?.lat,
      lon: lon || userLocation.coordinates?.lon
    });

    res.status(200).json({
      success: true,
      data: weatherData
    });
  } catch (error) {
    console.error('Weather data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching weather data'
    });
  }
});

/**
 * @desc    Get weather forecast
 * @route   GET /api/data/weather/forecast
 * @access  Private
 */
router.get('/weather/forecast', protect, async (req, res) => {
  try {
    const { city, state, lat, lon } = req.query;
    const userLocation = req.user.location || {};

    const forecastData = await externalAPIService.getWeatherForecast({
      city: city || userLocation.city || userLocation.district,
      state: state || userLocation.state,
      lat: lat || userLocation.coordinates?.lat,
      lon: lon || userLocation.coordinates?.lon
    });

    res.status(200).json({
      success: true,
      data: forecastData
    });
  } catch (error) {
    console.error('Forecast data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching forecast data'
    });
  }
});

/**
 * @desc    Get government schemes
 * @route   GET /api/data/schemes
 * @access  Private
 */
router.get('/schemes', protect, async (req, res) => {
  try {
    const { state, category } = req.query;
    const userLocation = req.user.location || {};

    const schemesData = await externalAPIService.getGovernmentSchemes({
      state: state || userLocation.state,
      category: category
    });

    res.status(200).json({
      success: true,
      data: schemesData
    });
  } catch (error) {
    console.error('Schemes data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching government schemes'
    });
  }
});

/**
 * @desc    Get farming advice based on weather
 * @route   GET /api/data/farming-advice
 * @access  Private
 */
router.get('/farming-advice', protect, async (req, res) => {
  try {
    const userLocation = req.user.location || {};
    
    if (!userLocation.state) {
      return res.status(400).json({
        success: false,
        message: 'Please set your location in profile to get farming advice'
      });
    }

    const adviceData = await dataAggregatorService.getFarmingAdvice({
      state: userLocation.state,
      district: userLocation.district,
      city: userLocation.city,
      lat: userLocation.coordinates?.lat,
      lon: userLocation.coordinates?.lon
    });

    res.status(200).json({
      success: true,
      data: adviceData
    });
  } catch (error) {
    console.error('Farming advice error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching farming advice'
    });
  }
});

/**
 * @desc    Clear API cache (admin only)
 * @route   POST /api/data/clear-cache
 * @access  Private (should be admin only in production)
 */
router.post('/clear-cache', protect, async (req, res) => {
  try {
    externalAPIService.clearCache();
    res.status(200).json({
      success: true,
      message: 'API cache cleared successfully'
    });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing cache'
    });
  }
});

module.exports = router;

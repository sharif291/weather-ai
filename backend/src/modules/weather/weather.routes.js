import express from 'express';
import { verifyAuth } from '../../core/auth.js';
import {
  getCurrentWeather,
  getForecastWeather,
  getHourlyWeather,
  getDailyWeather,
  getWeatherGeo,
  getApiUsage,
  getSystemTelemetry,
  getIpLookup,
  geocodeCity,
  updateApiKey,
  getApiKeyEndpoint
} from './weather.controller.js';

const router = express.Router();

// Enforce Firebase ID authentication context for all weather queries
router.use(verifyAuth);

router.get('/current', getCurrentWeather);
router.get('/forecast', getForecastWeather);
router.get('/hourly', getHourlyWeather);
router.get('/daily', getDailyWeather);
router.get('/weather-geo', getWeatherGeo);
router.get('/geocode', geocodeCity);
router.get('/usage', getApiUsage);
router.get('/ip-lookup', getIpLookup);
router.get('/api-key', getApiKeyEndpoint);
router.put('/api-key', updateApiKey);

// System telemetry console endpoints
router.get('/telemetry', getSystemTelemetry);

export default router;

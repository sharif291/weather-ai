import express from 'express';
import {
  getCurrentWeather,
  getForecastWeather,
  getHourlyWeather,
  getDailyWeather,
  getWeatherGeo,
  getApiUsage,
  getSystemTelemetry,
  getIpLookup,
  geocodeCity
} from './weather.controller.js';

const router = express.Router();

router.get('/current', getCurrentWeather);
router.get('/forecast', getForecastWeather);
router.get('/hourly', getHourlyWeather);
router.get('/daily', getDailyWeather);
router.get('/weather-geo', getWeatherGeo);
router.get('/geocode', geocodeCity);
router.get('/usage', getApiUsage);
router.get('/ip-lookup', getIpLookup);

// System telemetry console endpoints
router.get('/telemetry', getSystemTelemetry);

export default router;

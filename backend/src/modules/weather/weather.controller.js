import { weatherService } from './weather.service.js';
import { cacheService } from '../../core/redis.js';
import { queueService } from '../../core/queue.js';
import { prisma } from '../../core/db.js';

const getApiKey = (req) => {
  const key = req.user?.weatherApiKey;
  if (!key) {
    throw new Error('KEY_REQUIRED');
  }
  return key;
};

const handleControllerError = (err, res, defaultMsg) => {
  if (err.message === 'KEY_REQUIRED') {
    return res.status(403).json({ 
      error: 'API_KEY_REQUIRED', 
      message: 'WeatherAI API Key is required to access weather telemetry.' 
    });
  }
  if (err.response?.status === 401) {
    return res.status(401).json({
      error: 'API_KEY_INVALID',
      message: 'Your configured WeatherAI API Key is invalid or has been revoked. Please set up a new valid key.'
    });
  }
  return res.status(err.response?.status || 500).json({ 
    error: err.message, 
    details: err.response?.data || defaultMsg 
  });
};

export const getCurrentWeather = async (req, res) => {
  const { q } = req.query;
  try {
    const apiKey = getApiKey(req);
    const data = await weatherService.getCurrent(q, apiKey);
    return res.json(data);
  } catch (err) {
    return handleControllerError(err, res, 'Failed to fetch current weather data');
  }
};

export const getForecastWeather = async (req, res) => {
  const { q } = req.query;
  try {
    const apiKey = getApiKey(req);
    const data = await weatherService.getForecast(q, apiKey);
    return res.json(data);
  } catch (err) {
    return handleControllerError(err, res, 'Failed to fetch forecast weather data');
  }
};

export const getHourlyWeather = async (req, res) => {
  const { q } = req.query;
  try {
    const apiKey = getApiKey(req);
    const data = await weatherService.getHourly(q, apiKey);
    return res.json(data);
  } catch (err) {
    return handleControllerError(err, res, 'Failed to fetch hourly weather data');
  }
};

export const getDailyWeather = async (req, res) => {
  const { q, date } = req.query;
  try {
    const apiKey = getApiKey(req);
    const data = await weatherService.getDaily(q, date, apiKey);
    return res.json(data);
  } catch (err) {
    return handleControllerError(err, res, 'Failed to fetch historical weather data');
  }
};

export const getWeatherGeo = async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: 'Missing required parameters: lat and lon coordinates are required' });
  }
  try {
    const apiKey = getApiKey(req);
    const data = await weatherService.getWeatherGeo(parseFloat(lat), parseFloat(lon), apiKey);
    return res.json(data);
  } catch (err) {
    return handleControllerError(err, res, 'Failed to fetch coordinate weather data');
  }
};

export const getApiUsage = async (req, res) => {
  try {
    const apiKey = getApiKey(req);
    const data = await weatherService.getUsage(apiKey);
    return res.json(data);
  } catch (err) {
    return handleControllerError(err, res, 'Failed to retrieve API key usage metrics');
  }
};

export const getSystemTelemetry = async (req, res) => {
  try {
    const cacheLogs = cacheService.getTelemetryLogs();
    const queueLogs = queueService.getTelemetryLogs();
    return res.json({
      cache: cacheLogs,
      queue: queueLogs
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to compile system diagnostics telemetry', details: err.message });
  }
};

export const getIpLookup = async (req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'auto';
  const normalizedIp = clientIp.split(',')[0].trim();
  
  try {
    const apiKey = getApiKey(req);
    const data = await weatherService.getIpLookup(normalizedIp === '::1' || normalizedIp === '127.0.0.1' ? 'auto' : normalizedIp, apiKey);
    return res.json(data);
  } catch (err) {
    return handleControllerError(err, res, 'Failed to retrieve IP location lookup details');
  }
};

export const geocodeCity = async (req, res) => {
  const { city } = req.query;
  if (!city) {
    return res.status(400).json({ error: 'Missing required query parameter: city' });
  }

  try {
    const apiKey = getApiKey(req);
    const cacheKey = `weather:geo:city:${city.trim().toLowerCase()}`;
    const data = await weatherService.fetchWithProxy('/v1/weather-geo', { city }, cacheKey, apiKey);

    const lat = data.lat || data.geo?.lat;
    const lon = data.lon || data.geo?.lon;
    const resolvedName = data.geo?.city || data.location?.name || '';

    const queryLower = city.trim().toLowerCase();
    const resolvedLower = resolvedName.trim().toLowerCase();
    const isMatch = resolvedLower.includes(queryLower) || queryLower.includes(resolvedLower);

    if (lat === undefined || lon === undefined || !isMatch) {
      return res.status(404).json({ error: `Cannot find location: '${city}'. Please check the spelling or enter coordinates manually.` });
    }

    return res.json({
      city: resolvedName || city,
      latitude: parseFloat(lat),
      longitude: parseFloat(lon),
      region: data.geo?.region || data.location?.region || '',
      country: data.geo?.country || data.location?.country || '',
      timezone: data.geo?.timezone || data.location?.tz_id || 'GMT'
    });
  } catch (err) {
    if (err.message === 'KEY_REQUIRED') {
      return res.status(403).json({ 
        error: 'API_KEY_REQUIRED', 
        message: 'WeatherAI API Key is required to geocode city locations.' 
      });
    }
    if (err.response?.status === 401) {
      return res.status(401).json({
        error: 'API_KEY_INVALID',
        message: 'Your configured WeatherAI API Key is invalid or has been revoked. Please set up a new valid key.'
      });
    }
    console.error('[Geocoding] Resolution failure:', err.message);
    return res.status(404).json({ error: `Cannot find location: '${city}'` });
  }
};

export const updateApiKey = async (req, res) => {
  const { weatherApiKey } = req.body;
  if (!weatherApiKey) {
    return res.status(400).json({ error: 'Missing required body parameter: weatherApiKey' });
  }

  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { weatherApiKey }
    });
    return res.json({ success: true, message: 'WeatherAI API key configured successfully.' });
  } catch (err) {
    console.error('[WeatherController] Update API key database error:', err.message);
    return res.status(500).json({ error: 'Database error: Failed to update API key', details: err.message });
  }
};

export const getApiKeyEndpoint = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });
    return res.json({ weatherApiKey: user?.weatherApiKey || null });
  } catch (err) {
    console.error('[WeatherController] Get API key database error:', err.message);
    return res.status(500).json({ error: 'Database error: Failed to fetch API key', details: err.message });
  }
};

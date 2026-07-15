import { weatherService } from './weather.service.js';
import { cacheService } from '../../core/redis.js';
import { queueService } from '../../core/queue.js';

export const getCurrentWeather = async (req, res) => {
  const { q, aqi } = req.query;
  try {
    const data = await weatherService.getCurrent(q, aqi);
    return res.json(data);
  } catch (err) {
    return res.status(err.response?.status || 500).json({ 
      error: err.message, 
      details: err.response?.data || 'Failed to fetch current weather data' 
    });
  }
};

export const getForecastWeather = async (req, res) => {
  const { q } = req.query;
  try {
    const data = await weatherService.getForecast(q);
    return res.json(data);
  } catch (err) {
    return res.status(err.response?.status || 500).json({ 
      error: err.message, 
      details: err.response?.data || 'Failed to fetch forecast weather data' 
    });
  }
};

export const getHourlyWeather = async (req, res) => {
  const { q } = req.query;
  try {
    const data = await weatherService.getHourly(q);
    return res.json(data);
  } catch (err) {
    return res.status(err.response?.status || 500).json({ 
      error: err.message, 
      details: err.response?.data || 'Failed to fetch hourly weather data' 
    });
  }
};

export const getDailyWeather = async (req, res) => {
  const { q, date } = req.query;
  try {
    const data = await weatherService.getDaily(q, date);
    return res.json(data);
  } catch (err) {
    return res.status(err.response?.status || 500).json({ 
      error: err.message, 
      details: err.response?.data || 'Failed to fetch historical weather data' 
    });
  }
};

export const getWeatherGeo = async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: 'Missing required parameters: lat and lon coordinates are required' });
  }
  try {
    const data = await weatherService.getWeatherGeo(parseFloat(lat), parseFloat(lon));
    return res.json(data);
  } catch (err) {
    return res.status(err.response?.status || 500).json({ 
      error: err.message, 
      details: err.response?.data || 'Failed to fetch coordinate weather data' 
    });
  }
};

export const getApiUsage = async (req, res) => {
  try {
    const data = await weatherService.getUsage();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve API key usage metrics', details: err.message });
  }
};

// Custom diagnostic endpoint to provide real-time caching and SQS broker logs
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
  // Extract client's IP from proxy/express request headers or fallback to auto
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'auto';
  // Parse forward chains (e.g. "1.2.3.4, 5.6.7.8" -> "1.2.3.4")
  const normalizedIp = clientIp.split(',')[0].trim();
  
  try {
    const data = await weatherService.getIpLookup(normalizedIp === '::1' || normalizedIp === '127.0.0.1' ? 'auto' : normalizedIp);
    return res.json(data);
  } catch (err) {
    return res.status(err.response?.status || 500).json({ 
      error: 'Failed to retrieve IP location lookup details', 
      details: err.message 
    });
  }
};

export const geocodeCity = async (req, res) => {
  const { city } = req.query;
  if (!city) {
    return res.status(400).json({ error: 'Missing required query parameter: city' });
  }

  try {
    const cacheKey = `weather:geo:city:${city.trim().toLowerCase()}`;
    const data = await weatherService.fetchWithProxy('/v1/weather-geo', { city }, cacheKey);

    const lat = data.lat || data.geo?.lat;
    const lon = data.lon || data.geo?.lon;
    const resolvedName = data.geo?.city || data.location?.name || '';

    // Check if the response city name matches the input city name (case-insensitive fuzzy check)
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
    console.error('[Geocoding] Resolution failure:', err.message);
    return res.status(404).json({ error: `Cannot find location: '${city}'` });
  }
};

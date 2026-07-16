import axios from 'axios';
import { config } from '../../core/config.js';
import { apiThrottler } from '../../core/limiter.js';
import { cacheService } from '../../core/redis.js';

const parseQuery = (query) => {
  const q = (typeof query === 'string' ? query : '').trim().toLowerCase();
  
  // Check if it's coordinates formatted as "lat,lon" or "lat, lon"
  const coordRegex = /^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/;
  const match = q.match(coordRegex);
  if (match) {
    return {
      isCoords: true,
      lat: parseFloat(match[1]),
      lon: parseFloat(match[3])
    };
  }

  return {
    isCoords: false,
    city: query // Preserve original casing for city names
  };
};

const getWindDirectionString = (degree) => {
  if (degree === undefined || degree === null) return 'E';
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((degree % 360) / 22.5)) % 16;
  return directions[index];
};

const getWmoCondition = (code) => {
  const mapping = {
    0: { text: 'Sunny / Clear', icon: '113' },
    1: { text: 'Mainly Clear', icon: '113' },
    2: { text: 'Partly Cloudy', icon: '116' },
    3: { text: 'Overcast', icon: '122' },
    45: { text: 'Foggy', icon: '248' },
    48: { text: 'Depositing Rime Fog', icon: '248' },
    51: { text: 'Light Drizzle', icon: '266' },
    53: { text: 'Moderate Drizzle', icon: '266' },
    55: { text: 'Dense Drizzle', icon: '266' },
    61: { text: 'Slight Rain', icon: '296' },
    63: { text: 'Moderate Rain', icon: '302' },
    65: { text: 'Heavy Rain', icon: '308' },
    71: { text: 'Slight Snowfall', icon: '326' },
    73: { text: 'Moderate Snowfall', icon: '332' },
    75: { text: 'Heavy Snowfall', icon: '338' },
    80: { text: 'Slight Rain Showers', icon: '353' },
    81: { text: 'Moderate Rain Showers', icon: '356' },
    82: { text: 'Violent Rain Showers', icon: '359' },
    95: { text: 'Thunderstorm', icon: '389' },
    96: { text: 'Thunderstorm with Hail', icon: '389' },
    99: { text: 'Heavy Thunderstorm', icon: '389' },
  };
  return mapping[code] || { text: 'Clear', icon: '113' };
};

const getRainChanceFromWmo = (code) => {
  const c = parseInt(code);
  if (c === 0 || c === 1) return 0;
  if (c === 2 || c === 3) return 10;
  if (c === 51 || c === 53 || c === 55) return 40;
  if (c === 61 || c === 63 || c === 65) return 80;
  if (c === 95 || c === 96 || c === 99) return 100;
  return 0; // Default fallback
};

class WeatherService {
  constructor() {
    this.client = axios.create({
      baseURL: config.weatherAiBaseUrl,
      timeout: 5000,
    });
  }

  async fetchWithProxy(endpoint, queryParams, cacheKey, apiKey) {
    // 1. Check cache first
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) {
      console.log(`[WeatherService-cached] Outbound HTTP Request: ${endpoint} for params:`, queryParams);
      return cachedData;
    }

    const key = apiKey || config.weatherAiApiKey;
    if (!key || key === 'your_weather_ai_api_key_here') {
      throw new Error('KEY_REQUIRED');
    }

    // 2. Queue & Throttle HTTP requests to protect 5 req/sec rate limit
    try {
      const data = await apiThrottler.add(async () => {
        console.log(`[WeatherService] Outbound HTTP Request: ${endpoint} for params:`, queryParams);
        const res = await this.client.get(endpoint, {
          params: queryParams,
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json'
          }
        });
        return res.data;
      });

      // 3. Save to Cache
      await cacheService.set(cacheKey, data, 900);
      return data;
    } catch (err) {
      const status = err.response?.status;
      console.error(`[WeatherService] HTTP Request failed (${status || 'Network Error'}):`, err.message);
      throw err;
    }
  }

  async getCurrent(query, apiKey) {
    const q = query || 'Nairobi';
    const parsed = parseQuery(q);
    
    let data;
    if (parsed.isCoords) {
      const { lat, lon } = parsed;
      const cacheKey = `weather:current:lat:${lat}:lon:${lon}`;
      data = await this.fetchWithProxy('/v1/current', { lat, lon }, cacheKey, apiKey);
    } else {
      const { city } = parsed;
      const cacheKey = `weather:geo:city:${city}`;
      data = await this.fetchWithProxy('/v1/weather-geo', { city }, cacheKey, apiKey);
    }

    const cond = getWmoCondition(data.current?.weathercode);
    return {
      location: {
        name: data.geo?.city || (parsed.isCoords ? 'Selected Location' : q),
        region: data.geo?.region || '',
        country: data.geo?.country || '',
        lat: data.lat || data.geo?.lat || parsed.lat,
        lon: data.lon || data.geo?.lon || parsed.lon,
      },
      current: {
        temp_c: data.current?.temperature,
        condition: data.current?.condition || cond,
        wind_kph: data.current?.windspeed,
        wind_dir: data.current?.winddirection !== undefined ? getWindDirectionString(data.current.winddirection) : 'E'
      }
    };
  }

  async getForecast(query, apiKey) {
    const q = query || 'Nairobi';
    const parsed = parseQuery(q);
    
    let data;
    if (parsed.isCoords) {
      const { lat, lon } = parsed;
      const cacheKey = `weather:forecast:lat:${lat}:lon:${lon}`;
      data = await this.fetchWithProxy('/v1/forecast', { lat, lon }, cacheKey, apiKey);
    } else {
      const { city } = parsed;
      const cacheKey = `weather:geo:city:${city}`;
      data = await this.fetchWithProxy('/v1/weather-geo', { city }, cacheKey, apiKey);
    }

    const rawDays = data.daily || (data.forecast?.forecastday ? data.forecast.forecastday.map(item => ({
      date: item.date,
      temp_max: item.day.maxtemp_c,
      temp_min: item.day.mintemp_c,
      precipitation: item.day.totalprecip_mm,
      weathercode: 0,
      condition: item.day.condition
    })) : []);

    const forecastday = rawDays.map(day => {
      const cond = day.condition || getWmoCondition(day.weathercode);
      return {
        date: day.date,
        day: {
          maxtemp_c: day.temp_max,
          mintemp_c: day.temp_min,
          avgtemp_c: day.temp_avg !== undefined ? day.temp_avg : Math.round((((day.temp_max || 20) + (day.temp_min || 12)) / 2) * 10) / 10,
          totalprecip_mm: day.precipitation,
          condition: cond
        }
      };
    });

    return {
      location: {
        name: data.geo?.city || (parsed.isCoords ? 'Selected Coordinate' : q),
        region: data.geo?.region || '',
        country: data.geo?.country || '',
      },
      forecast: {
        forecastday
      }
    };
  }

  async getHourly(query, apiKey) {
    const q = query || 'Nairobi';
    const parsed = parseQuery(q);
    
    let data;
    if (parsed.isCoords) {
      const { lat, lon } = parsed;
      const cacheKey = `weather:hourly:lat:${lat}:lon:${lon}`;
      data = await this.fetchWithProxy('/v1/hourly', { lat, lon }, cacheKey, apiKey);
    } else {
      const { city } = parsed;
      const cacheKey = `weather:geo:city:${city}`;
      data = await this.fetchWithProxy('/v1/weather-geo', { city }, cacheKey, apiKey);
    }

    const rawHourly = data.hourly || [];
    const hourly = rawHourly.map(h => {
      const cond = getWmoCondition(h.weathercode);
      const timeStr = h.time ? (h.time.includes('T') ? h.time.split('T')[1] : h.time) : '00:00';
      return {
        time: timeStr,
        temp_c: h.temp,
        precip_mm: h.precipitation,
        chance_of_rain: getRainChanceFromWmo(h.weathercode),
        condition: cond
      };
    });

    return {
      location: {
        name: data.geo?.city || (parsed.isCoords ? 'Selected Coordinate' : q),
        region: data.geo?.region || '',
        country: data.geo?.country || '',
      },
      hourly
    };
  }

  async getDaily(query, date, apiKey) {
    const q = query || 'Nairobi';
    const d = date || new Date().toISOString().split('T')[0];
    const parsed = parseQuery(q);
    
    let data;
    if (parsed.isCoords) {
      const { lat, lon } = parsed;
      const cacheKey = `weather:daily:lat:${lat}:lon:${lon}:date:${d}`;
      data = await this.fetchWithProxy('/v1/daily', { lat, lon, date: d }, cacheKey, apiKey);
    } else {
      const { city } = parsed;
      const cacheKey = `weather:geo:city:${city}:date:${d}`;
      data = await this.fetchWithProxy('/v1/weather-geo', { city, date: d }, cacheKey, apiKey);
    }

    const dayItem = data.daily && data.daily.length > 0 ? data.daily[0] : (data.day || data);
    const cond = dayItem.condition || getWmoCondition(dayItem.weathercode);

    return {
      location: {
        name: data.geo?.city || (parsed.isCoords ? 'Selected Coordinate' : q),
        region: data.geo?.region || '',
        country: data.geo?.country || '',
      },
      daily: {
        date: dayItem.date || d,
        avgtemp_c: dayItem.temp_avg !== undefined ? dayItem.temp_avg : Math.round((((dayItem.temp_max || 20) + (dayItem.temp_min || 12)) / 2) * 10) / 10,
        maxtemp_c: dayItem.temp_max,
        mintemp_c: dayItem.temp_min,
        totalprecip_mm: dayItem.precipitation,
        condition: cond
      }
    };
  }

  async getWeatherGeo(lat, lon, apiKey) {
    const cacheKey = `weather:geo:lat:${lat}:lon:${lon}`;
    const data = await this.fetchWithProxy(
      '/v1/weather-geo',
      { lat, lon },
      cacheKey,
      apiKey
    );

    const cond = getWmoCondition(data.current?.weathercode);
    return {
      location: {
        name: data.geo?.city || 'Selected Coordinate',
        region: data.geo?.region || '',
        country: data.geo?.country || '',
        lat: data.lat || data.geo?.lat || lat,
        lon: data.lon || data.geo?.lon || lon
      },
      current: {
        temp_c: data.current?.temperature,
        condition: data.current?.condition || cond,
        wind_kph: data.current?.windspeed,
        wind_dir: data.current?.winddirection !== undefined ? getWindDirectionString(data.current.winddirection) : 'E'
      }
    };
  }

  async getUsage(apiKey) {
    const key = apiKey || config.weatherAiApiKey;
    if (!key || key === 'your_weather_ai_api_key_here') {
      throw new Error('KEY_REQUIRED');
    }

    try {
      const res = await this.client.get('/v1/usage', {
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json'
        }
      });
      return res.data;
    } catch (err) {
      console.error('[WeatherService] Failed to fetch usage limits:', err.message);
      throw err;
    }
  }

  async getIpLookup(ip, apiKey) {
    const cacheKey = `weather:ip:${ip}`;
    return this.fetchWithProxy(
      '/v1/ip-lookup',
      { ip },
      cacheKey,
      apiKey
    );
  }
}

export const weatherService = new WeatherService();
export default weatherService;

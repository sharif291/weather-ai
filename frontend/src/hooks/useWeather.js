import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api.js';

export const useWeather = (searchQuery) => {
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [hourly, setHourly] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWeatherData = useCallback(async (query) => {
    if (!query) return;
    
    setLoading(true);
    setError(null);
    try {
      // Perform concurrent fetches for current, forecast, and hourly data
      const [currentRes, forecastRes, hourlyRes] = await Promise.all([
        apiService.getCurrent(query, 'yes'),
        apiService.getForecast(query),
        apiService.getHourly(query)
      ]);

      setCurrentWeather(currentRes);
      setForecast(forecastRes);
      setHourly(hourlyRes);
    } catch (err) {
      console.error('[useWeather Hook] Fetch failed:', err.message);
      setError(err.response?.data?.error || err.message || 'Failed to fetch weather diagnostics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeatherData(searchQuery);
  }, [searchQuery, fetchWeatherData]);

  return {
    currentWeather,
    forecast,
    hourly,
    loading,
    error,
    refetch: () => fetchWeatherData(searchQuery)
  };
};

export default useWeather;

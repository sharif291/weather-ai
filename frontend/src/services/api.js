import axios from 'axios';
import { firebaseService } from './firebase.js';

// Base API URL configuration
const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_URL,
  timeout: 8000,
});

// Request interceptor attaching Firebase Auth ID Token automatically
api.interceptors.request.use(async (config) => {
  const user = firebaseService.auth.currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch (err) {
      console.warn('[API Client] Failed to obtain Firebase ID Token:', err.message);
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// ----------------------------------------------------
// MAIN API METHODS (STRICT MODE — CLOUD/BACKEND ONLY)
// ----------------------------------------------------
export const apiService = {
  // Weather Routes
  getCurrent: async (q) => {
    const res = await api.get('/api/weather/current', { params: { q } });
    return res.data;
  },

  getForecast: async (q) => {
    const res = await api.get('/api/weather/forecast', { params: { q } });
    return res.data;
  },

  getHourly: async (q) => {
    const res = await api.get('/api/weather/hourly', { params: { q } });
    return res.data;
  },

  getDaily: async (q, date) => {
    const res = await api.get('/api/weather/daily', { params: { q, date } });
    return res.data;
  },

  getWeatherGeo: async (lat, lon) => {
    const res = await api.get('/api/weather/weather-geo', { params: { lat, lon } });
    return res.data;
  },

  geocodeCity: async (city) => {
    const res = await api.get('/api/weather/geocode', { params: { city } });
    return res.data;
  },

  getUsage: async () => {
    const res = await api.get('/api/weather/usage');
    return res.data;
  },

  getTelemetry: async () => {
    const res = await api.get('/api/weather/telemetry');
    return res.data;
  },

  // Farms Database Routes
  getFarms: async () => {
    const res = await api.get('/api/farms');
    return res.data;
  },

  createFarm: async (farmData) => {
    const res = await api.post('/api/farms', farmData);
    return res.data;
  },

  deleteFarm: async (id) => {
    const res = await api.delete(`/api/farms/${id}`);
    return res.data;
  },

  updateFarm: async (id, farmData) => {
    const res = await api.put(`/api/farms/${id}`, farmData);
    return res.data;
  },

  // S3 Presigned Upload & Direct Upload
  getUploadToken: async (fileName, contentType) => {
    const res = await api.get('/api/farms/presigned-url', { params: { fileName, contentType } });
    return res.data;
  },

  uploadFileDirect: async (uploadUrl, file, isMock) => {
    // Direct HTTP PUT to AWS S3
    const config = {
      headers: {
        'Content-Type': file.type
      }
    };
    await axios.put(uploadUrl, file, config);
    console.log('[API Client] Direct file upload payload transmitted successfully.');
    return true;
  },

  // Asynchronous Notification Queue Routes
  getAlertLogs: async () => {
    const res = await api.get('/api/notifications');
    return res.data;
  },

  triggerAlertSimulation: async (farmId, alertType, customMessage) => {
    const res = await api.post('/api/notifications/trigger-alert', { farmId, alertType, customMessage });
    return res.data;
  },

  markAlertAsRead: async (id) => {
    if (!id) return;
    const res = await api.patch(`/api/notifications/${id}/read`);
    return res.data;
  },

  markAllAlertsAsRead: async () => {
    const res = await api.post('/api/notifications/read-all');
    return res.data;
  },

  getIpLookup: async () => {
    const res = await api.get('/api/weather/ip-lookup');
    return res.data;
  }
};

export default apiService;

import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api.js';

export const useFarms = (user) => {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFarms = useCallback(async () => {
    if (!user) {
      setFarms([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getFarms();
      setFarms(data);
    } catch (err) {
      console.error('[useFarms Hook] Fetch failed:', err.message);
      setError(err.response?.data?.error || err.message || 'Failed to fetch farms.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addFarm = async (farmData) => {
    setError(null);
    try {
      const newFarm = await apiService.createFarm(farmData);
      setFarms(prev => [newFarm, ...prev]);
      return newFarm;
    } catch (err) {
      console.error('[useFarms Hook] Create farm failed:', err.message);
      throw new Error(err.response?.data?.error || err.message || 'Failed to create farm.');
    }
  };

  const removeFarm = async (id) => {
    setError(null);
    try {
      await apiService.deleteFarm(id);
      setFarms(prev => prev.filter(f => f.id !== id));
      return true;
    } catch (err) {
      console.error('[useFarms Hook] Delete farm failed:', err.message);
      throw new Error(err.response?.data?.error || err.message || 'Failed to delete farm.');
    }
  };

  const updateFarm = async (id, farmData) => {
    setError(null);
    try {
      const updatedFarm = await apiService.updateFarm(id, farmData);
      setFarms(prev => prev.map(f => f.id === id ? updatedFarm : f));
      return updatedFarm;
    } catch (err) {
      console.error('[useFarms Hook] Update farm failed:', err.message);
      throw new Error(err.response?.data?.error || err.message || 'Failed to update farm.');
    }
  };

  useEffect(() => {
    fetchFarms();
  }, [user, fetchFarms]);

  return {
    farms,
    loading,
    error,
    refetch: fetchFarms,
    addFarm,
    removeFarm,
    updateFarm
  };
};

export default useFarms;

import React, { useState, useEffect } from 'react';
import { 
  FiX, FiKey, FiCpu, FiActivity, FiRefreshCw, 
  FiDatabase, FiTerminal 
} from 'react-icons/fi';
import { apiService } from '../services/api.js';

export const SettingsDrawer = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [usage, setUsage] = useState(null);
  const [telemetry, setTelemetry] = useState({ cache: [], queue: [] });
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [pollingActive, setPollingActive] = useState(false);

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('weather_ai_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, [isOpen]);

  // Fetch Usage & Telemetry data
  const fetchData = async () => {
    if (!isOpen) return;
    setLoadingUsage(true);
    try {
      const [usageRes, telemetryRes] = await Promise.all([
        apiService.getUsage(),
        apiService.getTelemetry()
      ]);
      setUsage(usageRes);
      setTelemetry(telemetryRes);
    } catch (err) {
      console.warn('[SettingsDrawer] Failed to fetch usage/telemetry diagnostics:', err.message);
    } finally {
      setLoadingUsage(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isOpen]);

  // Poll telemetry diagnostics every 3 seconds when open
  useEffect(() => {
    if (!isOpen) return;
    setPollingActive(true);
    const interval = setInterval(async () => {
      try {
        const telemetryRes = await apiService.getTelemetry();
        setTelemetry(telemetryRes);
      } catch (err) {
        // Safe fail
      }
    }, 3000);

    return () => {
      clearInterval(interval);
      setPollingActive(false);
    };
  }, [isOpen]);

  const handleSaveKey = (e) => {
    e.preventDefault();
    localStorage.setItem('weather_ai_api_key', apiKey);
    alert('API Key updated successfully! Reloading cache data...');
    fetchData();
  };

  const handleClearKey = () => {
    localStorage.removeItem('weather_ai_api_key');
    setApiKey('');
    alert('API Key cleared. Reverting to Mock Caching mode.');
    fetchData();
  };

  if (!isOpen) return null;

  const used = usage?.requests?.used || 0;
  const limit = usage?.requests?.limit || 50000;
  const percent = Math.min(100, Math.round((used / limit) * 100));

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-96 bg-slate-950/95 border-l border-slate-900 backdrop-blur-md shadow-2xl flex flex-col h-full animate-slide-in">
      {/* Drawer Header */}
      <div className="p-5 border-b border-slate-900 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-emerald-400">
          <FiCpu className="w-5 h-5" />
          <h2 className="text-base font-bold text-white">Diagnostics & Telemetry</h2>
        </div>
        <button 
          onClick={onClose}
          className="text-slate-500 hover:text-slate-200 p-1 rounded-md hover:bg-white/5 transition-all"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 terminal-scrollbar">
        {/* 1. API KEY CONFIG */}
        <div className="glass-panel p-4 rounded-xl border-slate-900">
          <div className="flex items-center space-x-2 text-slate-300 mb-3">
            <FiKey className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Credential Keys</h3>
          </div>
          <form onSubmit={handleSaveKey} className="space-y-3">
            <input 
              type="password"
              placeholder="Paste WeatherAI API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg glass-input text-slate-300 font-mono"
            />
            <div className="flex items-center gap-2">
              <button 
                type="submit"
                className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs cursor-pointer transition-all"
              >
                Save key
              </button>
              {apiKey && (
                <button 
                  type="button"
                  onClick={handleClearKey}
                  className="px-3 py-2 rounded-lg border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/20 text-xs font-semibold cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>

        {/* 2. RADIAL API USAGE DIAL */}
        <div className="glass-panel p-4 rounded-xl border-slate-900 space-y-3">
          <div className="flex items-center justify-between text-slate-300">
            <div className="flex items-center space-x-2">
              <FiActivity className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Quota Registry</h3>
            </div>
            <button onClick={fetchData} className={`text-slate-500 hover:text-emerald-400 transition-all ${loadingUsage ? 'animate-spin' : ''}`}>
              <FiRefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-400">Plan:</span>
              <span className="text-white font-bold">{usage?.plan || 'Loading...'}</span>
            </div>

            {/* Quota slider visual */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Used: {used} req</span>
                <span>Limit: {limit} req</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                  style={{ width: `${percent}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. DIAGNOSTICS TERMINAL FEED */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <div className="flex items-center space-x-2 text-xs uppercase font-bold tracking-wider text-slate-300">
              <FiTerminal className="w-4 h-4 text-emerald-400" />
              <span>Realtime Caching Log</span>
            </div>
            {pollingActive && (
              <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
            )}
          </div>
          
          <div className="w-full h-64 rounded-xl bg-slate-950 border border-slate-900 font-mono text-[9px] p-3 text-slate-300 overflow-y-auto space-y-2 terminal-scrollbar select-text">
            {telemetry.cache.length > 0 ? (
              telemetry.cache.map((log) => (
                <div key={log.id} className="leading-normal">
                  <span className="text-slate-600 mr-1.5">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span className={`font-bold mr-1.5 ${
                    log.type === 'HIT' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {log.type}
                  </span>
                  <span className="text-slate-400 mr-1.5">source:{log.source}</span>
                  <span className="text-slate-500">elapsed:{log.elapsedMs}ms</span>
                  <div className="text-slate-600 break-all text-[8px] pl-16">➔ {log.key}</div>
                </div>
              ))
            ) : (
              <p className="text-slate-600 text-center py-10">Waiting for cache queries...</p>
            )}
          </div>
        </div>

        {/* 4. SQS QUEUE TELEMETRY */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-xs uppercase font-bold tracking-wider text-slate-300">
            <FiDatabase className="w-4 h-4 text-emerald-400" />
            <span>SQS Event Log</span>
          </div>

          <div className="w-full h-44 rounded-xl bg-slate-950 border border-slate-900 font-mono text-[9px] p-3 text-slate-300 overflow-y-auto space-y-2 terminal-scrollbar select-text">
            {telemetry.queue.length > 0 ? (
              telemetry.queue.map((log) => (
                <div key={log.id} className="leading-normal">
                  <span className="text-slate-600 mr-1.5">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span className="text-indigo-400 font-bold mr-1.5">{log.action}</span>
                  <span className="text-slate-500 mr-1.5">via:{log.source}</span>
                  <span className="text-emerald-400 font-bold">{log.status}</span>
                  <div className="text-slate-600 text-[8px] pl-16">➔ {log.payload.message || 'Queued payload task'}</div>
                </div>
              ))
            ) : (
              <p className="text-slate-600 text-center py-10">Waiting for message queue tasks...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsDrawer;

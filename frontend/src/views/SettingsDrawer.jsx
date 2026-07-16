import { useEffect, useState } from 'react';
import {
  FiActivity,
  FiKey,
  FiRefreshCw, FiSettings,
  FiUser,
  FiX
} from 'react-icons/fi';
import { apiService } from '../services/api.js';

export const SettingsDrawer = ({ isOpen, onClose, user, farmsCount, onKeyUpdate }) => {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'key' | 'usage'
  const [apiKey, setApiKey] = useState('');
  const [usage, setUsage] = useState(null);
  const [loadingUsage, setLoadingUsage] = useState(false);

  // Load API key from database on open
  useEffect(() => {
    const fetchKey = async () => {
      if (!isOpen) return;
      try {
        const res = await apiService.getApiKey();
        if (res && res.weatherApiKey) {
          setApiKey(res.weatherApiKey);
        }
      } catch (err) {
        console.warn('[SettingsDrawer] Failed to load key:', err.message);
      }
    };
    fetchKey();
  }, [isOpen]);

  // Fetch Usage data
  const fetchUsageData = async () => {
    if (!isOpen) return;
    setLoadingUsage(true);
    try {
      const usageRes = await apiService.getUsage();
      setUsage(usageRes);
    } catch (err) {
      console.warn('[SettingsDrawer] Failed to fetch usage diagnostics:', err.message);
    } finally {
      setLoadingUsage(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsageData();
    }
  }, [isOpen]);

  const handleSaveKey = async (e) => {
    e.preventDefault();
    try {
      await apiService.updateApiKey(apiKey);
      window.location.reload();
      if (onKeyUpdate) {
        onKeyUpdate(apiKey);
      }
      fetchUsageData();
    } catch (err) {
      alert(`Failed to save key: ${err.message}`);
    }
  };

  const handleClearKey = async () => {
    try {
      await apiService.updateApiKey('');
      setApiKey('');
      alert('API Key cleared.');
      if (onKeyUpdate) {
        onKeyUpdate('');
      }
      fetchUsageData();
    } catch (err) {
      alert(`Failed to clear key: ${err.message}`);
    }
  };

  if (!isOpen) return null;

  const used = usage?.used || 0;
  const limit = usage?.limit || 1000;
  const remaining = usage?.remaining || 0;
  const percent = Math.min(100, Math.round((used / limit) * 100));

  // Format account creation date
  const joinedDate = user?.metadata?.creationTime 
    ? new Date(user.metadata.creationTime).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Unknown';

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-96 bg-slate-950/95 border-l border-slate-900 backdrop-blur-md shadow-2xl flex flex-col h-full animate-slide-in select-none">
      {/* Drawer Header */}
      <div className="p-5 border-b border-slate-900 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-emerald-400">
          <FiSettings className="w-5 h-5" />
          <h2 className="text-base font-bold text-white">Settings</h2>
        </div>
        <button 
          onClick={onClose}
          className="text-slate-500 hover:text-slate-200 p-1 rounded-md hover:bg-white/5 transition-all cursor-pointer"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Tabs */}
      <div className="px-5 pt-3 flex border-b border-slate-900/60 space-x-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'profile'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab('key')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'key'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          API Key
        </button>
        <button
          onClick={() => setActiveTab('usage')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'usage'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Usage History
        </button>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 terminal-scrollbar">
        {activeTab === 'profile' && (
          <div className="space-y-4 animate-fade-in">
            <div className="glass-panel p-5 rounded-2xl border-slate-900 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center text-lg">
                  <FiUser />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{user?.displayName || 'User Profile'}</h4>
                  <p className="text-[10px] text-slate-500">{user?.email}</p>
                </div>
              </div>

              <div className="border-t border-slate-900/60 pt-4 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Account Joined:</span>
                  <span className="text-slate-300 font-medium">{joinedDate}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Registered Farms:</span>
                  <span className="text-emerald-400 font-bold">{farmsCount}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'key' && (
          <div className="space-y-4 animate-fade-in">
            <div className="glass-panel p-5 rounded-2xl border-slate-900 space-y-4">
              <div className="flex items-center space-x-2 text-slate-300">
                <FiKey className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Configure API Credentials</h3>
              </div>
              
              <form onSubmit={handleSaveKey} className="space-y-3">
                <input 
                  type="password"
                  placeholder="Paste your WeatherAI API Key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-slate-300 font-mono"
                />
                <div className="flex items-center gap-2">
                  <button 
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs cursor-pointer transition-all"
                  >
                    Save key
                  </button>
                  {apiKey && (
                    <button 
                      type="button"
                      onClick={handleClearKey}
                      className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/20 text-xs font-semibold cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'usage' && (
          <div className="space-y-4 animate-fade-in">
            <div className="glass-panel p-5 rounded-2xl border-slate-900 space-y-4">
              <div className="flex items-center justify-between text-slate-300">
                <div className="flex items-center space-x-2">
                  <FiActivity className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">Quota Registry</h3>
                </div>
                <button 
                  onClick={fetchUsageData} 
                  className={`text-slate-500 hover:text-emerald-400 transition-all ${loadingUsage ? 'animate-spin' : ''}`}
                >
                  <FiRefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3 border-t border-slate-900/60 pt-4">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Plan Quota Level:</span>
                  <span className="text-white font-bold capitalize">{usage?.plan || 'Loading...'}</span>
                </div>

                <div className="space-y-2">
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
                  <div className="text-[10px] text-slate-400 text-right font-semibold">
                    {remaining} requests remaining
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsDrawer;

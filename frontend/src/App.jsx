import { useEffect, useState } from 'react';
import {
  FiActivity,
  FiAlertCircle,
  FiBell,
  FiCompass,
  FiMenu,
  FiSettings,
  FiX
} from 'react-icons/fi';
import NotificationToast from './components/NotificationToast.jsx';
import { useFarms } from './hooks/useFarms.js';
import { useRealtimeAlerts } from './hooks/useRealtimeAlerts.js';
import { useWeather } from './hooks/useWeather.js';
import { apiService } from './services/api.js';
import { firebaseService } from './services/firebase.js';
import AgriTimeline from './views/AgriTimeline.jsx';
import FarmPlanner from './views/FarmPlanner.jsx';
import SettingsDrawer from './views/SettingsDrawer.jsx';

import AddFarmModal from './components/AddFarmModal.jsx';
import AuthScreen from './components/AuthScreen.jsx';
import EditFarmModal from './components/EditFarmModal.jsx';
import NotificationDrawer from './components/NotificationDrawer.jsx';
import Sidebar from './components/Sidebar.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const [activeTab, setActiveTab] = useState('timeline'); // 'planner' | 'timeline'
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [activeWeatherQuery, setActiveWeatherQuery] = useState('');

  // Drawer/Modal States
  const [isAddFarmOpen, setIsAddFarmOpen] = useState(false);
  const [isEditFarmOpen, setIsEditFarmOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [weatherApiKey, setWeatherApiKey] = useState(null);

  // Custom Data Hooks
  const { farms, addFarm, removeFarm, updateFarm, refetch: refetchFarms } = useFarms(user);
  const { currentWeather, forecast, hourly, error: weatherError, loading: weatherLoading } = useWeather(activeWeatherQuery);
  const { notifications, globalAlert, newToast, clearToast, clearGlobalAlert } = useRealtimeAlerts(user);

  // Invalidate configuration if the database key gets revoked (WeatherAI returns 401 API_KEY_INVALID)
  useEffect(() => {
    if (weatherError === 'API_KEY_INVALID') {
      setWeatherApiKey('');
      setAuthError('Your configured WeatherAI API Key is invalid or has been revoked. Please set up a new valid key.');
    }
  }, [weatherError]);

  // Sync Auth State and Fetch Location
  useEffect(() => {
    const unsubscribe = firebaseService.auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      
      if (currentUser) {
        refetchFarms();
        try {
          const loc = await apiService.getIpLookup();
          if (loc && loc.geo && loc.geo.lat !== undefined && loc.geo.lon !== undefined) {
            const coordStr = `${loc.geo.lat},${loc.geo.lon}`;
            setActiveWeatherQuery(coordStr);
          } else {
            setActiveWeatherQuery('');
          }
        } catch (err) {
          console.warn('[IP Location] IP Lookup failed. Clearing query:', err.message);
          setActiveWeatherQuery('');
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync user's WeatherAI API Key config from database
  useEffect(() => {
    const fetchApiKey = async () => {
      if (user) {
        try {
          const res = await apiService.getApiKey();
          setWeatherApiKey(res.weatherApiKey || '');
        } catch (err) {
          console.warn('[API Key Check] Failed to check user key:', err.message);
          setWeatherApiKey('');
        }
      } else {
        setWeatherApiKey(null);
      }
    };
    fetchApiKey();
  }, [user]);

  // Update weather query when selected farm changes
  useEffect(() => {
    if (selectedFarm) {
      const geoQuery = `${selectedFarm.latitude},${selectedFarm.longitude}`;
      setActiveWeatherQuery(geoQuery);
    }
  }, [selectedFarm]);

  // Handle first farm load
  useEffect(() => {
    if (farms.length > 0 && !selectedFarm) {
      setSelectedFarm(farms[0]);
    }
  }, [farms, selectedFarm]);

  // Auth Action Handlers
  const handleLogout = async () => {
    await firebaseService.auth.logout();
    setSelectedFarm(null);
  };

  // Delete Farm
  const handleDeleteFarm = async (id) => {
    if (window.confirm('Are you sure you want to decommission this farm? All database records will be erased.')) {
      try {
        await removeFarm(id);
        setSelectedFarm(null);
      } catch (err) {
        alert(err.message);
      }
    }
  };

  // Edit Farm Modal Triggers
  const handleEditFarmClick = (farm) => {
    setSelectedFarm(farm);
    setIsEditFarmOpen(true);
  };

  // Mark alerts as read
  const handleMarkAsRead = async (notification) => {
    try {
      await firebaseService.db.markNotificationAsRead(user.uid, notification.id);
      if (notification.alertLogId) {
        await apiService.markAlertAsRead(notification.alertLogId);
      }
    } catch (err) {
      console.error('[Notification UI] Failed to mark alert as read:', err.message);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await firebaseService.db.markAllNotificationsAsRead(user.uid);
      await apiService.markAllAlertsAsRead();
    } catch (err) {
      console.error('[Notification UI] Failed to mark all alerts as read:', err.message);
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <FiActivity className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-slate-400 text-sm font-semibold tracking-wider font-mono">Initializing Authentication Suite...</p>
      </div>
    );
  }

  // Load login/register cards if unauthenticated
  if (!user) {
    return <AuthScreen />;
  }

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
      {/* Real-time Alerts Layer */}
      <NotificationToast 
        toast={newToast}
        globalAlert={globalAlert}
        onCloseToast={clearToast}
        onCloseGlobal={clearGlobalAlert}
      />

      {/* Mobile Top Navigation Header */}
      <header className="md:hidden w-full bg-slate-950/80 backdrop-blur border-b border-slate-900 px-5 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-2 text-emerald-500">
          <span className="text-xl">🌱</span>
          <span className="text-sm font-black text-white tracking-tight">TerraClimate</span>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setIsNotificationOpen(true)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 transition-all cursor-pointer relative"
          >
            <FiBell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white ring-2 ring-slate-950 animate-pulse">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => {
              setIsSettingsOpen(true);
              setIsMobileMenuOpen(false);
            }}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 transition-all cursor-pointer"
            title="Diagnostics"
          >
            <FiSettings className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 transition-all cursor-pointer"
          >
            {isMobileMenuOpen ? <FiX className="w-4 h-4" /> : <FiMenu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30 md:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <div className={`
        fixed inset-y-0 left-0 w-72 bg-slate-950 border-r border-slate-900 flex flex-col h-screen z-40 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:w-80 md:flex-shrink-0 md:z-20
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <Sidebar 
          user={user}
          farms={farms}
          selectedFarm={selectedFarm}
          setSelectedFarm={setSelectedFarm}
          setActiveWeatherQuery={setActiveWeatherQuery}
          onOpenAddFarm={() => {
            setIsAddFarmOpen(true);
            setIsMobileMenuOpen(false);
          }}
          onOpenSettings={() => {
            setIsSettingsOpen(true);
            setIsMobileMenuOpen(false);
          }}
          onOpenNotifications={() => {
            setIsNotificationOpen(true);
            setIsMobileMenuOpen(false);
          }}
          notificationsCount={unreadNotificationsCount}
          onLogout={handleLogout}
        />
      </div>

      {/* Main Content Pane */}
      <main className="relative flex-1 overflow-y-auto p-2 md:p-8 space-y-6">
        {weatherApiKey === "" && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-30 flex items-center justify-center p-6">
            <div className="max-w-md w-full glass-panel p-8 rounded-2xl border-slate-900 text-center space-y-6 animate-slide-in">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto text-2xl">
                🔑
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">WeatherAI API Key Required</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Welcome to TerraClimate! To unlock precision climate telemetry, hourly analytics, and automated advisory scans, please configure your personal WeatherAI API Key.
                </p>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                const keyInput = e.target.elements.apiKeyInput.value.trim();
                if (!keyInput) return;
                setAuthError(null);
                try {
                  await apiService.updateApiKey(keyInput);
                  setWeatherApiKey(keyInput);
                  window.location.reload();
                } catch (err) {
                  setAuthError(err.response?.data?.message || err.message);
                }
              }} className="space-y-4 text-left">
                {authError && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] leading-relaxed font-semibold">
                    ⚠️ {authError}
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Your API Key</label>
                  <input 
                    name="apiKeyInput"
                    type="password"
                    placeholder="Enter key (e.g. wai_live_...)"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs glass-input text-slate-300 font-mono"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black transition-all cursor-pointer"
                >
                  Configure Account
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-4">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                activeTab === 'timeline'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Hourly & Trends
            </button>
            <button
              onClick={() => setActiveTab('planner')}
              className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                activeTab === 'planner'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Agro-Planner
            </button>
            
          </div>
        </div>

        {weatherLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <FiActivity className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-xs text-slate-500 font-mono">Running precision weather analysis query...</p>
          </div>
        ) : weatherError ? (
          <div className="p-5 bg-rose-500/5 border border-rose-500/20 rounded-2xl flex items-center space-x-3 text-rose-300">
            <FiAlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <p className="text-xs font-medium">{weatherError}</p>
          </div>
        ) : !activeWeatherQuery ? (
          <div className="p-8 text-center glass-panel rounded-2xl max-w-lg mx-auto mt-10">
            <FiCompass className="w-12 h-12 text-slate-600 mb-3 mx-auto animate-pulse" />
            <h3 className="text-lg font-bold text-slate-300">No Location Selected</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              We couldn't automatically detect your IP coordinates. Please use the search bar on the left to enter a city name or register a farm to view localized weather alerts.
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'planner' ? (
              <FarmPlanner 
                farm={selectedFarm} 
                weather={{ currentWeather, forecast, hourly }}
                onDeleteFarm={handleDeleteFarm}
                onEditFarm={handleEditFarmClick}
              />
            ) : (
              <AgriTimeline 
                farm={selectedFarm || { name: 'Active Search' }}
                weather={{ hourly, forecast, currentWeather }}
              />
            )}
          </>
        )}
      </main>

      {/* Register Farm Modal */}
      <AddFarmModal 
        isOpen={isAddFarmOpen}
        onClose={() => setIsAddFarmOpen(false)}
        addFarm={addFarm}
        setSelectedFarm={setSelectedFarm}
      />

      {/* Edit Farm Modal */}
      <EditFarmModal 
        isOpen={isEditFarmOpen}
        onClose={() => setIsEditFarmOpen(false)}
        farm={selectedFarm}
        updateFarm={updateFarm}
        setSelectedFarm={setSelectedFarm}
      />

      {/* Settings Drawer */}
      <SettingsDrawer 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        farmsCount={farms.length}
        onKeyUpdate={setWeatherApiKey}
      />

      {/* Notifications Drawer */}
      <NotificationDrawer 
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllAsRead}
        onMarkAsRead={handleMarkAsRead}
      />
    </div>
  );
}

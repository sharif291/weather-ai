import { useEffect, useState } from 'react';
import {
  FiActivity,
  FiAlertCircle,
  FiBell, FiCheck, FiCheckCircle,
  FiCompass,
  FiLock,
  FiLogOut,
  FiMail,
  FiMapPin,
  FiMenu,
  FiPlus,
  FiSearch,
  FiUser,
  FiX
} from 'react-icons/fi';
import ImageUploader from './components/ImageUploader.jsx';
import NotificationToast from './components/NotificationToast.jsx';
import { useFarms } from './hooks/useFarms.js';
import { useRealtimeAlerts } from './hooks/useRealtimeAlerts.js';
import { useWeather } from './hooks/useWeather.js';
import { apiService } from './services/api.js';
import { firebaseService } from './services/firebase.js';
import AgriTimeline from './views/AgriTimeline.jsx';
import FarmPlanner from './views/FarmPlanner.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState(null);

  const [activeTab, setActiveTab] = useState('planner'); // 'planner' | 'timeline'
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [activeWeatherQuery, setActiveWeatherQuery] = useState('');

  // New Farm Modal State
  const [isAddFarmOpen, setIsAddFarmOpen] = useState(false);
  const [newFarmName, setNewFarmName] = useState('');
  const [newFarmCity, setNewFarmCity] = useState('');
  const [isResolvingCity, setIsResolvingCity] = useState(false);
  const [newGeocodeError, setNewGeocodeError] = useState(null);
  const [newFarmLat, setNewFarmLat] = useState('');
  const [newFarmLon, setNewFarmLon] = useState('');
  const [newFarmRegion, setNewFarmRegion] = useState('');
  const [newFarmCountry, setNewFarmCountry] = useState('');
  const [newFarmTimezone, setNewFarmTimezone] = useState('');
  const [newFarmCrop, setNewFarmCrop] = useState('Tea');
  const [newFarmImageUrl, setNewFarmImageUrl] = useState(null);
  const [newFarmWind, setNewFarmWind] = useState(20);
  const [newFarmRain, setNewFarmRain] = useState(10);
  const [newFarmEnabled, setNewFarmEnabled] = useState(true);
  const [newFarmNotifyEmail, setNewFarmNotifyEmail] = useState(false);
  const [newFarmEmailAddress, setNewFarmEmailAddress] = useState('');
  const [newFarmNotifySms, setNewFarmNotifySms] = useState(false);
  const [newFarmPhoneNumber, setNewFarmPhoneNumber] = useState('');
  const [newFarmNotifyDiscord, setNewFarmNotifyDiscord] = useState(false);
  const [newFarmDiscordWebhook, setNewFarmDiscordWebhook] = useState('');
  const [newFarmNotifyInApp, setNewFarmNotifyInApp] = useState(true);
  const [addingFarm, setAddingFarm] = useState(false);

  // Edit Farm Modal State
  const [isEditFarmOpen, setIsEditFarmOpen] = useState(false);
  const [editFarmId, setEditFarmId] = useState(null);
  const [editFarmName, setEditFarmName] = useState('');
  const [editFarmCity, setEditFarmCity] = useState('');
  const [isResolvingEditCity, setIsResolvingEditCity] = useState(false);
  const [editGeocodeError, setEditGeocodeError] = useState(null);
  const [editFarmLat, setEditFarmLat] = useState('');
  const [editFarmLon, setEditFarmLon] = useState('');
  const [editFarmRegion, setEditFarmRegion] = useState('');
  const [editFarmCountry, setEditFarmCountry] = useState('');
  const [editFarmTimezone, setEditFarmTimezone] = useState('');
  const [editFarmCrop, setEditFarmCrop] = useState('Tea');
  const [editFarmImageUrl, setEditFarmImageUrl] = useState(null);
  const [editFarmWind, setEditFarmWind] = useState(20);
  const [editFarmRain, setEditFarmRain] = useState(10);
  const [editFarmEnabled, setEditFarmEnabled] = useState(true);
  const [editFarmNotifyEmail, setEditFarmNotifyEmail] = useState(false);
  const [editFarmEmailAddress, setEditFarmEmailAddress] = useState('');
  const [editFarmNotifySms, setEditFarmNotifySms] = useState(false);
  const [editFarmPhoneNumber, setEditFarmPhoneNumber] = useState('');
  const [editFarmNotifyDiscord, setEditFarmNotifyDiscord] = useState(false);
  const [editFarmDiscordWebhook, setEditFarmDiscordWebhook] = useState('');
  const [editFarmNotifyInApp, setEditFarmNotifyInApp] = useState(true);
  const [updatingFarm, setUpdatingFarm] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Custom Data Hooks
  const { farms, addFarm, removeFarm, updateFarm, refetch: refetchFarms } = useFarms(user);
  const { currentWeather, forecast, hourly, loading: weatherLoading, error: weatherError } = useWeather(activeWeatherQuery);
  const { notifications, globalAlert, newToast, clearToast, clearGlobalAlert } = useRealtimeAlerts(user);

  // Sync Auth State and Fetch Location
  useEffect(() => {
    const unsubscribe = firebaseService.auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      
      if (currentUser) {
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveWeatherQuery(searchQuery.trim());
      setSelectedFarm(null);
      setIsMobileMenuOpen(false);
    }
  };

  // Auth Action Handlers
  const handleSignIn = async (e) => {
    e.preventDefault();
    setAuthError(null);
    try {
      await firebaseService.auth.signIn(authEmail, authPassword);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const cred = await firebaseService.auth.signUp(authEmail, authPassword);
      // Wait a moment for server verification synchronization middleware
      setTimeout(() => refetchFarms(), 1000);
    } catch (err) {
      setAuthError(err.message);
    }
  };


  const handleLogout = async () => {
    await firebaseService.auth.logout();
    setSelectedFarm(null);
  };

  // Add Farm Submit
  const handleAddFarmSubmit = async (e) => {
    e.preventDefault();
    if (!newFarmName || !newFarmLat || !newFarmLon) return;

    setAddingFarm(true);
    try {
      const newFarmObj = await addFarm({
        name: newFarmName,
        latitude: parseFloat(newFarmLat),
        longitude: parseFloat(newFarmLon),
        cropType: newFarmCrop,
        imageUrl: newFarmImageUrl,
        windThreshold: parseFloat(newFarmWind),
        rainThreshold: parseFloat(newFarmRain),
        enabled: newFarmEnabled,
        notifyEmail: newFarmNotifyEmail,
        emailAddress: newFarmNotifyEmail ? newFarmEmailAddress : null,
        notifySms: newFarmNotifySms,
        phoneNumber: newFarmNotifySms ? newFarmPhoneNumber : null,
        notifyDiscord: newFarmNotifyDiscord,
        discordWebhook: newFarmNotifyDiscord ? newFarmDiscordWebhook : null,
        notifyInApp: newFarmNotifyInApp,
        region: newFarmRegion,
        country: newFarmCountry,
        timezone: newFarmTimezone
      });
      setSelectedFarm(newFarmObj);
      setIsAddFarmOpen(false);
      // Reset form
      setNewFarmName('');
      setNewFarmCity('');
      setNewGeocodeError(null);
      setNewFarmLat('');
      setNewFarmLon('');
      setNewFarmRegion('');
      setNewFarmCountry('');
      setNewFarmTimezone('');
      setNewFarmCrop('Tea');
      setNewFarmImageUrl(null);
      setNewFarmWind(20);
      setNewFarmRain(10);
      setNewFarmEnabled(true);
      setNewFarmNotifyEmail(false);
      setNewFarmEmailAddress('');
      setNewFarmNotifySms(false);
      setNewFarmPhoneNumber('');
      setNewFarmNotifyDiscord(false);
      setNewFarmDiscordWebhook('');
      setNewFarmNotifyInApp(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setAddingFarm(false);
    }
  };

  // Geocode focus-out handlers
  const handleResolveNewFarmCity = async () => {
    if (!newFarmCity.trim()) return;
    setIsResolvingCity(true);
    setNewGeocodeError(null);
    try {
      const data = await apiService.geocodeCity(newFarmCity);
      setNewFarmLat(data.latitude.toString());
      setNewFarmLon(data.longitude.toString());
      setNewFarmRegion(data.region || '');
      setNewFarmCountry(data.country || '');
      setNewFarmTimezone(data.timezone || '');
    } catch (err) {
      setNewGeocodeError(err.response?.data?.error || `Cannot find location: '${newFarmCity}'`);
      setNewFarmLat('');
      setNewFarmLon('');
      setNewFarmRegion('');
      setNewFarmCountry('');
      setNewFarmTimezone('');
    } finally {
      setIsResolvingCity(false);
    }
  };

  const handleResolveEditFarmCity = async () => {
    if (!editFarmCity.trim()) return;
    setIsResolvingEditCity(true);
    setEditGeocodeError(null);
    try {
      const data = await apiService.geocodeCity(editFarmCity);
      setEditFarmLat(data.latitude.toString());
      setEditFarmLon(data.longitude.toString());
      setEditFarmRegion(data.region || '');
      setEditFarmCountry(data.country || '');
      setEditFarmTimezone(data.timezone || '');
    } catch (err) {
      setEditGeocodeError(err.response?.data?.error || `Cannot find location: '${editFarmCity}'`);
      setEditFarmLat('');
      setEditFarmLon('');
      setEditFarmRegion('');
      setEditFarmCountry('');
      setEditFarmTimezone('');
    } finally {
      setIsResolvingEditCity(false);
    }
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

  // Edit Farm Trigger handlers
  const handleEditFarmClick = (farm) => {
    const config = farm.alertConfig || {
      windThreshold: 20,
      rainThreshold: 10,
      enabled: true,
      notifyEmail: false,
      emailAddress: '',
      notifySms: false,
      phoneNumber: '',
      notifyDiscord: false,
      discordWebhook: '',
      notifyInApp: true
    };

    setEditFarmId(farm.id);
    setEditFarmName(farm.name);
    setEditFarmCity('');
    setEditGeocodeError(null);
    setEditFarmLat(farm.latitude.toString());
    setEditFarmLon(farm.longitude.toString());
    setEditFarmRegion(farm.region || '');
    setEditFarmCountry(farm.country || '');
    setEditFarmTimezone(farm.timezone || '');
    setEditFarmCrop(farm.cropType);
    setEditFarmImageUrl(farm.imageUrl);
    setEditFarmWind(config.windThreshold);
    setEditFarmRain(config.rainThreshold);
    setEditFarmEnabled(config.enabled);
    setEditFarmNotifyEmail(config.notifyEmail);
    setEditFarmEmailAddress(config.emailAddress || '');
    setEditFarmNotifySms(config.notifySms);
    setEditFarmPhoneNumber(config.phoneNumber || '');
    setEditFarmNotifyDiscord(config.notifyDiscord);
    setEditFarmDiscordWebhook(config.discordWebhook || '');
    setEditFarmNotifyInApp(config.notifyInApp);
    setIsEditFarmOpen(true);
  };

  const handleEditFarmSubmit = async (e) => {
    e.preventDefault();
    if (!editFarmName || !editFarmLat || !editFarmLon) return;

    setUpdatingFarm(true);
    try {
      const updated = await updateFarm(editFarmId, {
        name: editFarmName,
        latitude: parseFloat(editFarmLat),
        longitude: parseFloat(editFarmLon),
        cropType: editFarmCrop,
        imageUrl: editFarmImageUrl,
        windThreshold: parseFloat(editFarmWind),
        rainThreshold: parseFloat(editFarmRain),
        enabled: editFarmEnabled,
        notifyEmail: editFarmNotifyEmail,
        emailAddress: editFarmNotifyEmail ? editFarmEmailAddress : null,
        notifySms: editFarmNotifySms,
        phoneNumber: editFarmNotifySms ? editFarmPhoneNumber : null,
        notifyDiscord: editFarmNotifyDiscord,
        discordWebhook: editFarmNotifyDiscord ? editFarmDiscordWebhook : null,
        notifyInApp: editFarmNotifyInApp,
        region: editFarmRegion,
        country: editFarmCountry,
        timezone: editFarmTimezone
      });
      setSelectedFarm(updated);
      setIsEditFarmOpen(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingFarm(false);
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

  // ----------------------------------------------------
  // LOGIN / REGISTRATION LAYOUT
  // ----------------------------------------------------
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/20 via-slate-950 to-slate-950">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-blue-950/15 via-transparent to-transparent"></div>

        <div className="z-10 w-full max-w-md bg-slate-900/40 border border-slate-900/60 backdrop-blur-md rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <span className="text-3xl">🌱</span>
            <h1 className="text-2xl font-black text-white tracking-tight">TerraClimate</h1>
            <p className="text-xs text-slate-500">Precision Agriculture & Telemetry Dashboard</p>
          </div>

          <form onSubmit={isRegistering ? handleSignUp : handleSignIn} className="space-y-4">
            {isRegistering && (
              <div className="relative">
                <FiUser className="absolute left-3 top-3.5 text-slate-500 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm glass-input text-slate-300"
                />
              </div>
            )}

            <div className="relative">
              <FiMail className="absolute left-3 top-3.5 text-slate-500 w-4 h-4" />
              <input 
                type="email" 
                placeholder="Email Address" 
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm glass-input text-slate-300"
                required
              />
            </div>

            <div className="relative">
              <FiLock className="absolute left-3 top-3.5 text-slate-500 w-4 h-4" />
              <input 
                type="password" 
                placeholder="Password" 
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm glass-input text-slate-300"
                required
              />
            </div>

            {authError && (
              <p className="text-rose-400 text-xs font-semibold">{authError}</p>
            )}

            <button 
              type="submit"
              className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-sm font-black transition-all cursor-pointer"
            >
              {isRegistering ? 'Register Account' : 'Sign In'}
            </button>
          </form>


          <div className="text-center">
            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-xs text-slate-500 hover:text-emerald-400 transition-colors"
            >
              {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Register"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleMarkAsRead = async (notification) => {
    try {
      await firebaseService.db.markNotificationAsRead(user.uid, notification.id);
      if (notification.alertLogId) {
        await apiService.markAlertAsRead(notification.alertLogId);
      }
      console.log('[Notification UI] Marked alert as read successfully.');
    } catch (err) {
      console.error('[Notification UI] Failed to mark alert as read:', err.message);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await firebaseService.db.markAllNotificationsAsRead(user.uid);
      await apiService.markAllAlertsAsRead();
      console.log('[Notification UI] Marked all alerts as read successfully.');
    } catch (err) {
      console.error('[Notification UI] Failed to mark all alerts as read:', err.message);
    }
  };

  // ----------------------------------------------------
  // MAIN DASHBOARD LAYOUT
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row select-none">
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
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white ring-2 ring-slate-950 animate-pulse">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
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

      {/* 1. LEFT SIDEBAR / MOBILE SLIDE-OVER DRAWER */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-slate-950 border-r border-slate-900 flex flex-col h-screen z-40 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:w-80 md:flex-shrink-0 md:z-20
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand (Desktop only) */}
        <div className="hidden md:flex p-5 border-b border-slate-900 items-center justify-between">
          <div className="flex items-center space-x-2 text-emerald-500">
            <span className="text-xl">🌱</span>
            <h1 className="text-lg font-black text-white tracking-tight">TerraClimate</h1>
          </div>
          <button 
            onClick={() => setIsNotificationOpen(true)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/20 transition-all cursor-pointer relative"
          >
            <FiBell className="w-4 h-4" />
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white ring-2 ring-slate-950 animate-pulse">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-5 py-3 border-b border-slate-900">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input 
              type="text" 
              placeholder="Search city (e.g. Nairobi)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs glass-input text-slate-300 placeholder-slate-500"
            />
            <FiSearch className="absolute left-3 top-3 text-slate-500 w-3.5 h-3.5" />
          </form>
        </div>

        {/* Saved Farms Directory */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 terminal-scrollbar">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>My Registered Farms</span>
            <button 
              onClick={() => {
                setIsAddFarmOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="p-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/25 transition-all cursor-pointer"
            >
              <FiPlus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            {farms.length > 0 ? (
              farms.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedFarm(item);
                    setIsMobileMenuOpen(false); // Close mobile drawer on selection
                  }}
                  className={`w-full flex items-center space-x-3 p-3 rounded-xl text-left text-xs transition-all cursor-pointer ${
                    selectedFarm?.id === item.id 
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold'
                      : 'border border-transparent text-slate-400 hover:bg-white/5'
                  }`}
                >
                  <FiMapPin className="w-4 h-4 shrink-0 text-slate-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{item.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{item.cropType} ➔ {item.latitude.toFixed(2)}°, {item.longitude.toFixed(2)}°</p>
                  </div>
                  {item.imageUrl && (
                    <img 
                      src={item.imageUrl} 
                      alt="Farm Thumbnail" 
                      className="w-10 h-10 object-cover rounded-lg border border-slate-800/80 shadow shrink-0 ml-2"
                    />
                  )}
                </button>
              ))
            ) : (
              <p className="text-xs text-slate-600 text-center py-6">No farms registered yet.</p>
            )}
          </div>
        </div>

        {/* User Card */}
        <div className="p-5 border-t border-slate-900 flex items-center justify-between bg-slate-950/40">
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">{user.displayName || 'Guest Farmer'}</p>
            <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/20 transition-all cursor-pointer"
          >
            <FiLogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT SPACE */}
      <main className="flex-1 overflow-y-auto p-2 md:p-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-4">
          <div className="flex space-x-1">
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
              We couldn't automatically detect your IP coordinates. Please use the search bar on the left to enter a city name (e.g. Nairobi, Bomet) or register a farm to view localized weather alerts.
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

      {/* 3. NEW FARM REGISTRATION DRAWER (MODAL) */}
      {isAddFarmOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900/90 border border-slate-900 rounded-3xl p-6 shadow-2xl space-y-5 animate-slide-in relative terminal-scrollbar">
            
            <button 
              onClick={() => setIsAddFarmOpen(false)}
              className="absolute right-4 top-4 text-slate-500 hover:text-slate-200 p-1 rounded-md hover:bg-white/5 transition-all"
            >
              <FiX className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Register New Farm Section</h3>
              <p className="text-xs text-slate-500">Configure coordinates and thresholds to get real-time warnings.</p>
            </div>

            <form onSubmit={handleAddFarmSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Farm/Field Name</label>
                  <input 
                    type="text"
                    placeholder="e.g. Bomet Tea Block A"
                    value={newFarmName}
                    onChange={(e) => setNewFarmName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-300"
                    required
                  />
                </div>

                <div className="col-span-2 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">City / Location Name</label>
                    {isResolvingCity && <span className="text-[9px] text-emerald-400 animate-pulse font-mono font-bold">RESOLVING...</span>}
                  </div>
                  <input 
                    type="text"
                    placeholder="Type city name (e.g. Uttara) and click away to auto-resolve"
                    value={newFarmCity}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewFarmCity(val);
                      setNewFarmLat('');
                      setNewFarmLon('');
                      setNewFarmRegion('');
                      setNewFarmCountry('');
                      setNewFarmTimezone('');
                      setNewGeocodeError(null);
                    }}
                    onBlur={handleResolveNewFarmCity}
                    className={`w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-300 ${newGeocodeError ? 'border-rose-500/40 focus:border-rose-500/60' : ''}`}
                  />
                  {newGeocodeError && (
                    <p className="text-[10px] text-rose-400 font-semibold tracking-wide mt-0.5">{newGeocodeError}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Latitude</label>
                  <input 
                    type="number"
                    step="0.000001"
                    placeholder="e.g. -0.7833"
                    value={newFarmLat}
                    onChange={(e) => setNewFarmLat(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-300"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Longitude</label>
                  <input 
                    type="number"
                    step="0.000001"
                    placeholder="e.g. 35.35"
                    value={newFarmLon}
                    onChange={(e) => setNewFarmLon(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-300"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Region</label>
                  <input 
                    type="text"
                    placeholder="Resolved Region"
                    value={newFarmRegion}
                    onChange={(e) => setNewFarmRegion(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-300"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Country</label>
                  <input 
                    type="text"
                    placeholder="Resolved Country"
                    value={newFarmCountry}
                    onChange={(e) => setNewFarmCountry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-300"
                  />
                </div>

                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Timezone</label>
                  <input 
                    type="text"
                    placeholder="Resolved Timezone"
                    value={newFarmTimezone}
                    onChange={(e) => setNewFarmTimezone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-300"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Primary Crop Type</label>
                  <select 
                    value={newFarmCrop}
                    onChange={(e) => setNewFarmCrop(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-300 bg-slate-900"
                  >
                    <option value="Tea">Tea leaves</option>
                    <option value="Maize">Maize/Corn</option>
                    <option value="Wheat">Wheat grains</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Wind Alert Limit (km/h)</label>
                  <input 
                    type="number"
                    value={newFarmWind}
                    onChange={(e) => setNewFarmWind(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-300"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Rain Alert Limit (mm)</label>
                  <input 
                    type="number"
                    value={newFarmRain}
                    onChange={(e) => setNewFarmRain(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-300"
                  />
                </div>
              </div>

              {/* Alert Configuration */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-950/40 border border-slate-900">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enable Farm Warnings</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={newFarmEnabled} 
                      onChange={(e) => setNewFarmEnabled(e.target.checked)} 
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-500 peer-checked:after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {newFarmEnabled && (
                  <div className="space-y-3 pt-3 border-t border-slate-800/60 flex flex-col">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox"
                        id="newFarmNotifyInApp"
                        checked={newFarmNotifyInApp}
                        onChange={(e) => setNewFarmNotifyInApp(e.target.checked)}
                        className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500/20 bg-slate-950"
                      />
                      <label htmlFor="newFarmNotifyInApp" className="text-xs text-slate-300 font-medium">In-App Notification Logs</label>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox"
                          id="newFarmNotifyEmail"
                          checked={newFarmNotifyEmail}
                          onChange={(e) => setNewFarmNotifyEmail(e.target.checked)}
                          className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500/20 bg-slate-950"
                        />
                        <label htmlFor="newFarmNotifyEmail" className="text-xs text-slate-300 font-medium">Email Broadcast</label>
                      </div>
                      {newFarmNotifyEmail && (
                        <input 
                          type="email"
                          placeholder="e.g. user@domain.com"
                          value={newFarmEmailAddress}
                          onChange={(e) => setNewFarmEmailAddress(e.target.value)}
                          className="w-[calc(100%-20px)] ml-5 px-3 py-1.5 rounded-lg text-xs glass-input text-slate-300"
                          required
                        />
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox"
                          id="newFarmNotifySms"
                          checked={newFarmNotifySms}
                          onChange={(e) => setNewFarmNotifySms(e.target.checked)}
                          className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500/20 bg-slate-950"
                        />
                        <label htmlFor="newFarmNotifySms" className="text-xs text-slate-300 font-medium">SMS Warning (Phone)</label>
                      </div>
                      {newFarmNotifySms && (
                        <input 
                          type="text"
                          placeholder="e.g. +8801700000000"
                          value={newFarmPhoneNumber}
                          onChange={(e) => setNewFarmPhoneNumber(e.target.value)}
                          className="w-[calc(100%-20px)] ml-5 px-3 py-1.5 rounded-lg text-xs glass-input text-slate-300"
                          required
                        />
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox"
                          id="newFarmNotifyDiscord"
                          checked={newFarmNotifyDiscord}
                          onChange={(e) => setNewFarmNotifyDiscord(e.target.checked)}
                          className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500/20 bg-slate-950"
                        />
                        <label htmlFor="newFarmNotifyDiscord" className="text-xs text-slate-300 font-medium">Discord Server Integration</label>
                      </div>
                      {newFarmNotifyDiscord && (
                        <input 
                          type="url"
                          placeholder="https://discord.com/api/webhooks/..."
                          value={newFarmDiscordWebhook}
                          onChange={(e) => setNewFarmDiscordWebhook(e.target.value)}
                          className="w-[calc(100%-20px)] ml-5 px-3 py-1.5 rounded-lg text-xs glass-input text-slate-300"
                          required
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* S3 File Uploader Node */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">S3 Drone Map / Satellite Snap</label>
                <ImageUploader 
                  onUploadComplete={(url) => setNewFarmImageUrl(url)}
                  currentImageUrl={newFarmImageUrl}
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-900 pt-4 mt-2">
                <button 
                  type="button"
                  onClick={() => setIsAddFarmOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={addingFarm}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {addingFarm ? 'Registering...' : 'Register Farm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Farm Modal */}
      {isEditFarmOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900/90 border border-slate-900 rounded-3xl p-6 shadow-2xl space-y-5 animate-slide-in relative terminal-scrollbar">
            
            <button 
              onClick={() => setIsEditFarmOpen(false)}
              className="absolute right-4 top-4 text-slate-500 hover:text-slate-200 p-1 rounded-md hover:bg-white/5 transition-all"
            >
              <FiX className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Edit Farm Details</h3>
              <p className="text-xs text-slate-500">Update coordinates, thresholds, or details for your farm.</p>
            </div>

            <form onSubmit={handleEditFarmSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Farm/Field Name</label>
                  <input 
                    type="text"
                    value={editFarmName}
                    onChange={(e) => setEditFarmName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-300"
                    required
                  />
                </div>

                <div className="col-span-2 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">City / Location Name</label>
                    {isResolvingEditCity && <span className="text-[9px] text-emerald-400 animate-pulse font-mono font-bold">RESOLVING...</span>}
                  </div>
                  <input 
                    type="text"
                    placeholder="Type city name to update coordinates"
                    value={editFarmCity}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditFarmCity(val);
                      setEditFarmLat('');
                      setEditFarmLon('');
                      setEditFarmRegion('');
                      setEditFarmCountry('');
                      setEditFarmTimezone('');
                      setEditGeocodeError(null);
                    }}
                    onBlur={handleResolveEditFarmCity}
                    className={`w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-300 ${editGeocodeError ? 'border-rose-500/40 focus:border-rose-500/60' : ''}`}
                  />
                  {editGeocodeError && (
                    <p className="text-[10px] text-rose-400 font-semibold tracking-wide mt-0.5">{editGeocodeError}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Latitude</label>
                  <input 
                    type="number"
                    step="0.000001"
                    value={editFarmLat}
                    onChange={(e) => setEditFarmLat(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-300"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Longitude</label>
                  <input 
                    type="number"
                    step="0.000001"
                    value={editFarmLon}
                    onChange={(e) => setEditFarmLon(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-300"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Region</label>
                  <input 
                    type="text"
                    placeholder="Resolved Region"
                    value={editFarmRegion}
                    onChange={(e) => setEditFarmRegion(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-300"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Country</label>
                  <input 
                    type="text"
                    placeholder="Resolved Country"
                    value={editFarmCountry}
                    onChange={(e) => setEditFarmCountry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-300"
                  />
                </div>

                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Timezone</label>
                  <input 
                    type="text"
                    placeholder="Resolved Timezone"
                    value={editFarmTimezone}
                    onChange={(e) => setEditFarmTimezone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-300"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Primary Crop Type</label>
                  <select 
                    value={editFarmCrop}
                    onChange={(e) => setEditFarmCrop(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-300 bg-slate-900"
                  >
                    <option value="Tea">Tea leaves</option>
                    <option value="Maize">Maize/Corn</option>
                    <option value="Wheat">Wheat grains</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Wind Alert Limit (km/h)</label>
                  <input 
                    type="number"
                    value={editFarmWind}
                    onChange={(e) => setEditFarmWind(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-300"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Rain Alert Limit (mm)</label>
                  <input 
                    type="number"
                    value={editFarmRain}
                    onChange={(e) => setEditFarmRain(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs glass-input text-slate-300"
                  />
                </div>
              </div>

              {/* Alert Configuration */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-950/40 border border-slate-900">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enable Farm Warnings</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={editFarmEnabled} 
                      onChange={(e) => setEditFarmEnabled(e.target.checked)} 
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-500 peer-checked:after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {editFarmEnabled && (
                  <div className="space-y-3 pt-3 border-t border-slate-800/60 flex flex-col">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox"
                        id="editFarmNotifyInApp"
                        checked={editFarmNotifyInApp}
                        onChange={(e) => setEditFarmNotifyInApp(e.target.checked)}
                        className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500/20 bg-slate-950"
                      />
                      <label htmlFor="editFarmNotifyInApp" className="text-xs text-slate-300 font-medium">In-App Notification Logs</label>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox"
                          id="editFarmNotifyEmail"
                          checked={editFarmNotifyEmail}
                          onChange={(e) => setEditFarmNotifyEmail(e.target.checked)}
                          className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500/20 bg-slate-950"
                        />
                        <label htmlFor="editFarmNotifyEmail" className="text-xs text-slate-300 font-medium">Email Broadcast</label>
                      </div>
                      {editFarmNotifyEmail && (
                        <input 
                          type="email"
                          placeholder="e.g. user@domain.com"
                          value={editFarmEmailAddress}
                          onChange={(e) => setEditFarmEmailAddress(e.target.value)}
                          className="w-[calc(100%-20px)] ml-5 px-3 py-1.5 rounded-lg text-xs glass-input text-slate-300"
                          required
                        />
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox"
                          id="editFarmNotifySms"
                          checked={editFarmNotifySms}
                          onChange={(e) => setEditFarmNotifySms(e.target.checked)}
                          className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500/20 bg-slate-950"
                        />
                        <label htmlFor="editFarmNotifySms" className="text-xs text-slate-300 font-medium">SMS Warning (Phone)</label>
                      </div>
                      {editFarmNotifySms && (
                        <input 
                          type="text"
                          placeholder="e.g. +8801700000000"
                          value={editFarmPhoneNumber}
                          onChange={(e) => setEditFarmPhoneNumber(e.target.value)}
                          className="w-[calc(100%-20px)] ml-5 px-3 py-1.5 rounded-lg text-xs glass-input text-slate-300"
                          required
                        />
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox"
                          id="editFarmNotifyDiscord"
                          checked={editFarmNotifyDiscord}
                          onChange={(e) => setEditFarmNotifyDiscord(e.target.checked)}
                          className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500/20 bg-slate-950"
                        />
                        <label htmlFor="editFarmNotifyDiscord" className="text-xs text-slate-300 font-medium">Discord Server Integration</label>
                      </div>
                      {editFarmNotifyDiscord && (
                        <input 
                          type="url"
                          placeholder="https://discord.com/api/webhooks/..."
                          value={editFarmDiscordWebhook}
                          onChange={(e) => setEditFarmDiscordWebhook(e.target.value)}
                          className="w-[calc(100%-20px)] ml-5 px-3 py-1.5 rounded-lg text-xs glass-input text-slate-300"
                          required
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">S3 Drone Map / Satellite Snap</label>
                <ImageUploader 
                  onUploadComplete={(url) => setEditFarmImageUrl(url)}
                  currentImageUrl={editFarmImageUrl}
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-900 pt-4 mt-2">
                <button 
                  type="button"
                  onClick={() => setIsEditFarmOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={updatingFarm}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {updatingFarm ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification Drawer Overlay */}
      {isNotificationOpen && (
        <div className="fixed inset-y-0 right-0 z-40 w-96 bg-slate-950/95 border-l border-slate-900 backdrop-blur-md shadow-2xl flex flex-col h-full animate-slide-in">
          {/* Header */}
          <div className="p-5 border-b border-slate-900 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-400">
              <FiBell className="w-5 h-5" />
              <h2 className="text-base font-bold text-white">Notifications ({notifications.filter(n => !n.read).length} unread)</h2>
            </div>
            <div className="flex items-center space-x-3">
              {notifications.filter(n => !n.read).length > 0 && (
                <button 
                  onClick={handleMarkAllAsRead}
                  className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  Mark All
                </button>
              )}
              <button 
                onClick={() => setIsNotificationOpen(false)}
                className="text-slate-500 hover:text-slate-200 p-1 rounded-md hover:bg-white/5 transition-all cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3 terminal-scrollbar">
            {notifications.length > 0 ? (
              [...notifications]
                .sort((a, b) => {
                  const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
                  const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
                  return timeB - timeA;
                })
                .map((n) => (
                  <div 
                    key={n.id} 
                    className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      n.read 
                        ? 'bg-slate-900/30 border-slate-900/50 text-slate-500' 
                        : 'bg-emerald-500/5 border-emerald-500/10 text-slate-300'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          n.alertType === 'WIND_ALERT' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10' : 'bg-rose-500/10 text-rose-400 border border-rose-500/10'
                        }`}>
                          {n.alertType || 'ALERT'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">{n.farmName}</span>
                      </div>
                      <p className="text-xs leading-relaxed break-words">{n.message}</p>
                      <p className="text-[9px] text-slate-600 font-mono">
                        {n.createdAt?.toDate 
                          ? n.createdAt.toDate().toLocaleTimeString() 
                          : n.createdAt?.seconds 
                            ? new Date(n.createdAt.seconds * 1000).toLocaleTimeString() 
                            : new Date(n.createdAt || Date.now()).toLocaleTimeString()}
                      </p>
                    </div>

                    {/* Status Mark Read Action */}
                    {!n.read ? (
                      <button 
                        onClick={() => handleMarkAsRead(n)}
                        className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all cursor-pointer shrink-0 border border-emerald-500/10"
                        title="Mark as Read"
                      >
                        <FiCheck className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="p-1.5 text-slate-700 shrink-0" title="Read">
                        <FiCheckCircle className="w-3.5 h-3.5 opacity-60" />
                      </span>
                    )}
                  </div>
                ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-600">
                <FiBell className="w-8 h-8 opacity-20 mb-2 animate-pulse" />
                <p className="text-xs">No notifications yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

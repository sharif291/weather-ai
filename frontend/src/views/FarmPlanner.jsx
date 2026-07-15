import { useState } from 'react';
import {
  FiAlertCircle,
  FiCloudRain,
  FiCompass,
  FiEdit,
  FiFileText,
  FiInfo,
  FiPlay,
  FiSun,
  FiTrash2,
  FiWind,
  FiImage,
  FiX
} from 'react-icons/fi';
import apiService from '../services/api';

export const FarmPlanner = ({ farm, weather, refetchFarms, onDeleteFarm, onEditFarm }) => {
  const [simulating, setSimulating] = useState(false);
  const [simStatus, setSimStatus] = useState(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!farm) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center glass-panel rounded-2xl">
        <FiFileText className="w-12 h-12 text-slate-600 mb-3 animate-bounce" />
        <h3 className="text-lg font-bold text-slate-300">No Farm Selected</h3>
        <p className="text-sm text-slate-500 max-w-sm mt-1">
          Select an existing cultivation zone or register a new plot to begin tracking micro-weather advisories.
        </p>
      </div>
    );
  }

  const { name, latitude, longitude, cropType, imageUrl, alertConfig } = farm;
  const config = alertConfig || {
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
  const { windThreshold, rainThreshold, enabled } = config;
  const current = weather?.currentWeather?.current;
  const forecastToday = weather?.forecast?.forecast?.forecastday?.[0]?.day;

  // ----------------------------------------------------
  // AGRONOMIC RULES ENGINE
  // ----------------------------------------------------
  const alerts = [];

  if (current) {
    const windSpeed = current.wind_kph;
    const temp = current.temp_c;

    // Rule 1: High Wind pesticide spraying hazard
    if (windSpeed >= windThreshold) {
      alerts.push({
        id: 'wind',
        type: 'DANGER',
        title: 'Pesticide Spray Hold',
        icon: <FiWind className="w-5 h-5 text-rose-400" />,
        message: `Current wind is ${windSpeed} km/h (Limit: ${windThreshold} km/h). Severe danger of chemical drift. Cancel all pesticide and herbicide spraying.`
      });
    }

    // Rule 2: Extreme cold / Frost risk
    if (temp <= 8) {
      alerts.push({
        id: 'frost',
        type: 'DANGER',
        title: 'Leaf Frost Hazard',
        icon: <FiAlertCircle className="w-5 h-5 text-rose-400" />,
        message: `Night temperature is critical at ${temp}°C. Frost damage risk for sensitive crop shoots. Take active crop protection measures.`
      });
    }
  }

  // Rule 5: Heavy rain fertilizer hold (forecast based)
  if (forecastToday && forecastToday.totalprecip_mm >= rainThreshold) {
    alerts.push({
      id: 'rain-hold',
      type: 'WARNING',
      title: 'Fertilization Delay Recommended',
      icon: <FiCloudRain className="w-5 h-5 text-amber-400" />,
      message: `Rain of ${forecastToday.totalprecip_mm}mm is forecast for today. Exceeds your threshold of ${rainThreshold}mm. Postpone dry fertilizer applications to avoid chemical run-off and soil leaching.`
    });
  }

  // ----------------------------------------------------
  // SIMULATION TRIGGERS
  // ----------------------------------------------------
  const handleSimulateAlert = async (alertType) => {
    setSimulating(true);
    setSimStatus(null);
    try {
      const msg = alertType === 'WIND_ALERT' 
        ? `High wind warnings (${current?.wind_kph || '25'} km/h) detected on ${name}. Cancel pesticide spraying.`
        : `Severe storm warning (${forecastToday?.totalprecip_mm || '12'} mm) detected on ${name}. Hold fertilizer applications.`;

      await apiService.triggerAlertSimulation(farm.id, alertType, msg);
      setSimStatus('Simulation task enqueued to SQS!');
      setTimeout(() => setSimStatus(null), 3000);
    } catch (err) {
      console.error(err);
      setSimStatus('Simulation trigger failed.');
      setTimeout(() => setSimStatus(null), 3000);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. FARM BANNER AND DETAILS */}
      <div className="relative overflow-hidden rounded-2xl glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {imageUrl && (
          <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
            <img src={imageUrl} alt="Farm Map BG" className="w-full h-full object-cover blur-[2px]" />
          </div>
        )}
        
        <div className="z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt="Farm Visual" 
              onClick={() => setIsLightboxOpen(true)}
              className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-2xl border border-slate-700/50 shadow-md shrink-0 cursor-zoom-in hover:brightness-110 transition-all duration-150"
            />
          ) : (
            <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center rounded-2xl bg-slate-950/80 border border-slate-800/80 shrink-0 text-emerald-400">
              <FiImage className="w-8 h-8 opacity-40" />
            </div>
          )}
          
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
                {cropType}
              </span>
              <span className="text-xs font-mono text-slate-400">
                {latitude.toFixed(4)}°, {longitude.toFixed(4)}°
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{name}</h1>
            <p className="text-xs text-slate-400">
              Advisory constraints ➔ Wind: {windThreshold} kph | Rain: {rainThreshold} mm
            </p>
            {enabled ? (
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">🔔 Alerts Active</span>
                {config.notifyInApp && <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-800/80 text-slate-300">In-App</span>}
                {config.notifyEmail && <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-800/80 text-slate-300" title={config.emailAddress}>📧 Email</span>}
                {config.notifySms && <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-800/80 text-slate-300" title={config.phoneNumber}>💬 SMS</span>}
                {config.notifyDiscord && <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-800/80 text-slate-300" title={config.discordWebhook}>👾 Discord</span>}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">🔕 Alerts Muted</span>
              </div>
            )}
          </div>
        </div>

        <div className="z-10 flex items-center gap-3">
          <button 
            onClick={() => onEditFarm(farm)}
            className="px-4 py-2.5 rounded-xl border border-slate-800 hover:border-emerald-500/30 hover:bg-emerald-500/5 text-slate-400 hover:text-emerald-400 text-sm font-semibold transition-all duration-150 flex items-center space-x-2 cursor-pointer"
          >
            <FiEdit className="w-4 h-4" />
            <span>Edit Farm</span>
          </button>

          <button 
            onClick={() => onDeleteFarm(farm.id)}
            className="px-4 py-2.5 rounded-xl border border-slate-800 hover:border-rose-500/30 hover:bg-rose-500/5 text-slate-400 hover:text-rose-400 text-sm font-semibold transition-all duration-150 flex items-center space-x-2 cursor-pointer"
          >
            <FiTrash2 className="w-4 h-4" />
            <span>Decommission</span>
          </button>
        </div>
      </div>

      {/* 2. REAL-TIME MICRO-CLIMATE DIAGNOSTICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Temp Card */}
        <div className="glass-panel p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/15 text-emerald-400 rounded-xl">
            <FiSun className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Temperature</p>
            <h3 className="text-xl font-black text-white mt-1">
              {current ? `${current.temp_c}°C` : '--'}
            </h3>
          </div>
        </div>

        {/* Wind Compass Card */}
        <div className="glass-panel p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-cyan-500/15 text-cyan-400 rounded-xl relative">
            <FiCompass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Wind Vector</p>
            <h3 className="text-xl font-black text-white mt-1">
              {current ? `${current.wind_kph} kph` : '--'}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Direction: {current ? current.wind_dir : '--'}
            </p>
          </div>
        </div>

        {/* Rain Card */}
        <div className="glass-panel p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-blue-500/15 text-blue-400 rounded-xl">
            <FiCloudRain className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Precipitation</p>
            <h3 className="text-xl font-black text-white mt-1">
              {forecastToday ? `${forecastToday.totalprecip_mm} mm` : '0 mm'}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Today's Rain Volume
            </p>
          </div>
        </div>
      </div>

      {/* 3. RULE-BASED AGRO-ADVISORY ALERTS */}
      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-base font-bold text-white mb-4">Precision Crop Advisories {alerts.length}</h3>
        
        {alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div 
                key={alert.id}
                className={`p-4 rounded-xl border flex items-start space-x-4 transition-all ${
                  alert.type === 'DANGER' 
                    ? 'bg-rose-500/5 border-rose-500/20 text-rose-200' 
                    : alert.type === 'WARNING'
                    ? 'bg-amber-500/5 border-amber-500/20 text-amber-200'
                    : 'bg-blue-500/5 border-blue-500/20 text-blue-200'
                }`}
              >
                <div className="mt-0.5">{alert.icon}</div>
                <div>
                  <h4 className="font-bold text-sm text-white">{alert.title}</h4>
                  <p className="text-xs mt-1 leading-relaxed opacity-85 font-medium">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-800 rounded-xl">
            <FiInfo className="w-8 h-8 text-emerald-400/80 mb-2 animate-pulse" />
            <h4 className="text-sm font-semibold text-slate-300">Optimal Field Conditions</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Micro-climate parameters are fully normal. Safe to proceed with irrigation, fertilizing, and pesticide sprays.
            </p>
          </div>
        )}
      </div>

      {/* 4. WORKER QUEUE TRIGGER SYSTEM (CDK/SQS MOCK TRIGGER) */}
      <div className="glass-panel rounded-2xl p-6 border-l-4 border-emerald-500">
        <h3 className="text-base font-bold text-white mb-2">Simulate Cloud Notification SQS pipeline</h3>
        <p className="text-xs text-slate-400 leading-relaxed mb-4">
          Test the asynchronous pipeline. Triggering simulation pushes alert payloads to **AWS SQS**. 
          The background Node.js worker pulls the message, updates the database, writes to Firestore, and pushes a slide-in warning toast **in real-time**.
        </p>

        <div className="flex flex-wrap gap-3">
          <button 
            disabled={simulating}
            onClick={() => handleSimulateAlert('WIND_ALERT')}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-amber-400 hover:bg-slate-900/80 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <FiPlay className="w-3 h-3 text-amber-400" />
            <span>Simulate Wind Warning</span>
          </button>


          <button 
            disabled={simulating}
            onClick={() => handleSimulateAlert('STORM_ALERT')}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-rose-400 hover:bg-slate-900/80 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <FiPlay className="w-3 h-3 text-rose-400" />
            <span>Simulate Storm Warning</span>
          </button>
        </div>

        {simStatus && (
          <div className="mt-4 p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[10px] text-emerald-400 flex items-center space-x-2 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>{simStatus}</span>
          </div>
        )}
      </div>

      {/* Lightbox Modal Overlay */}
      {isLightboxOpen && imageUrl && (
        <div 
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
        >
          <button 
            onClick={() => setIsLightboxOpen(false)}
            className="absolute right-6 top-6 text-slate-400 hover:text-white bg-slate-900/60 p-2.5 rounded-full border border-slate-800 hover:bg-slate-900 transition-all cursor-pointer z-50 shadow-lg"
          >
            <FiX className="w-5 h-5" />
          </button>
          
          <img 
            src={imageUrl} 
            alt="Farm Map Large View" 
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-slate-800/80 animate-zoom-in"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
          />
        </div>
      )}
    </div>
  );
};

export default FarmPlanner;

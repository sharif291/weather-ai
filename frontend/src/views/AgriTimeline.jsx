import { useState } from 'react';
import {
  FiClock,
  FiDroplet, FiSun,
  FiTrendingUp
} from 'react-icons/fi';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis, YAxis
} from 'recharts';
import { apiService } from '../services/api.js';

export const AgriTimeline = ({ farm, weather }) => {
  const [selectedHour, setSelectedHour] = useState(8); // Default to 8:00 AM
  const [historicalDate, setHistoricalDate] = useState('');
  const [historyData, setHistoryData] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  if (!farm || !weather) return null;

  const hourlyData = weather.hourly?.hourly || [];
  const forecastDays = weather.forecast?.forecast?.forecastday || [];
  const activeHour = hourlyData[selectedHour] || null;

  // Prepare chart coordinates data
  const chartData = hourlyData.map((item, idx) => ({
    hour: item.time,
    date: item.date,
    temperature: item.temp_c,
    rainChance: item.chance_of_rain || 0,
  }));
  const formatTooltipLabel = (label, payload) => {
    const activeItem = payload?.[0]?.payload;
    const dateVal = activeItem?.date;

    if (dateVal) {
      try {
        const formattedDate = new Date(dateVal).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
        return `${formattedDate} at ${label}`;
      } catch (e) {
        return `${dateVal} at ${label}`;
      }
    }

    const matched = chartData.find(d => d.hour === label);
    if (matched && matched.date) {
      try {
        const formattedDate = new Date(matched.date).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
        return `${formattedDate} at ${label}`;
      } catch (e) {
        return `${matched.date} at ${label}`;
      }
    }
    return label;
  };

  // Fetch historical data comparisons
  const handleCompareHistory = async (e) => {
    e.preventDefault();
    if (!historicalDate) return;

    setLoadingHistory(true);
    setHistoryError(null);
    setHistoryData(null);
    try {
      let query = 'Nairobi';
      const loc = weather.currentWeather?.location;
      if (loc && loc.lat !== undefined && loc.lon !== undefined) {
        query = `${loc.lat},${loc.lon}`;
      } else if (farm && farm.latitude !== undefined && farm.longitude !== undefined) {
        query = `${farm.latitude},${farm.longitude}`;
      } else if (loc && loc.name && loc.name !== 'Selected Location' && loc.name !== 'Selected Coordinate') {
        query = loc.name;
      } else if (farm && farm.name) {
        query = farm.name;
      }

      const data = await apiService.getDaily(query, historicalDate);
      setHistoryData(data.daily);
    } catch (err) {
      console.error('[History Compare] API failed:', err.message);
      setHistoryError('Failed to fetch historical weather indexes.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const getDayName = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Mobile-only Location Metadata Header */}
      <div className="md:hidden glass-panel p-5 rounded-2xl space-y-3 border border-slate-900 bg-slate-950/20">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Monitoring Location</span>
          {farm?.cropType && (
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[9px] font-bold">
              Crop: {farm.cropType}
            </span>
          )}
        </div>
        <h4 className="text-sm font-black text-white">{farm?.name || 'Active Query'}</h4>
        <div className="grid grid-cols-3 gap-4 text-[10px] text-slate-400 font-mono pt-1">
          <div>
            <span className="block text-[8px] text-slate-600 font-bold uppercase mb-0.5">City</span>
            <span className="text-slate-300 font-semibold">{farm?.city || weather.currentWeather?.location?.name || 'N/A'}</span>
          </div>
          <div>
            <span className="block text-[8px] text-slate-600 font-bold uppercase mb-0.5">Latitude</span>
            <span className="text-slate-300 font-semibold">{farm?.latitude || weather.currentWeather?.location?.lat || 'N/A'}</span>
          </div>
          <div>
            <span className="block text-[8px] text-slate-600 font-bold uppercase mb-0.5">Longitude</span>
            <span className="text-slate-300 font-semibold">{farm?.longitude || weather.currentWeather?.location?.lon || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* 1. HOURLY TEMPERATURE & RAIN GRADIENT CHART */}
      <div className="glass-panel p-2 md:p-6 rounded-2xl">
        <div className="flex items-center space-x-2 text-emerald-400 mb-4">
          <FiTrendingUp className="w-5 h-5" />
          <h3 className="text-base font-bold text-white">24-Hour Trend Micro-Analytics</h3>
        </div>

        <div className="w-full overflow-x-auto terminal-scrollbar pb-2">
          <div className="h-64 font-mono text-xs min-w-[700px] md:min-w-0">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour" stroke="#475569" tickLine={false} />
                  <YAxis stroke="#475569" tickLine={false} />
                  <Tooltip 
                    labelFormatter={formatTooltipLabel}
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: 'rgba(255,255,255,0.05)',
                      borderRadius: '12px',
                      color: '#f8fafc'
                    }} 
                  />
                  <Area type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorTemp)" />
                  <Area type="monotone" dataKey="rainChance" name="Rain (%)" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRain)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">No hourly data load.</div>
            )}
          </div>
        </div>
      </div>

      {/* 2. INTERACTIVE HOURLY OPERATIONS SLIDER */}
      <div className="glass-panel p-2 md:p-6 rounded-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-emerald-400">
            <FiClock className="w-5 h-5" />
            <h3 className="text-base font-bold text-white">Hourly Fieldwork Planner</h3>
          </div>
          <span className="text-xs font-mono bg-slate-900 border border-slate-800 px-3 py-1 rounded-full text-emerald-400">
            Selected Hour ➔ {activeHour?.time || '00:00'}
          </span>
        </div>

        {/* Dynamic Range Slider */}
        <div className="w-full py-2">
          <input 
            type="range" 
            min="0" 
            max="23" 
            value={selectedHour}
            onChange={(e) => setSelectedHour(parseInt(e.target.value))}
            className="w-full h-2 rounded-lg bg-slate-900 accent-emerald-500 cursor-ew-resize"
          />
          <div className="flex justify-between text-[10px] text-slate-600 font-mono mt-2">
            <span>00:00 (Midnight)</span>
            <span>06:00 (Dawn)</span>
            <span>12:00 (Noon)</span>
            <span>18:00 (Dusk)</span>
            <span>23:00 (Night)</span>
          </div>
        </div>

        {/* Selected Hour Details Grid */}
        {activeHour && (
          <div className="grid grid-cols-3 gap-4 items-center p-4 rounded-xl bg-slate-950/40 border border-slate-900/60 animate-fade-in">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Conditions</span>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-300 font-semibold">{activeHour.condition.text}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Temperature</span>
              <div className="flex items-center space-x-2 text-white">
                <FiSun className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-black">{activeHour.temp_c}°C</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Rain Probability</span>
              <div className="flex items-center space-x-2 text-white">
                <FiDroplet className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-black">
                  {activeHour.chance_of_rain}% 
                  {activeHour.precip_mm !== undefined && activeHour.precip_mm > 0 && (
                    <span className="text-[10px] text-slate-400 font-normal ml-1">({activeHour.precip_mm}mm)</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. HISTORICAL CLIMATE COMPARISON PANEL */}
      {/* <div className="glass-panel p-2 md:p-6 rounded-2xl space-y-4">
        <div className="flex items-center space-x-2 text-emerald-400">
          <FiCalendar className="w-5 h-5" />
          <h3 className="text-base font-bold text-white">Historical Climate Trend Lookup</h3>
        </div>
        <p className="text-xs text-slate-500">
          Compare today's active weather metrics side-by-side with historical date logs from the `/v1/daily` API.
        </p>

        <form onSubmit={handleCompareHistory} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[100px] space-y-1.5">
            <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Select Past Date</label>
            <input 
              type="date"
              max={new Date().toISOString().split('T')[0]}
              value={historicalDate}
              onChange={(e) => setHistoricalDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl glass-input text-slate-200 text-sm font-mono"
              required
            />
          </div>
          <button 
            type="submit"
            disabled={loadingHistory}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-sm font-bold flex items-center space-x-2 cursor-pointer disabled:opacity-50 h-[42px]"
          >
            <span>Compare Trends</span>
            <FiArrowRight className="w-4 h-4" />
          </button>
        </form>

        {loadingHistory && (
          <p className="text-xs text-slate-400 animate-pulse font-mono">Querying historical registries via API Proxy...</p>
        )}

        {historyError && (
          <p className="text-xs text-rose-400 font-medium">{historyError}</p>
        )}

        {historyData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/40 border border-slate-900/60 animate-fade-in mt-4">
            <div className="glass-panel p-4 rounded-xl flex items-center justify-between border-slate-800">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Avg Temperature</span>
                <p className="text-xs font-mono text-slate-400">Past: {historyData.avgtemp_c}°C</p>
                <p className="text-xs font-mono text-emerald-400">Today: {weather.currentWeather?.current?.temp_c}°C</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-black bg-emerald-500/10 px-2 py-1 rounded text-emerald-400">
                  {Math.round((weather.currentWeather?.current?.temp_c - historyData.avgtemp_c) * 10) / 10}°C diff
                </span>
              </div>
            </div>

            <div className="glass-panel p-4 rounded-xl flex items-center justify-between border-slate-800">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Precipitation</span>
                <p className="text-xs font-mono text-slate-400">Past: {historyData.totalprecip_mm}mm</p>
                <p className="text-xs font-mono text-blue-400">Today: {weather.currentWeather?.current?.precip_mm || 0}mm</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-black bg-blue-500/10 px-2 py-1 rounded text-blue-400">
                  {Math.round(((weather.currentWeather?.current?.precip_mm || 0) - historyData.totalprecip_mm) * 10) / 10}mm diff
                </span>
              </div>
            </div>
          </div>
        )}
      </div> */}

      {/* 4. 3-DAY FORECAST GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {forecastDays.map((dayObj, index) => (
          <div key={dayObj.date} className="glass-panel p-5 rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 font-mono">
                {index === 0 ? 'Today' : getDayName(dayObj.date)}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">{dayObj.date}</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 font-bold text-sm">
                🌱
              </div>
              <div>
                <p className="text-xs text-slate-300 font-semibold">{dayObj.day.condition.text}</p>
                <h4 className="text-lg font-black text-white mt-0.5">
                  {dayObj.day.maxtemp_c}°C <span className="text-xs text-slate-400 font-medium">/ {dayObj.day.mintemp_c}°C</span>
                </h4>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-mono border-t border-slate-900/60 pt-3">
              <div>Rain: {dayObj.day.totalprecip_mm}mm</div>
              <div>Avg Temp: {dayObj.day.avgtemp_c}°C</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgriTimeline;

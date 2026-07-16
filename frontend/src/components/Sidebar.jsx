import React from 'react';
import { 
  FiMapPin, FiPlus, FiSettings, FiBell, FiLogOut
} from 'react-icons/fi';

export const Sidebar = ({
  user,
  farms,
  selectedFarm,
  setSelectedFarm,
  setActiveWeatherQuery,
  onOpenAddFarm,
  onOpenSettings,
  onOpenNotifications,
  notificationsCount,
  onLogout
}) => {

  return (
    <aside className="w-full md:w-72 bg-slate-900/30 border-r border-slate-900 flex flex-col h-auto md:h-screen shrink-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-900 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-xl">🌱</span>
          <div>
            <h2 className="text-sm font-black text-white tracking-wider uppercase">TerraClimate</h2>
            <p className="text-[10px] text-slate-500 font-bold font-mono">AGRI-METRICS v1.2</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <button 
            onClick={onOpenNotifications}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/20 transition-all cursor-pointer relative"
          >
            <FiBell className="w-4 h-4" />
            {notificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white ring-2 ring-slate-950 animate-pulse">
                {notificationsCount}
              </span>
            )}
          </button>
          <button 
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/20 transition-all cursor-pointer"
          >
            <FiSettings className="w-4 h-4" />
          </button>
        </div>
      </div>


      {/* Farms List */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 terminal-scrollbar">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
          <span>My Registered Farms</span>
          <button 
            onClick={onOpenAddFarm}
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
                  // Update activeWeatherQuery coordinates as well
                  setActiveWeatherQuery(`${item.latitude},${item.longitude}`);
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

      {/* User Footer */}
      <div className="p-5 border-t border-slate-900 flex items-center justify-between bg-slate-950/40">
        <div className="min-w-0">
          <p className="text-xs font-bold text-white truncate">{user.displayName || 'Guest Farmer'}</p>
          <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
        </div>
        <button 
          onClick={onLogout}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/20 transition-all cursor-pointer"
        >
          <FiLogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

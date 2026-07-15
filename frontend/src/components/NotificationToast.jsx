import React, { useEffect } from 'react';
import { FiAlertTriangle, FiBell, FiX, FiAlertOctagon } from 'react-icons/fi';

export const NotificationToast = ({ toast, globalAlert, onCloseToast, onCloseGlobal }) => {
  
  // Play subtle warning notification sound when a new alert pops up in real-time
  useEffect(() => {
    if (toast || globalAlert) {
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav');
        audio.volume = 0.2;
        audio.play().catch(() => {
          // Ignore audio play blockages from browser auto-play restrictions
        });
      } catch (err) {
        // Safe fail
      }
    }
  }, [toast, globalAlert]);

  // Auto-dismiss user toasts after 6 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onCloseToast();
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [toast, onCloseToast]);

  return (
    <>
      {/* 1. GLOBAL EMERGENCY BROADCAST BANNER (Top of screen) */}
      {globalAlert && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-rose-600/90 border-b border-rose-500/20 text-white backdrop-blur-md shadow-2xl py-3 px-6 flex items-center justify-between transition-all duration-300">
          <div className="flex items-center space-x-3 max-w-5xl mx-auto w-full">
            <FiAlertOctagon className="w-6 h-6 text-white animate-bounce flex-shrink-0" />
            <div className="text-sm font-medium tracking-wide">
              <span className="font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-xs mr-2">BROADCAST</span>
              {globalAlert.message}
            </div>
          </div>
          <button 
            onClick={onCloseGlobal}
            className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* 2. TARGETED USER-SPECIFIC WARNING TOAST (Bottom Right) */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 w-96 rounded-2xl glass-panel border-l-4 border-amber-500 shadow-2xl p-5 animate-slide-in">
          <div className="flex items-start space-x-4">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <FiAlertTriangle className="w-6 h-6 animate-pulse-emerald text-amber-500" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase font-bold tracking-wider text-amber-400">
                  {toast.alertType || 'CRITICAL WARN'}
                </p>
                <button 
                  onClick={onCloseToast}
                  className="text-slate-500 hover:text-slate-200 p-0.5 rounded-md hover:bg-white/5 transition-all"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
              <h4 className="text-sm font-bold text-slate-100 mt-1">
                {toast.farmName || 'Your Farm'}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed mt-1.5 font-medium">
                {toast.message}
              </p>
              <span className="text-[10px] text-slate-500 mt-2 block font-mono">
                Real-time push ➔ 0s latency
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationToast;

import React from 'react';
import { FiBell, FiX, FiInfo } from 'react-icons/fi';

export const NotificationDrawer = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onMarkAsRead
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const getAlertBadgeStyles = (type) => {
    switch (type) {
      case 'WIND_ALERT':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      case 'STORM_ALERT':
        return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
      default:
        return 'bg-sky-500/10 border-sky-500/20 text-sky-400';
    }
  };

  const getNotificationTime = (createdAt) => {
    if (!createdAt) return 'Just now';
    const ms = createdAt.seconds ? createdAt.seconds * 1000 : new Date(createdAt).getTime();
    const diffMins = Math.floor((Date.now() - ms) / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return new Date(ms).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-96 bg-slate-950/95 border-l border-slate-900 backdrop-blur-md shadow-2xl flex flex-col h-full animate-slide-in">
      {/* Header */}
      <div className="p-5 border-b border-slate-900 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-emerald-400">
          <FiBell className="w-5 h-5" />
          <h2 className="text-base font-bold text-white">Notifications ({unreadCount} unread)</h2>
        </div>
        <div className="flex items-center space-x-3">
          {unreadCount > 0 && (
            <button 
              onClick={onMarkAllAsRead}
              className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider cursor-pointer"
            >
              Mark All
            </button>
          )}
          <button 
            onClick={onClose}
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
            .map((item) => (
              <div 
                key={item.id}
                className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                  !item.read 
                    ? 'bg-slate-900/40 border-slate-800/80 shadow-md relative overflow-hidden group'
                    : 'bg-slate-950/20 border-slate-900/40 opacity-70'
                }`}
              >
                {!item.read && (
                  <span className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></span>
                )}
                
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border tracking-wider ${getAlertBadgeStyles(item.alertType)}`}>
                        {item.alertType?.replace('_', ' ') || 'SYSTEM'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium font-mono">{getNotificationTime(item.createdAt)}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold">{item.farmName || 'Advisory Update'}</p>
                  </div>
                  
                  {!item.read && (
                    <button 
                      onClick={() => onMarkAsRead(item)}
                      className="text-[9px] font-bold text-emerald-400/70 hover:text-emerald-400 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      Dismiss
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-medium">{item.message}</p>
              </div>
            ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center space-y-3 opacity-40 py-24">
            <FiInfo className="w-8 h-8 text-slate-500" />
            <p className="text-xs text-slate-400 font-medium tracking-wide">No alerts dispatched.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationDrawer;

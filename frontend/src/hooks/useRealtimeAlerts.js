import { useState, useEffect } from 'react';
import { firebaseService } from '../services/firebase.js';

export const useRealtimeAlerts = (user) => {
  const [notifications, setNotifications] = useState([]);
  const [globalAlert, setGlobalAlert] = useState(null);
  const [newToast, setNewToast] = useState(null);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setGlobalAlert(null);
      setNewToast(null);
      return;
    }

    // 1. Subscribe to User-Specific Notifications
    const unsubscribeNotifications = firebaseService.db.onSnapshotNotifications(
      user.uid,
      (snapshot) => {
        const list = [];
        snapshot.docs.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() });
        });

          // Detect if a brand-new notification arrived (to trigger slide-in toast)
          if (list.length > 0) {
            const sorted = [...list].sort((a, b) => {
              const timeA = a.createdAt?.seconds 
                ? a.createdAt.seconds * 1000 
                : a.createdAt?.toDate 
                  ? a.createdAt.toDate().getTime() 
                  : new Date(a.createdAt || 0).getTime();
              const timeB = b.createdAt?.seconds 
                ? b.createdAt.seconds * 1000 
                : b.createdAt?.toDate 
                  ? b.createdAt.toDate().getTime() 
                  : new Date(b.createdAt || 0).getTime();
              return timeB - timeA;
            });
            const newest = sorted[0];

            // Trigger toast if it was created within the last 30 seconds (prevents history spam on load)
            const alertTime = newest.createdAt?.toDate 
              ? newest.createdAt.toDate() 
              : newest.createdAt?.seconds 
                ? new Date(newest.createdAt.seconds * 1000)
                : new Date(newest.createdAt || Date.now());
            const diffMs = Date.now() - alertTime.getTime();
            
            console.log('[Realtime Alerts] Newest alert detected:', newest.message, 'diffMs:', diffMs);
            if (Math.abs(diffMs) < 30000) {
              setNewToast(newest);
            }
          }

        setNotifications(list);
      }
    );

    // 2. Subscribe to Global Cooperative Broadcasts
    const unsubscribeGlobal = firebaseService.db.onSnapshotGlobalBroadcasts(
      (snapshot) => {
        const list = [];
        snapshot.docs.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() });
        });

        if (list.length > 0) {
          const sorted = [...list].sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
          const newest = sorted[0];
          
          // Trigger global alert toast/banner
          const alertTime = newest.createdAt?.toDate ? newest.createdAt.toDate() : new Date(newest.createdAt);
          const diffMs = Date.now() - alertTime.getTime();
          
          if (diffMs < 15000) {
            setGlobalAlert(newest);
          }
        }
      }
    );

    return () => {
      unsubscribeNotifications();
      unsubscribeGlobal();
    };
  }, [user]);

  const clearToast = () => setNewToast(null);
  const clearGlobalAlert = () => setGlobalAlert(null);

  return {
    notifications,
    globalAlert,
    newToast,
    clearToast,
    clearGlobalAlert
  };
};

export default useRealtimeAlerts;

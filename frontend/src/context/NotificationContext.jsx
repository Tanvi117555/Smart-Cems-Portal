import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import api from '../services/api';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Real-Time Firestore Listener (Zero 30-second polling!)
  useEffect(() => {
    if (!isAuthenticated || !user?.uid) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    const notifsRef = collection(db, 'notifications');
    // Listen for notifications directed to this user's UID or MySQL migrated ID
    const q = query(notifsRef, where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      let unread = 0;

      snapshot.forEach((docSnap) => {
        const data = { id: docSnap.id, ...docSnap.data() };
        items.push(data);
        if (!data.isRead) {
          unread++;
        }
      });

      // Sort newest first
      items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      setNotifications(items);
      setUnreadCount(unread);
      setLoading(false);
    }, (error) => {
      console.warn('Real-time notifications listener error:', error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthenticated, user?.uid]);

  // API Fallback fetcher
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      if (res?.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (e) {
      console.warn('API fetchNotifications fallback warning:', e.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Mark single notification as read in Firestore and backend API
  const markAsRead = async (id) => {
    // Optimistic local update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true, is_read: 1 } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await api.patch(`/notifications/${id}/read`);
    } catch (e) {
      try {
        const notifRef = doc(db, 'notifications', id);
        await updateDoc(notifRef, {
          isRead: true,
          readAt: new Date().toISOString()
        });
      } catch (err) {
        console.error('Error marking notification read:', err);
      }
    }
  };

  // Mark all as read in Firestore and backend API
  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true, is_read: 1 })));
    setUnreadCount(0);

    try {
      await api.patch('/notifications/read-all');
    } catch (e) {
      try {
        const unreadList = notifications.filter(n => !n.isRead);
        if (unreadList.length === 0) return;

        const batch = writeBatch(db);
        const now = new Date().toISOString();

        unreadList.forEach(n => {
          const nRef = doc(db, 'notifications', n.id);
          batch.update(nRef, { isRead: true, readAt: now });
        });

        await batch.commit();
      } catch (err) {
        console.error('Error marking all notifications read:', err);
      }
    }
  };

  // Delete / Dismiss notification
  const deleteNotification = async (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await api.delete(`/notifications/${id}`);
    } catch (e) {
      console.error('Error deleting notification:', e);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

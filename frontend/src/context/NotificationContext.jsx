import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';

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

  // Mark single notification as read in Firestore
  const markAsRead = async (id) => {
    try {
      const notifRef = doc(db, 'notifications', id);
      await updateDoc(notifRef, {
        isRead: true,
        readAt: new Date().toISOString()
      });
    } catch (e) {
      console.error('Error marking notification read:', e);
    }
  };

  // Mark all as read in Firestore
  const markAllAsRead = async () => {
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
    } catch (e) {
      console.error('Error marking all notifications read:', e);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead
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

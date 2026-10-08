const { db } = require('../config/firebase');

/**
 * Get Notifications for Current User
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const snapshot = await db.collection('notifications')
      .where('userId', '==', userId)
      .limit(50)
      .get();

    const notifications = [];
    let unreadCount = 0;

    snapshot.forEach(doc => {
      const data = { id: doc.id, ...doc.data() };
      notifications.push(data);
      if (!data.isRead) unreadCount++;
    });

    notifications.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return res.json({
      success: true,
      unreadCount,
      notifications
    });
  } catch (error) {
    console.error('GetNotifications Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve notifications.' });
  }
};

/**
 * Mark Single Notification as Read
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const docRef = db.collection('notifications').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    if (doc.data().userId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    await docRef.update({
      isRead: true,
      readAt: new Date().toISOString()
    });

    return res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    console.error('MarkAsRead Error:', error);
    return res.status(500).json({ success: false, message: 'Error updating notification.' });
  }
};

/**
 * Mark All as Read
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const snapshot = await db.collection('notifications')
      .where('userId', '==', userId)
      .where('isRead', '==', false)
      .get();

    const batch = db.batch();
    const now = new Date().toISOString();

    snapshot.forEach(doc => {
      batch.update(doc.ref, { isRead: true, readAt: now });
    });

    await batch.commit();

    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('MarkAllAsRead Error:', error);
    return res.status(500).json({ success: false, message: 'Error marking all notifications as read.' });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};

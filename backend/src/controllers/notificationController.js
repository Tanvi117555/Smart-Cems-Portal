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

/**
 * Delete / Dismiss a single notification
 */
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notifRef = db.collection('notifications').doc(id);
    const doc = await notifRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    if (doc.data().userId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this notification.' });
    }

    await notifRef.delete();

    return res.json({ success: true, message: 'Notification dismissed.' });
  } catch (error) {
    console.error('DeleteNotification Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete notification.' });
  }
};

/**
 * Create announcement / broadcast (Admin or Faculty)
 */
const createAnnouncement = async (req, res) => {
  try {
    const { title, message, type = 'info', eventId, target = 'all' } = req.body;
    const sender = req.user;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required.' });
    }

    const now = new Date().toISOString();
    const batch = db.batch();
    let count = 0;

    if (eventId) {
      // Send announcement to attendees registered for specific event
      const regSnap = await db.collection('registrations')
        .where('eventId', '==', eventId)
        .where('status', 'in', ['confirmed', 'approved', 'pending'])
        .get();

      regSnap.forEach(rDoc => {
        const reg = rDoc.data();
        const nRef = db.collection('notifications').doc();
        batch.set(nRef, {
          userId: reg.studentId,
          title: `📢 Event Update: ${title}`,
          message: message.trim(),
          type: type || 'info',
          link: `/events/${eventId}`,
          isRead: false,
          senderName: sender.name,
          createdAt: now
        });
        count++;
      });
    } else {
      // Broadcast to all active users
      const usersSnap = await db.collection('users').get();
      usersSnap.forEach(uDoc => {
        const u = uDoc.data();
        const nRef = db.collection('notifications').doc();
        batch.set(nRef, {
          userId: u.id || u.uid,
          title: `📣 Campus Announcement: ${title}`,
          message: message.trim(),
          type: type || 'info',
          link: '/events',
          isRead: false,
          senderName: sender.name,
          createdAt: now
        });
        count++;
      });
    }

    await batch.commit();

    return res.status(201).json({
      success: true,
      message: `Announcement successfully broadcasted to ${count} recipient(s).`,
      count
    });
  } catch (error) {
    console.error('CreateAnnouncement Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to broadcast announcement.' });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createAnnouncement
};

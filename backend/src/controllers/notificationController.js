const { db } = require('../config/firebase');

/**
 * Get Notifications for Current User
 */
const getNotifications = async (req, res) => {
  try {
    const userIds = [req.user.id, req.user.uid, req.user.email].filter(Boolean);
    if (req.user.role === 'faculty') userIds.push('faculty-uid', 'faculty-cs-uid', 'kzf23zs6iUXerO8Uaq9lms7km1C3');
    if (req.user.role === 'admin') userIds.push('admin-uid', '2sTo0osVxXPpdX1TABLGP1IRv5S2');
    if (req.user.role === 'student') userIds.push('student-uid', 'xhxp8HvBVgfeWSLp2HTkN29qUeb2');

    const snapshot = await db.collection('notifications').get();

    const notifications = [];
    let unreadCount = 0;

    snapshot.forEach(doc => {
      const data = { id: doc.id, ...doc.data() };
      const matchesUser = userIds.includes(data.userId) || 
        (data.forRole && data.forRole === req.user.role) ||
        (data.targetRole && data.targetRole === req.user.role);

      if (matchesUser) {
        notifications.push(data);
        if (!data.isRead) unreadCount++;
      }
    });

    notifications.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return res.json({
      success: true,
      unreadCount,
      notifications: notifications.slice(0, 50)
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
    const userIds = [req.user.id, req.user.uid, req.user.email].filter(Boolean);
    if (req.user.role === 'faculty') userIds.push('faculty-uid', 'faculty-cs-uid', 'kzf23zs6iUXerO8Uaq9lms7km1C3');
    if (req.user.role === 'admin') userIds.push('admin-uid', '2sTo0osVxXPpdX1TABLGP1IRv5S2');
    if (req.user.role === 'student') userIds.push('student-uid', 'xhxp8HvBVgfeWSLp2HTkN29qUeb2');

    const docRef = db.collection('notifications').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    const nData = doc.data();
    if (!userIds.includes(nData.userId) && req.user.role !== 'admin') {
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
    const userIds = [req.user.id, req.user.uid, req.user.email].filter(Boolean);
    if (req.user.role === 'faculty') userIds.push('faculty-uid', 'faculty-cs-uid', 'kzf23zs6iUXerO8Uaq9lms7km1C3');
    if (req.user.role === 'admin') userIds.push('admin-uid', '2sTo0osVxXPpdX1TABLGP1IRv5S2');
    if (req.user.role === 'student') userIds.push('student-uid', 'xhxp8HvBVgfeWSLp2HTkN29qUeb2');

    const snapshot = await db.collection('notifications').get();
    const batch = db.batch();
    const now = new Date().toISOString();
    let updatedCount = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      if ((userIds.includes(data.userId) || req.user.role === 'admin') && !data.isRead) {
        batch.update(doc.ref, { isRead: true, readAt: now });
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      await batch.commit();
    }

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

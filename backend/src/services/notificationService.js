const { db } = require('../config/firebase');
const { sendEmail } = require('../utils/mailService');

/**
 * Central Notification Service
 * Dispatches in-app Firestore notifications and optional asynchronous emails
 */
const sendNotification = async ({
  userId,
  userEmail = null,
  title,
  message,
  type = 'info', // 'info' | 'success' | 'warning' | 'error'
  link = '/notifications',
  sendEmailAlert = false
}) => {
  try {
    if (!userId) return null;

    const notifData = {
      userId,
      title,
      message,
      type,
      link,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    const notifRef = await db.collection('notifications').add(notifData);

    // Optional Async Email Alert (non-blocking)
    if (sendEmailAlert && userEmail) {
      sendEmail({
        to: userEmail,
        subject: `[Smart CEMS] ${title}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; line-height: 1.6; color: #1e293b;">
            <h2 style="color: #4f46e5; margin-bottom: 8px;">${title}</h2>
            <p>${message}</p>
            <p style="margin-top: 24px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}${link}" 
                 style="background: #4f46e5; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                View in Portal
              </a>
            </p>
            <p style="color: #64748b; font-size: 12px; margin-top: 32px;">
              Smart CEMS — College Event Management System
            </p>
          </div>
        `
      }).catch(err => console.warn('Notification email alert warning:', err.message));
    }

    return { success: true, id: notifRef.id };
  } catch (err) {
    console.warn('⚠️ Notification Service Warning:', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Broadcast notification to all active Administrators
 */
const notifyAdmins = async ({ title, message, link = '/admin/dashboard' }) => {
  try {
    const adminSnap = await db.collection('users').where('role', '==', 'admin').get();
    if (adminSnap.empty) return;

    const batch = db.batch();
    const now = new Date().toISOString();

    adminSnap.forEach(doc => {
      const notifRef = db.collection('notifications').doc();
      batch.set(notifRef, {
        userId: doc.id,
        title,
        message,
        type: 'info',
        link,
        isRead: false,
        createdAt: now
      });
    });

    await batch.commit();
  } catch (err) {
    console.warn('⚠️ NotifyAdmins Warning:', err.message);
  }
};

module.exports = {
  sendNotification,
  notifyAdmins
};

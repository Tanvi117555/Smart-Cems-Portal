const { db } = require('../config/firebase');

/**
 * System Audit Logging Service
 * Records administrative and critical user actions for institutional compliance
 */
const logAudit = async ({
  actorId,
  actorRole = 'system',
  actorName = 'System',
  action,
  entityType,
  entityId,
  details = {}
}) => {
  try {
    const logData = {
      actorId: actorId || 'system',
      actorRole: actorRole || 'system',
      actorName: actorName || 'System',
      action,
      entityType,
      entityId: String(entityId || ''),
      details: typeof details === 'object' ? details : { raw: details },
      timestamp: new Date().toISOString()
    };

    const docRef = await db.collection('auditLogs').add(logData);
    return { success: true, logId: docRef.id };
  } catch (err) {
    console.warn('⚠️ AuditLog Warning: Failed to record audit log:', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Retrieve Audit Logs (Super Admin only)
 */
const getAuditLogs = async ({ limit = 50, action = null, entityType = null } = {}) => {
  try {
    let query = db.collection('auditLogs');

    if (action) {
      query = query.where('action', '==', action);
    }
    if (entityType) {
      query = query.where('entityType', '==', entityType);
    }

    const snapshot = await query.limit(Number(limit) || 50).get();
    const logs = [];
    snapshot.forEach(doc => {
      logs.push({ id: doc.id, ...doc.data() });
    });

    logs.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    return { success: true, logs };
  } catch (err) {
    console.error('GetAuditLogs Error:', err);
    throw err;
  }
};

module.exports = {
  logAudit,
  getAuditLogs
};

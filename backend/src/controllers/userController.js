const { db, auth } = require('../config/firebase');

/**
 * Get All Users with role/status filtering, search, and pagination (Admin)
 */
const getAllUsers = async (req, res) => {
  try {
    const { role, department_id, search, page = 1, limit = 50 } = req.query;

    let queryRef = db.collection('users');

    if (role && role !== 'all') {
      queryRef = queryRef.where('role', '==', role);
    }

    const snapshot = await queryRef.get();
    let users = [];

    snapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });

    if (department_id && department_id !== 'all') {
      users = users.filter(u => u.department_id === department_id || u.departmentId === department_id);
    }

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      users = users.filter(u =>
        (u.name && u.name.toLowerCase().includes(term)) ||
        (u.email && u.email.toLowerCase().includes(term)) ||
        (u.student_id && u.student_id.toLowerCase().includes(term)) ||
        (u.faculty_id && u.faculty_id.toLowerCase().includes(term))
      );
    }

    users.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const total = users.length;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;
    const paginated = users.slice(offset, offset + limitNum);

    return res.json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      users: paginated
    });
  } catch (error) {
    console.error('GetAllUsers Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve users.' });
  }
};

/**
 * Toggle User Status (Active / Inactive / Suspended)
 */
const toggleUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    if (userId === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own admin account.' });
    }

    await db.collection('users').doc(userId).update({
      status,
      updatedAt: new Date().toISOString()
    });

    // Also disable in Firebase Auth if suspended
    try {
      await auth.updateUser(userId, { disabled: status === 'suspended' });
    } catch (e) {
      // Ignored if user not in Auth yet
    }

    return res.json({ success: true, message: `User status changed to ${status}.` });
  } catch (error) {
    console.error('ToggleUserStatus Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update user status.' });
  }
};

/**
 * Delete User (Admin)
 */
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    if (userId === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account.' });
    }

    await db.collection('users').doc(userId).delete();

    try {
      await auth.deleteUser(userId);
    } catch (e) {
      // Non-fatal if user already deleted from Auth
    }

    return res.json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    console.error('DeleteUser Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete user.' });
  }
};

module.exports = {
  getAllUsers,
  toggleUserStatus,
  deleteUser
};

const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createAnnouncement
} = require('../controllers/notificationController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getNotifications);
router.patch('/:id/read', verifyToken, markAsRead);
router.patch('/read-all', verifyToken, markAllAsRead);
router.delete('/:id', verifyToken, deleteNotification);
router.post('/announcement', verifyToken, authorizeRoles('faculty', 'admin'), createAnnouncement);

module.exports = router;

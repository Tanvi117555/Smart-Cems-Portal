const express = require('express');
const router = express.Router();
const { verifyAndCheckIn, getAttendanceStats } = require('../controllers/attendanceController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/check-in', verifyToken, authorizeRoles('faculty', 'admin'), verifyAndCheckIn);
router.get('/stats/:eventId', verifyToken, authorizeRoles('faculty', 'admin'), getAttendanceStats);

module.exports = router;

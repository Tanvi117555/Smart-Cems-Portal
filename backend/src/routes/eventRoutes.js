const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const {
  getEvents,
  getFeaturedEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  approveEvent,
  rejectEvent,
  getMyEvents,
  checkEventConflict,
  checkEligibility,
  getRecommendedEvents,
  getEventCalendarIcs
} = require('../controllers/eventController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Soft auth helper to detect logged-in student for event details
const softAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cems_super_secret_jwt_key_2026_production_grade_token_secure');
      req.user = decoded;
    } catch (e) {
      // Ignore token decode error for public views
    }
  }
  next();
};

const uploadFields = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'qr_code', maxCount: 1 }
]);

// Public & Algorithmic Routes
router.get('/', softAuth, getEvents);
router.get('/featured', getFeaturedEvents);
router.get('/recommendations', softAuth, getRecommendedEvents);
router.get('/my', verifyToken, authorizeRoles('faculty', 'admin'), getMyEvents);

// Conflict check for faculty form helper
router.post('/check-conflict', verifyToken, authorizeRoles('faculty', 'admin'), checkEventConflict);

// Specific Event Routes
router.get('/:id/calendar.ics', getEventCalendarIcs);
router.get('/:id/eligibility', softAuth, checkEligibility);
router.get('/:id', softAuth, getEventById);

// Protected Faculty & Admin Routes
router.post('/', verifyToken, authorizeRoles('faculty', 'admin'), uploadFields, createEvent);
router.put('/:id', verifyToken, authorizeRoles('faculty', 'admin'), uploadFields, updateEvent);
router.delete('/:id', verifyToken, authorizeRoles('faculty', 'admin'), deleteEvent);

// Admin Approval Routes
router.patch('/:id/approve', verifyToken, authorizeRoles('admin'), approveEvent);
router.patch('/:id/reject', verifyToken, authorizeRoles('admin'), rejectEvent);

module.exports = router;

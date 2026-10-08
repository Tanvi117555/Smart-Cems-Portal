const express = require('express');
const router = express.Router();
const {
  registerForEvent,
  joinWaitlist,
  getMyRegistrations,
  getEventParticipants,
  cancelRegistration
} = require('../controllers/registrationController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/', verifyToken, authorizeRoles('student', 'faculty', 'admin'), registerForEvent);
router.post('/waitlist', verifyToken, authorizeRoles('student'), joinWaitlist);
router.get('/my', verifyToken, getMyRegistrations);
router.get('/event/:eventId', verifyToken, authorizeRoles('faculty', 'admin'), getEventParticipants);
router.patch('/:id/cancel', verifyToken, cancelRegistration);

module.exports = router;

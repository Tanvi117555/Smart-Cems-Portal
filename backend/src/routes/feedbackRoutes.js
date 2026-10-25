const express = require('express');
const router = express.Router();
const {
  getFeedbackForm,
  saveFeedbackForm,
  submitFeedbackResponse,
  getFeedbackAnalytics
} = require('../controllers/feedbackController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// Form retrieval aliases
router.get('/event/:eventId', verifyToken, getFeedbackForm);
router.get('/forms/:eventId', verifyToken, getFeedbackForm);

// Form creation/update aliases (Faculty / Admin)
router.post('/', verifyToken, authorizeRoles('faculty', 'admin'), saveFeedbackForm);
router.post('/forms', verifyToken, authorizeRoles('faculty', 'admin'), saveFeedbackForm);

// Student Response submission aliases
router.post('/response', verifyToken, authorizeRoles('student'), submitFeedbackResponse);
router.post('/responses', verifyToken, authorizeRoles('student'), submitFeedbackResponse);
router.post('/submit', verifyToken, authorizeRoles('student'), submitFeedbackResponse);

// Analytics / Results retrieval aliases (Faculty / Admin)
router.get('/analytics/:eventId', verifyToken, authorizeRoles('faculty', 'admin'), getFeedbackAnalytics);
router.get('/results/:eventId', verifyToken, authorizeRoles('faculty', 'admin'), getFeedbackAnalytics);

module.exports = router;

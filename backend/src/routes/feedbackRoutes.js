const express = require('express');
const router = express.Router();
const {
  getFeedbackForm,
  saveFeedbackForm,
  submitFeedbackResponse,
  getFeedbackAnalytics
} = require('../controllers/feedbackController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/event/:eventId', verifyToken, getFeedbackForm);
router.post('/', verifyToken, authorizeRoles('faculty', 'admin'), saveFeedbackForm);
router.post('/response', verifyToken, authorizeRoles('student'), submitFeedbackResponse);
router.get('/analytics/:eventId', verifyToken, authorizeRoles('faculty', 'admin'), getFeedbackAnalytics);

module.exports = router;

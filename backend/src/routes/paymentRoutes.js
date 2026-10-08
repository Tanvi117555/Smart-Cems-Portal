const express = require('express');
const router = express.Router();
const {
  submitPayment,
  verifyPayment,
  rejectPayment,
  getAllPayments
} = require('../controllers/paymentController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/', verifyToken, authorizeRoles('student'), upload.single('screenshot'), submitPayment);
router.patch('/:id/verify', verifyToken, authorizeRoles('faculty', 'admin'), verifyPayment);
router.patch('/:id/reject', verifyToken, authorizeRoles('faculty', 'admin'), rejectPayment);
router.get('/', verifyToken, authorizeRoles('admin'), getAllPayments);

module.exports = router;

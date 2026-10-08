const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, setUserRole } = require('../controllers/authController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyToken, getMe);
router.put('/profile', verifyToken, updateProfile);
router.post('/set-role', verifyToken, authorizeRoles('admin'), setUserRole);

module.exports = router;

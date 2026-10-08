const express = require('express');
const router = express.Router();
const { getAllUsers, toggleUserStatus, deleteUser } = require('../controllers/userController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/', verifyToken, authorizeRoles('admin'), getAllUsers);
router.patch('/:id/status', verifyToken, authorizeRoles('admin'), toggleUserStatus);
router.delete('/:id', verifyToken, authorizeRoles('admin'), deleteUser);

module.exports = router;

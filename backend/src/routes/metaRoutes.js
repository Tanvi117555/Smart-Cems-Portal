const express = require('express');
const router = express.Router();
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getAdminDashboardStats,
  getSystemAuditLogs
} = require('../controllers/metaController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// Categories
router.get('/categories', getCategories);
router.post('/categories', verifyToken, authorizeRoles('admin'), createCategory);
router.put('/categories/:id', verifyToken, authorizeRoles('admin'), updateCategory);
router.delete('/categories/:id', verifyToken, authorizeRoles('admin'), deleteCategory);

// Departments
router.get('/departments', getDepartments);
router.post('/departments', verifyToken, authorizeRoles('admin'), createDepartment);
router.put('/departments/:id', verifyToken, authorizeRoles('admin'), updateDepartment);
router.delete('/departments/:id', verifyToken, authorizeRoles('admin'), deleteDepartment);

// Admin Dashboard Analytics
router.get('/analytics/dashboard', getAdminDashboardStats);
router.get('/dashboard/admin', getAdminDashboardStats);

// System Audit Logs
router.get('/audit-logs', verifyToken, authorizeRoles('admin'), getSystemAuditLogs);

module.exports = router;

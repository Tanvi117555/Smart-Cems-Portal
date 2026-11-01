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

// Root handler for when router is mounted at /categories, /departments, etc.
router.get('/', (req, res, next) => {
  const url = (req.baseUrl || '') + (req.originalUrl || '');
  if (url.includes('categor')) return getCategories(req, res, next);
  if (url.includes('depart')) return getDepartments(req, res, next);
  return getAdminDashboardStats(req, res, next);
});

// Categories
router.get('/categories', getCategories);
router.get('/meta/categories', getCategories);
router.post('/categories', verifyToken, authorizeRoles('admin'), createCategory);
router.post('/meta/categories', verifyToken, authorizeRoles('admin'), createCategory);
router.put('/categories/:id', verifyToken, authorizeRoles('admin'), updateCategory);
router.put('/meta/categories/:id', verifyToken, authorizeRoles('admin'), updateCategory);
router.delete('/categories/:id', verifyToken, authorizeRoles('admin'), deleteCategory);
router.delete('/meta/categories/:id', verifyToken, authorizeRoles('admin'), deleteCategory);

// Departments
router.get('/departments', getDepartments);
router.get('/meta/departments', getDepartments);
router.post('/departments', verifyToken, authorizeRoles('admin'), createDepartment);
router.post('/meta/departments', verifyToken, authorizeRoles('admin'), createDepartment);
router.put('/departments/:id', verifyToken, authorizeRoles('admin'), updateDepartment);
router.put('/meta/departments/:id', verifyToken, authorizeRoles('admin'), updateDepartment);
router.delete('/departments/:id', verifyToken, authorizeRoles('admin'), deleteDepartment);
router.delete('/meta/departments/:id', verifyToken, authorizeRoles('admin'), deleteDepartment);

// Admin Dashboard Analytics
router.get('/analytics/dashboard', getAdminDashboardStats);
router.get('/meta/analytics/dashboard', getAdminDashboardStats);
router.get('/dashboard', getAdminDashboardStats);
router.get('/dashboard/admin', getAdminDashboardStats);
router.get('/meta/dashboard/admin', getAdminDashboardStats);

// System Audit Logs
router.get('/audit-logs', verifyToken, authorizeRoles('admin'), getSystemAuditLogs);
router.get('/meta/audit-logs', verifyToken, authorizeRoles('admin'), getSystemAuditLogs);

module.exports = router;

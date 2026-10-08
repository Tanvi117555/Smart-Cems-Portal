const express = require('express');
const router = express.Router();
const {
  generateCertificatesForEvent,
  verifyCertificate,
  getMyCertificates,
  downloadCertificatePDF
} = require('../controllers/certificateController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/generate', verifyToken, authorizeRoles('faculty', 'admin'), generateCertificatesForEvent);
router.get('/my', verifyToken, authorizeRoles('student'), getMyCertificates);
router.get('/download/:certificateId', downloadCertificatePDF);
// Public verification route
router.get('/verify/:certificateId', verifyCertificate);

module.exports = router;

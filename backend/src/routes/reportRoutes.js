const express = require('express');
const router = express.Router();
const {
  getEventReportPDF,
  getRegistrationTicketPDF,
  exportParticipantsExcel,
  exportParticipantsCSV
} = require('../controllers/reportController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/event/:eventId', verifyToken, authorizeRoles('faculty', 'admin'), getEventReportPDF);
router.get('/receipt/:regId', verifyToken, getRegistrationTicketPDF);
router.get('/export/excel/:eventId', verifyToken, authorizeRoles('faculty', 'admin'), exportParticipantsExcel);
router.get('/export/csv/:eventId', verifyToken, authorizeRoles('faculty', 'admin'), exportParticipantsCSV);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  uploadGalleryImages,
  getEventGallery,
  getGlobalGallery,
  deleteGalleryImage
} = require('../controllers/galleryController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/global', getGlobalGallery);
router.get('/:eventId', getEventGallery);
router.post('/upload', verifyToken, authorizeRoles('faculty', 'admin'), upload.array('images', 10), uploadGalleryImages);
router.delete('/:id', verifyToken, authorizeRoles('faculty', 'admin'), deleteGalleryImage);

module.exports = router;

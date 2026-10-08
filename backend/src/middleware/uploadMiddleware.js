const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload folders exist
const baseUploadDir = path.join(__dirname, '../../uploads');
const folders = ['events', 'gallery', 'payments', 'qr', 'avatars'];

folders.forEach(folder => {
  const dir = path.join(baseUploadDir, folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subfolder = 'events';
    if (req.originalUrl.includes('gallery')) {
      subfolder = 'gallery';
    } else if (req.originalUrl.includes('payment')) {
      subfolder = 'payments';
    } else if (file.fieldname === 'qr_code' || file.fieldname === 'qr_code_image') {
      subfolder = 'qr';
    } else if (file.fieldname === 'avatar') {
      subfolder = 'avatars';
    }
    cb(null, path.join(baseUploadDir, subfolder));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitizedBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${sanitizedBase}-${uniqueSuffix}${ext}`);
  }
});

// File validation
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();

  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

  if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and WEBP image formats are supported.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 8 * 1024 * 1024 // 8 MB limit
  }
});

module.exports = upload;

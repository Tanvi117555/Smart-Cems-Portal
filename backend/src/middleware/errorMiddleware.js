const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Server Error:', err);

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'Uploaded file exceeds the maximum 8MB size limit.' });
    }
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  }

  // Handle custom file filter error
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({ success: false, message: err.message });
  }

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { errorHandler };

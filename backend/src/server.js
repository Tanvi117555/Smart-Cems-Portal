const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const { errorHandler } = require('./middleware/errorMiddleware');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const galleryRoutes = require('./routes/galleryRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');
const metaRoutes = require('./routes/metaRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Utility Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(s => s.trim()) : [])
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests, same-origin, or whitelisted origins
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static File Serving for local uploaded assets with subfolder auto-resolution
const uploadsDir = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));
const uploadSubdirs = ['events', 'gallery', 'payments', 'qr', 'avatars'];
uploadSubdirs.forEach(sub => {
  app.use(`/uploads/${sub}`, express.static(path.join(uploadsDir, sub)));
});
// Fallback for root /uploads/:filename
app.use('/uploads/:filename', (req, res, next) => {
  const filename = req.params.filename;
  const fs = require('fs');
  for (const sub of uploadSubdirs) {
    const candidate = path.join(uploadsDir, sub, filename);
    if (fs.existsSync(candidate)) {
      return res.sendFile(candidate);
    }
  }
  next();
});

// Helper to register routes under both /api and root /
const registerRoutes = (prefix = '') => {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/events`, eventRoutes);
  app.use(`${prefix}/registrations`, registrationRoutes);
  app.use(`${prefix}/payments`, paymentRoutes);
  app.use(`${prefix}/attendance`, attendanceRoutes);
  app.use(`${prefix}/feedback`, feedbackRoutes);
  app.use(`${prefix}/certificates`, certificateRoutes);
  app.use(`${prefix}/gallery`, galleryRoutes);
  app.use(`${prefix}/notifications`, notificationRoutes);
  app.use(`${prefix}/reports`, reportRoutes);
  app.use(`${prefix}/users`, userRoutes);
  app.use(`${prefix}/meta`, metaRoutes);
  app.use(`${prefix}/categories`, metaRoutes);
  app.use(`${prefix}/departments`, metaRoutes);
  app.use(`${prefix}/analytics`, metaRoutes);
  if (prefix) {
    app.use(prefix, metaRoutes);
  }
};

// Mount at /api (standard frontend API baseUrl) and root (direct requests / proxies)
registerRoutes('/api');
registerRoutes('');

// Health Check Endpoint
const healthCheck = (req, res) => {
  res.json({
    status: 'ok',
    service: 'Smart CEMS API',
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString()
  });
};
app.get('/api/health', healthCheck);
app.get('/health', healthCheck);

// Centralized Error Handling
app.use(errorHandler);

// Standalone Server Execution
if (process.env.NODE_ENV !== 'test' && !process.env.FUNCTION_TARGET) {
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Smart CEMS Backend Server running on http://localhost:${PORT}`);
    console.log(`🎓 "Plan. Participate. Celebrate." — Powered by Firebase`);
    console.log(`======================================================\n`);

    // Verify and seed database with 10+ realistic events on startup
    try {
      const { seedInitialData } = require('./scripts/seedEvents');
      seedInitialData().catch(err => console.warn('Automatic seeding note:', err.message));
    } catch (e) {
      console.warn('Initial seeding script note:', e.message);
    }
  });
}

// Export Express App & Firebase Cloud Functions Handler
let cloudFunctionHandler = null;
try {
  const { onRequest } = require('firebase-functions/v2/https');
  cloudFunctionHandler = onRequest({ cors: true, maxInstances: 10 }, app);
} catch (e) {
  // If firebase-functions runtime is not in cloud context
}

module.exports = app;
module.exports.api = cloudFunctionHandler || app;

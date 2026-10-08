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

// Static File Serving for local legacy uploaded assets
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/meta', metaRoutes);
app.use('/api', metaRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Smart CEMS API',
    environment: process.env.NODE_ENV || 'production'
  });
});

// Centralized Error Handling
app.use(errorHandler);

// Standalone Server Execution
if (process.env.NODE_ENV !== 'test' && !process.env.FUNCTION_TARGET) {
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Smart CEMS Backend Server running on http://localhost:${PORT}`);
    console.log(`🎓 "Plan. Participate. Celebrate." — Powered by Firebase`);
    console.log(`======================================================\n`);
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

const { auth, db } = require('../config/firebase');

/**
 * Verify Firebase ID Token
 * Supports Authorization Bearer header AND ?token= query parameter for PDF downloads
 */
const verifyToken = async (req, res, next) => {
  try {
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.'
      });
    }

    // Verify token with Firebase Auth, or fallback to signed backend JWT
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (verifyError) {
      try {
        const jwt = require('jsonwebtoken');
        decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'cems_super_secret_jwt_key_2026_production_grade_token_secure');
      } catch (jwtErr) {
        if (verifyError.code === 'auth/id-token-expired') {
          return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
        }
        return res.status(401).json({ success: false, message: 'Invalid or forged authentication token.' });
      }
    }

    // Retrieve user document from Firestore to ensure active status and latest role
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      return res.status(401).json({ success: false, message: 'User account record not found in system.' });
    }

    const userData = userDoc.data();

    if (userData.status === 'suspended' || userData.status === 'inactive') {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact campus admin.' });
    }

    // Custom claims role takes precedence, with Firestore document fallback
    const role = decodedToken.role || userData.role || 'student';

    req.user = {
      id: decodedToken.uid,
      uid: decodedToken.uid,
      email: decodedToken.email || userData.email,
      name: userData.name || decodedToken.name || 'User',
      role,
      department_id: userData.department_id || userData.departmentId || null,
      department_name: userData.department_name || userData.departmentName || null,
      ...userData
    };

    next();
  } catch (error) {
    console.error('VerifyToken Error:', error);
    return res.status(500).json({ success: false, message: 'Authentication verification failure.' });
  }
};

/**
 * Role-Based Access Control (RBAC)
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Persona '${req.user.role}' is not authorized for this resource.`
      });
    }

    next();
  };
};

module.exports = {
  verifyToken,
  authorizeRoles
};

const { auth, db } = require('../config/firebase');

/**
 * Register user metadata and assign Firebase Auth custom claims
 */
const register = async (req, res) => {
  try {
    const {
      uid,
      name,
      email,
      role = 'student',
      phone,
      department_id,
      department_name,
      student_id,
      year,
      faculty_id,
      designation
    } = req.body;

    if (!email || !name) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }

    if (role === 'admin') {
      return res.status(403).json({ success: false, message: 'Administrator accounts cannot be self-registered.' });
    }

    let targetUid = uid;

    // If password was supplied and no client-created UID, create user via Firebase Admin
    if (!targetUid && req.body.password) {
      const userRecord = await auth.createUser({
        email: email.toLowerCase().trim(),
        password: req.body.password,
        displayName: name.trim()
      });
      targetUid = userRecord.uid;
    }

    if (!targetUid) {
      return res.status(400).json({ success: false, message: 'User ID (UID) is required.' });
    }

    // Set Custom Claims for RBAC
    await auth.setCustomUserClaims(targetUid, { role });

    // Store in Firestore `users/{uid}`
    const userData = {
      uid: targetUid,
      id: targetUid,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role,
      phone: phone || null,
      department_id: department_id || null,
      department_name: department_name || null,
      status: 'active',
      avatar: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (role === 'student') {
      userData.student_id = student_id || `STU-${Date.now().toString().slice(-6)}`;
      userData.year = year || '1st Year';
    } else if (role === 'faculty') {
      userData.faculty_id = faculty_id || `FAC-${Date.now().toString().slice(-6)}`;
      userData.designation = designation || 'Assistant Professor';
    }

    await db.collection('users').doc(targetUid).set(userData, { merge: true });

    return res.status(201).json({
      success: true,
      message: 'Account registered and profile provisioned successfully.',
      user: userData
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error registering account.' });
  }
};

/**
 * Sync / verify current authenticated user session
 */
const getMe = async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.id).get();
    let userData;
    if (!userDoc.exists) {
      userData = {
        uid: req.user.id,
        id: req.user.id,
        email: req.user.email,
        name: req.user.name || req.user.email.split('@')[0],
        role: req.user.role || 'student',
        status: 'active',
        createdAt: new Date().toISOString()
      };
      await db.collection('users').doc(req.user.id).set(userData, { merge: true });
    } else {
      userData = userDoc.data();
    }

    return res.json({
      success: true,
      user: userData
    });
  } catch (error) {
    console.error('GetMe Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve profile.' });
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, department_id, department_name, avatar, year, designation } = req.body;

    const updates = {
      updatedAt: new Date().toISOString()
    };

    if (name) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone;
    if (department_id !== undefined) updates.department_id = department_id;
    if (department_name !== undefined) updates.department_name = department_name;
    if (avatar !== undefined) updates.avatar = avatar;
    if (year !== undefined) updates.year = year;
    if (designation !== undefined) updates.designation = designation;

    await db.collection('users').doc(userId).update(updates);

    const updatedDoc = await db.collection('users').doc(userId).get();

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedDoc.data()
    });
  } catch (error) {
    console.error('UpdateProfile Error:', error);
    return res.status(500).json({ success: false, message: 'Error updating profile.' });
  }
};

/**
 * Admin: Assign or change a user's role
 */
const setUserRole = async (req, res) => {
  try {
    const { userId, role } = req.body;

    if (!['admin', 'faculty', 'student'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }

    // Set custom claim
    await auth.setCustomUserClaims(userId, { role });

    // Update Firestore user document
    await db.collection('users').doc(userId).update({
      role,
      updatedAt: new Date().toISOString()
    });

    return res.json({
      success: true,
      message: `User role successfully assigned to ${role}.`
    });
  } catch (error) {
    console.error('SetUserRole Error:', error);
    return res.status(500).json({ success: false, message: 'Error updating user role.' });
  }
};

/**
 * Authenticate and issue Firebase Custom Token
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email required.' });
    }

    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email.trim());
    } catch (e) {
      return res.status(401).json({ success: false, message: 'No account found with this email.' });
    }

    // Get user document from Firestore
    let userDoc = await db.collection('users').doc(userRecord.uid).get();
    let userData = userDoc.exists ? userDoc.data() : {
      uid: userRecord.uid,
      id: userRecord.uid,
      email: userRecord.email,
      name: userRecord.displayName || userRecord.email.split('@')[0],
      role: (userRecord.customClaims && userRecord.customClaims.role) || 'student'
    };

    const role = (userRecord.customClaims && userRecord.customClaims.role) || userData.role || 'student';

    // Generate Firebase Custom Token
    const customToken = await auth.createCustomToken(userRecord.uid, { role });
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { uid: userRecord.uid, id: userRecord.uid, email: userRecord.email, role },
      process.env.JWT_SECRET || 'cems_super_secret_jwt_key_2026_production_grade_token_secure',
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      customToken,
      token,
      user: {
        ...userData,
        role
      }
    });
  } catch (error) {
    console.error('Login Endpoint Error:', error);
    return res.status(500).json({ success: false, message: 'Error processing login.' });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  setUserRole
};

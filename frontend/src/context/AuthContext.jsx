import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signInWithEmailAndPassword,
  signInWithCustomToken,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync auth state with Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setFirebaseUser(currentUser);
        try {
          const idToken = await currentUser.getIdToken();
          localStorage.setItem('cems_token', idToken);

          // Get Custom Claims (Role)
          const tokenResult = await currentUser.getIdTokenResult(true);
          let userRole = tokenResult.claims.role;

          // Fetch profile data: First try backend Admin SDK (/auth/me), fallback to client Firestore or token claims
          let profileData = {};
          try {
            const meRes = await api.get('/auth/me');
            if (meRes && meRes.success && meRes.user) {
              profileData = meRes.user;
              if (!userRole) userRole = profileData.role;
            }
          } catch (backendErr) {
            try {
              const userDocRef = doc(db, 'users', currentUser.uid);
              const userDocSnap = await getDoc(userDocRef);
              if (userDocSnap.exists()) {
                profileData = userDocSnap.data();
                if (!userRole) userRole = profileData.role;
              }
            } catch (firestoreErr) {
              console.warn('Firestore client rule prevented direct getDoc, using custom claims');
            }
          }

          // Fallback role resolution
          if (!userRole) {
            if (currentUser.email === 'admin@cems.edu') userRole = 'admin';
            else if (currentUser.email.includes('faculty')) userRole = 'faculty';
            else userRole = profileData.role || 'student';
          }

          setRole(userRole);
          const fullUser = {
            uid: currentUser.uid,
            id: currentUser.uid,
            email: currentUser.email,
            emailVerified: currentUser.emailVerified,
            name: profileData.name || currentUser.displayName || currentUser.email.split('@')[0],
            ...profileData,
            role: userRole
          };
          setUser(fullUser);
          localStorage.setItem('cems_user', JSON.stringify(fullUser));
        } catch (err) {
          console.error('Error synchronizing user session:', err);
          // Don't log out if user has valid Firebase credentials
          const fallbackRole = currentUser.email === 'admin@cems.edu' ? 'admin' : (currentUser.email.includes('faculty') ? 'faculty' : 'student');
          const fallbackUser = {
            uid: currentUser.uid,
            id: currentUser.uid,
            email: currentUser.email,
            name: currentUser.displayName || currentUser.email.split('@')[0],
            role: fallbackRole
          };
          setRole(fallbackRole);
          setUser(fallbackUser);
          localStorage.setItem('cems_user', JSON.stringify(fallbackUser));
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
        setRole(null);
        localStorage.removeItem('cems_token');
        localStorage.removeItem('cems_user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Login
  const login = async (email, password) => {
    // 1. Try direct Firebase Client SDK sign in
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      return userCredential.user;
    } catch (err) {
      console.warn('Direct Firebase Auth sign in failed, trying backend login bridge:', err.code || err.message);

      // 2. Try Backend Login Bridge (generates Firebase Custom Token via Admin SDK)
      try {
        const backendLoginRes = await api.post('/auth/login', { email: email.trim(), password });
        if (backendLoginRes && backendLoginRes.success && backendLoginRes.customToken) {
          const customUserCred = await signInWithCustomToken(auth, backendLoginRes.customToken);
          return customUserCred.user;
        }
      } catch (backendErr) {
        console.warn('Backend login fallback error:', backendErr.message);
      }

      // 3. User friendly error
      let userFriendlyMessage = 'Invalid email or password.';
      if (err.code === 'auth/user-not-found') userFriendlyMessage = 'No account exists with this email.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') userFriendlyMessage = 'Incorrect password or invalid credentials.';
      if (err.code === 'auth/too-many-requests') userFriendlyMessage = 'Too many failed attempts. Try again later.';
      throw new Error(userFriendlyMessage);
    }
  };

  // Register
  const register = async (formData) => {
    const { email, password, name, role: requestedRole = 'student', ...extra } = formData;
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid = userCredential.user.uid;

      // 2. Provision profile through backend / Firestore with role custom claim
      try {
        await api.post('/auth/register', {
          uid,
          email,
          name,
          role: requestedRole,
          ...extra
        });
      } catch (backendErr) {
        // Fallback: write directly to Firestore
        await setDoc(doc(db, 'users', uid), {
          uid,
          id: uid,
          email,
          name,
          role: requestedRole,
          status: 'active',
          createdAt: new Date().toISOString(),
          ...extra
        }, { merge: true });
      }

      // Send verification email
      try {
        await sendEmailVerification(userCredential.user);
      } catch (e) {
        // Ignore in local environments
      }

      return userCredential.user;
    } catch (err) {
      let msg = err.message || 'Registration failed.';
      if (err.code === 'auth/email-already-in-use') msg = 'An account with this email already exists.';
      if (err.code === 'auth/weak-password') msg = 'Password should be at least 6 characters.';
      throw new Error(msg);
    }
  };

  // Logout
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Logout error:', e);
    } finally {
      setUser(null);
      setFirebaseUser(null);
      setRole(null);
      localStorage.removeItem('cems_token');
      localStorage.removeItem('cems_user');
    }
  }, []);

  // Forgot Password
  const forgotPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return true;
    } catch (err) {
      let msg = 'Failed to send password reset email.';
      if (err.code === 'auth/user-not-found') msg = 'No account found with this email.';
      throw new Error(msg);
    }
  };

  // Update local user state
  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedFields };
      localStorage.setItem('cems_user', JSON.stringify(merged));
      return merged;
    });
  };

  // Helper for dashboard redirect paths
  const getDashboardPath = (targetRole) => {
    const current = targetRole || role;
    if (current === 'admin') return '/admin/dashboard';
    if (current === 'faculty') return '/faculty/dashboard';
    return '/student/dashboard';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        role,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        forgotPassword,
        updateUser,
        getDashboardPath
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

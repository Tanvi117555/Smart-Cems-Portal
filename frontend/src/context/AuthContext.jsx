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
  // Read immediate cached user to eliminate blank/loading delay on app start
  const cachedUser = (() => {
    try {
      const stored = localStorage.getItem('cems_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const [user, setUser] = useState(cachedUser);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [role, setRole] = useState(cachedUser?.role || null);
  // If we already have a cached session, don't block UI with full-page spinner
  const [loading, setLoading] = useState(!cachedUser);

  // Sync auth state with Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setFirebaseUser(currentUser);
        try {
          const idToken = await currentUser.getIdToken();
          localStorage.setItem('cems_token', idToken);

          // Get Custom Claims (Role) quickly without forcing expensive server refresh unless necessary
          const tokenResult = await currentUser.getIdTokenResult(false);
          let userRole = tokenResult.claims?.role;

          // Quick timeout helper (max 2 seconds) so cold/slow backends never freeze the UI
          const fetchWithTimeout = (promise, ms = 2000) => {
            return Promise.race([
              promise,
              new Promise((_, reject) => setTimeout(() => reject(new Error('Auth sync timeout')), ms))
            ]);
          };

          // Fetch profile data: First try backend Admin SDK (/auth/me), fallback to client Firestore or token claims
          let profileData = {};
          try {
            const meRes = await fetchWithTimeout(api.get('/auth/me'), 2000);
            if (meRes && meRes.success && meRes.user) {
              profileData = meRes.user;
              if (!userRole) userRole = profileData.role;
            }
          } catch (backendErr) {
            try {
              const userDocRef = doc(db, 'users', currentUser.uid);
              const userDocSnap = await fetchWithTimeout(getDoc(userDocRef), 2000);
              if (userDocSnap.exists()) {
                profileData = userDocSnap.data();
                if (!userRole) userRole = profileData.role;
              }
            } catch (firestoreErr) {
              // Fallback to token claims or email heuristic
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
          console.warn('Fast auth synchronization fallback used:', err.message);
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
        } finally {
          setLoading(false);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
        setRole(null);
        localStorage.removeItem('cems_token');
        localStorage.removeItem('cems_user');
        setLoading(false);
      }
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

      // 2. Try Backend Login Bridge (generates Firebase Custom Token via Admin SDK or JWT)
      try {
        const backendLoginRes = await api.post('/auth/login', { email: email.trim(), password });
        if (backendLoginRes && backendLoginRes.success) {
          if (backendLoginRes.customToken) {
            try {
              const customUserCred = await signInWithCustomToken(auth, backendLoginRes.customToken);
              return customUserCred.user;
            } catch (tokenErr) {
              console.warn('signInWithCustomToken offline fallback:', tokenErr.message);
            }
          }

          if (backendLoginRes.token && backendLoginRes.user) {
            const loggedUser = backendLoginRes.user;
            localStorage.setItem('cems_token', backendLoginRes.token);
            localStorage.setItem('cems_user', JSON.stringify(loggedUser));
            setUser(loggedUser);
            setRole(loggedUser.role);
            return loggedUser;
          }
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

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Verifying security credentials...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const currentRole = role || user.role;

  if (allowedRoles.length > 0 && !allowedRoles.includes(currentRole)) {
    if (currentRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (currentRole === 'faculty') return <Navigate to="/faculty/dashboard" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }

  return children;
};

export const AdminRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['admin']}>
    {children}
  </ProtectedRoute>
);

export const FacultyRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['faculty', 'admin']}>
    {children}
  </ProtectedRoute>
);

export const StudentRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['student']}>
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;

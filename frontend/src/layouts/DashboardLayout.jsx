import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import { useAuth } from '../context/AuthContext';
import { Menu, X } from 'lucide-react';

const DashboardLayout = ({ allowedRoles = [] }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-navy-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading CEMS Portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 shrink-0 rounded-3xl overflow-hidden glass-panel shadow-sm border border-slate-200/80 dark:border-slate-800">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Toggle & Drawer */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative w-64 max-w-xs flex-1 flex flex-col bg-white dark:bg-navy-900 z-50 shadow-2xl">
              <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                <span className="text-sm font-bold">Navigation Menu</span>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-navy-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <Sidebar isMobile onClose={() => setMobileSidebarOpen(false)} />
              </div>
            </div>
          </div>
        )}

        {/* Main Dashboard Content Area */}
        <main className="flex-1 min-w-0">
          {/* Mobile Sidebar Opener Button */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <Menu className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              Menu Navigation
            </button>
          </div>

          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

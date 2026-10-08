import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';
import { ProtectedRoute, AdminRoute, FacultyRoute, StudentRoute } from './components/common/ProtectedRoute';

// Public Pages
import Home from './pages/public/Home';
import EventsDiscovery from './pages/public/EventsDiscovery';
import EventDetails from './pages/public/EventDetails';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import VerifyCertificate from './pages/public/VerifyCertificate';
import NotFound from './pages/public/NotFound';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import MyRegistrations from './pages/student/MyRegistrations';
import RegistrationSuccess from './pages/student/RegistrationSuccess';
import StudentFeedback from './pages/student/StudentFeedback';
import MyCertificates from './pages/student/MyCertificates';

// Faculty Pages
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import MyEvents from './pages/faculty/MyEvents';
import CreateEvent from './pages/faculty/CreateEvent';
import EventParticipants from './pages/faculty/EventParticipants';
import FacultyFeedback from './pages/faculty/FacultyFeedback';
import EventGalleryManager from './pages/faculty/EventGalleryManager';
import FacultyReports from './pages/faculty/FacultyReports';
import QRScannerPage from './pages/faculty/QRScannerPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEvents from './pages/admin/AdminEvents';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDepartments from './pages/admin/AdminDepartments';
import AdminCategories from './pages/admin/AdminCategories';
import AdminPayments from './pages/admin/AdminPayments';
import AdminReports from './pages/admin/AdminReports';

// Shared Pages
import ProfilePage from './pages/shared/ProfilePage';
import NotificationsPage from './pages/shared/NotificationsPage';

function App() {
  return (
    <Routes>
      {/* Public Pages wrapped in MainLayout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<EventsDiscovery />} />
        <Route path="/events/:id" element={<EventDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-certificate/:certificateId" element={<VerifyCertificate />} />
        <Route path="/404" element={<NotFound />} />
      </Route>

      {/* Student Portal (Role: student) */}
      <Route
        path="/student"
        element={
          <StudentRoute>
            <DashboardLayout />
          </StudentRoute>
        }
      >
        <Route index element={<Navigate to="/student/dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="registrations" element={<MyRegistrations />} />
        <Route path="certificates" element={<MyCertificates />} />
        <Route path="registration-success/:regId" element={<RegistrationSuccess />} />
        <Route path="feedback" element={<StudentFeedback />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* Faculty Portal (Role: faculty, admin) */}
      <Route
        path="/faculty"
        element={
          <FacultyRoute>
            <DashboardLayout />
          </FacultyRoute>
        }
      >
        <Route index element={<Navigate to="/faculty/dashboard" replace />} />
        <Route path="dashboard" element={<FacultyDashboard />} />
        <Route path="events" element={<MyEvents />} />
        <Route path="events/create" element={<CreateEvent />} />
        <Route path="events/:id/edit" element={<CreateEvent isEdit={true} />} />
        <Route path="events/:id/participants" element={<EventParticipants />} />
        <Route path="scan-qr" element={<QRScannerPage />} />
        <Route path="events/:id/feedback" element={<FacultyFeedback />} />
        <Route path="events/:id/gallery" element={<EventGalleryManager />} />
        <Route path="reports" element={<FacultyReports />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* Admin Portal (Role: admin) */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <DashboardLayout />
          </AdminRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="events" element={<AdminEvents />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="departments" element={<AdminDepartments />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* Global Authenticated User Routes (Accessible from Navbar & Sidebar) */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>

      {/* Catch-all 404 */}
      <Route element={<MainLayout />}>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;

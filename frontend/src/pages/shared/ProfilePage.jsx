import React, { useState } from 'react';
import { 
  User, Mail, Phone, Building2, Lock, Shield, 
  Camera, Check, Loader2, KeyRound, CheckCircle2, GraduationCap, Briefcase, Calendar
} from 'lucide-react';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import Badge from '../../components/common/Badge';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const toast = useToast();

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    year: user?.year || '1st Year',
    designation: user?.designation || 'Assistant Professor'
  });
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passLoading, setPassLoading] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.warning('Profile photo must be less than 5MB');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileData.name.trim()) {
      toast.warning('Name is required');
      return;
    }

    setProfileLoading(true);
    try {
      let avatarUrl = user?.avatar || '';

      // Upload avatar to Firebase Cloud Storage if a new file was chosen
      if (avatarFile && user?.uid) {
        try {
          const storageRef = ref(storage, `users/${user.uid}/avatar/${Date.now()}_${avatarFile.name}`);
          const uploadSnapshot = await uploadBytes(storageRef, avatarFile);
          avatarUrl = await getDownloadURL(uploadSnapshot.ref);
        } catch (storageErr) {
          console.warn('Storage upload warning, continuing with profile update:', storageErr);
        }
      }

      const payload = {
        name: profileData.name.trim(),
        phone: profileData.phone.trim(),
        year: profileData.year,
        designation: profileData.designation,
        ...(avatarUrl && { avatar: avatarUrl })
      };

      const res = await api.put('/auth/profile', payload);

      if (res.success) {
        toast.success('Profile updated successfully!');
        updateUser(res.user || payload);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passData.currentPassword || !passData.newPassword) {
      toast.warning('Please enter both current and new passwords');
      return;
    }
    if (passData.newPassword.length < 6) {
      toast.warning('New password must be at least 6 characters long');
      return;
    }
    if (passData.newPassword !== passData.confirmPassword) {
      toast.warning('New passwords do not match');
      return;
    }

    setPassLoading(true);
    try {
      // Re-authenticate user with Firebase Auth credentials
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.email) {
        const credential = EmailAuthProvider.credential(currentUser.email, passData.currentPassword);
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, passData.newPassword);
        toast.success('Password updated successfully!');
        setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error('Session expired. Please sign in again.');
      }
    } catch (err) {
      let msg = 'Failed to update password.';
      if (err.code === 'auth/wrong-password') msg = 'Current password is incorrect.';
      if (err.code === 'auth/weak-password') msg = 'Password should be at least 6 characters.';
      toast.error(msg);
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
          <User className="w-7 h-7 text-brand-600 dark:text-brand-400" />
          My Institutional Profile
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your university identity, contact details, and account security.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="card p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-gradient-to-r from-brand-500/5 via-indigo-500/5 to-purple-500/5">
        <div className="relative group">
          <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-brand-500/30 shadow-md bg-gradient-brand text-white font-bold text-3xl flex items-center justify-center">
            {avatarPreview ? (
              <img src={avatarPreview} alt={user?.name} className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0)?.toUpperCase() || 'U'
            )}
          </div>
          <label 
            htmlFor="avatar-upload" 
            className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 shadow-md cursor-pointer transition-transform group-hover:scale-110"
            title="Upload Profile Picture"
          >
            <Camera className="w-4 h-4" />
            <input 
              id="avatar-upload" 
              type="file" 
              accept="image/*" 
              onChange={handleAvatarChange} 
              className="hidden" 
            />
          </label>
        </div>

        <div className="text-center sm:text-left space-y-2">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user?.name}</h2>
            <Badge variant={
              user?.role === 'admin' ? 'danger' :
              user?.role === 'faculty' ? 'primary' : 'info'
            }>
              {user?.role?.toUpperCase()}
            </Badge>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
            <Mail className="w-3.5 h-3.5 text-brand-500" />
            {user?.email}
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1 text-xs text-slate-600 dark:text-slate-300">
            {(user?.department_name || user?.department_code) && (
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                {user.department_name || user.department_code}
              </span>
            )}
            {user?.student_id && (
              <span className="flex items-center gap-1 font-mono">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
                Roll: {user.student_id}
              </span>
            )}
            {user?.faculty_id && (
              <span className="flex items-center gap-1 font-mono">
                <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                Emp ID: {user.faculty_id}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Details Form */}
        <div className="card p-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-brand-600" />
            Personal Details
          </h3>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="input-field text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address (Verified)
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="input-field text-sm bg-slate-50 dark:bg-slate-800/80 cursor-not-allowed opacity-80"
              />
              <p className="text-[10px] text-slate-400 mt-1">Institutional emails cannot be changed directly.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                className="input-field text-sm"
              />
            </div>

            {user?.role === 'student' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Academic Year
                </label>
                <select
                  value={profileData.year}
                  onChange={(e) => setProfileData({ ...profileData, year: e.target.value })}
                  className="input-field text-sm"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Postgraduate">Postgraduate</option>
                </select>
              </div>
            )}

            {user?.role === 'faculty' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Designation
                </label>
                <input
                  type="text"
                  value={profileData.designation}
                  onChange={(e) => setProfileData({ ...profileData, designation: e.target.value })}
                  className="input-field text-sm"
                />
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={profileLoading}
                className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-2"
              >
                {profileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="card p-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <KeyRound className="w-4 h-4 text-brand-600" />
            Security & Password
          </h3>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Current Password *
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={passData.currentPassword}
                onChange={(e) => setPassData({ ...passData, currentPassword: e.target.value })}
                className="input-field text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                New Password *
              </label>
              <input
                type="password"
                required
                placeholder="At least 6 characters"
                value={passData.newPassword}
                onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                className="input-field text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password *
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={passData.confirmPassword}
                onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
                className="input-field text-sm"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={passLoading}
                className="btn-secondary w-full py-2.5 text-xs flex items-center justify-center gap-2"
              >
                {passLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Update Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

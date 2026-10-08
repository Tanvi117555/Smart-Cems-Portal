import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, GraduationCap, Building, Briefcase, Calendar, ArrowRight, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const Register = () => {
  const navigate = useNavigate();
  const { register, getDashboardPath } = useAuth();
  const toast = useToast();

  const [role, setRole] = useState('student'); // 'student' or 'faculty'
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  // Student specifics
  const [studentId, setStudentId] = useState('');
  const [year, setYear] = useState('1st Year');

  // Faculty specifics
  const [facultyId, setFacultyId] = useState('');
  const [designation, setDesignation] = useState('Assistant Professor');

  useEffect(() => {
    const loadDepts = async () => {
      try {
        const res = await api.get('/departments');
        if (res.success) {
          setDepartments(res.departments || []);
          if (res.departments.length > 0) {
            setDepartmentId(res.departments[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching departments', err);
      }
    };
    loadDepts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name,
        email,
        password,
        role,
        phone,
        department_id: departmentId ? parseInt(departmentId, 10) : null,
        ...(role === 'student' && { student_id: studentId, year }),
        ...(role === 'faculty' && { faculty_id: facultyId, designation })
      };

      const registeredUser = await register(payload);
      toast.success('Registration successful! Welcome to CEMS.');
      navigate(getDashboardPath(registeredUser.role));
    } catch (err) {
      setErrorMessage(err.message || 'Error creating account.');
      toast.error(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center text-white shadow-glow-primary mx-auto mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white">
            Create Your CEMS Account
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Join the campus community and never miss an event.
          </p>
        </div>

        {/* Role Switcher Tabs */}
        <div className="flex p-1.5 rounded-2xl bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setRole('student')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              role === 'student'
                ? 'bg-white dark:bg-navy-800 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Student Sign Up</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('faculty')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              role === 'faculty'
                ? 'bg-white dark:bg-navy-800 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Faculty Sign Up</span>
          </button>
        </div>

        {/* Register Form */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Email & Phone Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@cems.edu"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* Department */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                Department *
              </label>
              <div className="relative">
                <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  required
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Role Specific Fields */}
            {role === 'student' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                    Student ID / Roll No. *
                  </label>
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. STU2024CSE01"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                    Academic Year
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                    Faculty Employee ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={facultyId}
                    onChange={(e) => setFacultyId(e.target.value)}
                    placeholder="e.g. FAC-CSE-102"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="Assistant Professor / HOD"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            )}

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white bg-gradient-brand shadow-glow-primary hover:opacity-95 hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create {role === 'student' ? 'Student' : 'Faculty'} Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-brand-600 dark:text-brand-400 hover:underline">
              Sign In here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

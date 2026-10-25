import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  User,
  Phone,
  GraduationCap,
  Building,
  Briefcase,
  Calendar,
  ArrowRight,
  AlertCircle,
  ChevronDown,
  Check
} from 'lucide-react';
import { fetchDepartments, getCachedDepartments, DEFAULT_DEPARTMENTS } from '../../services/metaService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const Register = () => {
  const navigate = useNavigate();
  const { register, getDashboardPath } = useAuth();
  const toast = useToast();

  const [role, setRole] = useState('student'); // 'student' or 'faculty'
  const [departments, setDepartments] = useState(() => {
    const cached = getCachedDepartments();
    return Array.isArray(cached) && cached.length >= 3 ? cached : DEFAULT_DEPARTMENTS;
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Dropdown Open States
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const deptRef = useRef(null);
  const yearRef = useRef(null);

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

  // Close custom dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (deptRef.current && !deptRef.current.contains(e.target)) {
        setIsDeptOpen(false);
      }
      if (yearRef.current && !yearRef.current.contains(e.target)) {
        setIsYearOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadDepts = async () => {
      try {
        const loadedDepts = await fetchDepartments();
        if (isMounted && Array.isArray(loadedDepts) && loadedDepts.length >= 3) {
          setDepartments(loadedDepts);
        }
      } catch (err) {
        console.error('Error fetching departments:', err);
      }
    };
    loadDepts();
    return () => { isMounted = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!departmentId) {
      setErrorMessage('Please select your academic department.');
      return;
    }

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
      const selectedDept = departments.find((d) => String(d.id) === String(departmentId));
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        phone: phone.trim() || null,
        department_id: departmentId ? (isNaN(Number(departmentId)) ? departmentId : parseInt(departmentId, 10)) : null,
        department_name: selectedDept?.name || null,
        department_code: selectedDept?.code || null,
        ...(role === 'student' && {
          student_id: studentId.trim(),
          year
        }),
        ...(role === 'faculty' && {
          faculty_id: facultyId.trim(),
          designation: designation.trim()
        })
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

  const selectedDepartment = departments.find((d) => String(d.id) === String(departmentId));

  return (
    <div className="w-full min-h-[calc(100vh-4.5rem)] flex flex-col justify-start sm:justify-center items-center py-4 sm:py-8 px-4 sm:px-6 lg:px-8 overflow-y-auto">
      <div className="w-full max-w-lg mx-auto space-y-4 my-auto">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-brand flex items-center justify-center text-white shadow-glow-primary mx-auto mb-2">
            <Calendar className="w-5 h-5" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold font-heading text-slate-900 dark:text-white tracking-tight">
            Create Your CEMS Account
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Join the campus community and never miss an event.
          </p>
        </div>

        {/* Role Switcher Tabs */}
        <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setRole('student')}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
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
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
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
        <div className="p-5 sm:p-7 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-4 relative overflow-visible">
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name */}
            <div className="space-y-1">
              <label htmlFor="full-name" className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                <input
                  id="full-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Johnson"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none placeholder-slate-400 transition-colors"
                />
              </div>
            </div>

            {/* Email & Phone Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="email-address" className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                  <input
                    id="email-address"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@cems.edu"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none placeholder-slate-400 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="phone-number" className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                  <input
                    id="phone-number"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none placeholder-slate-400 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Department (Custom Dropdown with High Z-Index & No Overflow Clipping) */}
            <div className="space-y-1 relative z-30" ref={deptRef}>
              <label htmlFor="department-select" className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                Department *
              </label>
              <div className="relative">
                <button
                  id="department-dropdown-trigger"
                  type="button"
                  onClick={() => {
                    setIsDeptOpen(!isDeptOpen);
                    setIsYearOpen(false);
                  }}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-900 border text-left text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer ${
                    isDeptOpen
                      ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <span className={selectedDepartment ? 'text-slate-900 dark:text-white font-medium truncate' : 'text-slate-400'}>
                    {selectedDepartment ? (
                      <span className="flex items-center gap-1.5">
                        <span className="truncate">{selectedDepartment.name}</span>
                        {selectedDepartment.code && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-50 dark:bg-brand-950/70 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-900/50">
                            {selectedDepartment.code}
                          </span>
                        )}
                      </span>
                    ) : (
                      'Select Department'
                    )}
                  </span>
                  <ChevronDown
                    className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-transform duration-200 pointer-events-none ${
                      isDeptOpen ? 'rotate-180 text-brand-500' : ''
                    }`}
                  />
                </button>

                {/* Floating Options Menu */}
                {isDeptOpen && (
                  <div
                    id="department-options-menu"
                    className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-56 overflow-y-auto rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100"
                  >
                    {departments.map((d) => {
                      const isSelected = String(departmentId) === String(d.id);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            setDepartmentId(d.id);
                            setIsDeptOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-xl text-left text-xs sm:text-sm flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="truncate">{d.name}</span>
                            {d.code && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400 shrink-0">
                                {d.code}
                              </span>
                            )}
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Hidden native select for native form submission and browser testing tools */}
                <select
                  id="department-select"
                  name="department_id"
                  tabIndex={-1}
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="sr-only"
                  aria-hidden="true"
                >
                  <option value="" disabled>Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.code ? `(${d.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Role Specific Fields */}
            {role === 'student' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="student-id" className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                    Student ID / Roll No. *
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                    <input
                      id="student-id"
                      type="text"
                      required
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="e.g. STU2024CSE01"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none placeholder-slate-400 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1 relative z-20" ref={yearRef}>
                  <label htmlFor="academic-year-select" className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                    Academic Year *
                  </label>
                  <div className="relative">
                    <button
                      id="academic-year-trigger"
                      type="button"
                      onClick={() => {
                        setIsYearOpen(!isYearOpen);
                        setIsDeptOpen(false);
                      }}
                      className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-900 border text-left text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer ${
                        isYearOpen
                          ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-md'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <span className="text-slate-900 dark:text-white font-medium">{year}</span>
                      <ChevronDown
                        className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-transform duration-200 pointer-events-none ${
                          isYearOpen ? 'rotate-180 text-brand-500' : ''
                        }`}
                      />
                    </button>

                    {isYearOpen && (
                      <div
                        id="academic-year-options-menu"
                        className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100"
                      >
                        {['1st Year', '2nd Year', '3rd Year', '4th Year'].map((yr) => (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => {
                              setYear(yr);
                              setIsYearOpen(false);
                            }}
                            className={`w-full px-3 py-2 rounded-xl text-left text-xs sm:text-sm flex items-center justify-between transition-colors cursor-pointer ${
                              year === yr
                                ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold'
                                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800'
                            }`}
                          >
                            <span>{yr}</span>
                            {year === yr && <Check className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />}
                          </button>
                        ))}
                      </div>
                    )}

                    <select
                      id="academic-year-select"
                      name="academic_year"
                      tabIndex={-1}
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="sr-only"
                      aria-hidden="true"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="faculty-id" className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                    Faculty Employee ID *
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                    <input
                      id="faculty-id"
                      type="text"
                      required
                      value={facultyId}
                      onChange={(e) => setFacultyId(e.target.value)}
                      placeholder="e.g. FAC-CSE-102"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none placeholder-slate-400 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="designation" className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                    Designation
                  </label>
                  <input
                    id="designation"
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="Assistant Professor / HOD"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none placeholder-slate-400 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="password" className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none placeholder-slate-400 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="confirm-password" className="block text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                  <input
                    id="confirm-password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none placeholder-slate-400 transition-colors"
                  />
                </div>
              </div>
            </div>

            <button
              id="create-account-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-brand shadow-glow-primary hover:opacity-95 hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4 active:scale-[0.99] cursor-pointer"
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

          <div className="pt-1 text-center text-xs text-slate-500">
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

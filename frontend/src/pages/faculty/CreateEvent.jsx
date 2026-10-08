import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Upload,
  PlusCircle,
  Trash2,
  QrCode,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const CreateEvent = ({ isEditing = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingEvent, setFetchingEvent] = useState(isEditing);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('10:00 AM');
  const [endTime, setEndTime] = useState('04:00 PM');
  const [venue, setVenue] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [building, setBuilding] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(100);
  const [isPaid, setIsPaid] = useState(false);
  const [registrationFee, setRegistrationFee] = useState(0);
  const [regStart, setRegStart] = useState('');
  const [regEnd, setRegEnd] = useState('');
  const [conflictWarning, setConflictWarning] = useState(null);

  // Real-time Venue & Schedule Conflict Detection
  useEffect(() => {
    if (!date || !venue.trim() || !startTime || !endTime) {
      setConflictWarning(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.post('/events/check-conflict', {
          date,
          venue: venue.trim(),
          startTime,
          endTime,
          excludeEventId: id || null
        });
        if (res.conflict) {
          setConflictWarning(res.conflictingEvent);
        } else {
          setConflictWarning(null);
        }
      } catch (e) {
        // silent check
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [date, venue, startTime, endTime, id]);

  // Files
  const [imageFile, setImageFile] = useState(null);
  const [qrFile, setQrFile] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [existingQr, setExistingQr] = useState(null);

  // Dynamic Rules
  const [rules, setRules] = useState([
    'Valid College / University ID card is mandatory for entry.',
    'Participants must report 30 minutes before the scheduled start time.'
  ]);

  // Dynamic Schedule
  const [schedule, setSchedule] = useState([
    { schedule_time: '09:30 AM', activity: 'Registration & Welcome', description: 'Desk badge collection' },
    { schedule_time: '10:30 AM', activity: 'Main Session / Competition', description: 'Core event proceedings' }
  ]);

  // Fetch Categories and Departments
  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [catRes, deptRes] = await Promise.all([
          api.get('/categories'),
          api.get('/departments')
        ]);
        if (catRes.success) {
          setCategories(catRes.categories || []);
          if (!isEditing && catRes.categories.length > 0) setCategoryId(catRes.categories[0].id);
        }
        if (deptRes.success) {
          setDepartments(deptRes.departments || []);
          if (!isEditing && deptRes.departments.length > 0) setDepartmentId(deptRes.departments[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadMeta();
  }, [isEditing]);

  // Fetch existing event if in edit mode
  useEffect(() => {
    if (!isEditing || !id) return;
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/events/${id}`);
        if (res.success && res.event) {
          const e = res.event;
          setTitle(e.title || '');
          setDescription(e.description || '');
          setCategoryId(e.category_id || '');
          setDepartmentId(e.department_id || '');
          setDate(e.date ? new Date(e.date).toISOString().split('T')[0] : '');
          setStartTime(e.start_time || '');
          setEndTime(e.end_time || '');
          setVenue(e.venue || '');
          setRoomNumber(e.room_number || '');
          setBuilding(e.building || '');
          setMaxParticipants(e.max_participants || 100);
          setIsPaid(!!e.is_paid);
          setRegistrationFee(e.registration_fee || 0);
          setRegStart(e.registration_start ? new Date(e.registration_start).toISOString().split('T')[0] : '');
          setRegEnd(e.registration_end ? new Date(e.registration_end).toISOString().split('T')[0] : '');
          setExistingImage(e.image);
          setExistingQr(e.qr_code_image);

          if (e.rules && e.rules.length > 0) {
            setRules(e.rules.map((r) => r.rule_text));
          }
          if (e.schedule && e.schedule.length > 0) {
            setSchedule(e.schedule);
          }
        }
      } catch (err) {
        toast.error('Failed to load event data for editing.');
      } finally {
        setFetchingEvent(false);
      }
    };
    fetchEvent();
  }, [isEditing, id]);

  // Dynamic Rule Handlers
  const addRule = () => setRules([...rules, '']);
  const updateRule = (idx, text) => {
    const updated = [...rules];
    updated[idx] = text;
    setRules(updated);
  };
  const removeRule = (idx) => setRules(rules.filter((_, i) => i !== idx));

  // Dynamic Schedule Handlers
  const addScheduleItem = () => {
    setSchedule([...schedule, { schedule_time: '', activity: '', description: '' }]);
  };
  const updateScheduleItem = (idx, field, val) => {
    const updated = [...schedule];
    updated[idx] = { ...updated[idx], [field]: val };
    setSchedule(updated);
  };
  const removeScheduleItem = (idx) => setSchedule(schedule.filter((_, i) => i !== idx));

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !description || !categoryId || !date || !venue) {
      toast.error('Please complete all required fields.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category_id', categoryId);
      formData.append('department_id', departmentId || '');
      formData.append('date', date);
      formData.append('start_time', startTime);
      formData.append('end_time', endTime);
      formData.append('venue', venue);
      formData.append('room_number', roomNumber || '');
      formData.append('building', building || '');
      formData.append('max_participants', maxParticipants);
      formData.append('is_paid', isPaid);
      formData.append('registration_fee', isPaid ? registrationFee : 0);
      formData.append('registration_start', regStart || date);
      formData.append('registration_end', regEnd || date);

      // Pass Rules & Schedule as JSON strings for Multer
      formData.append('rules', JSON.stringify(rules.filter((r) => r.trim())));
      formData.append('schedule', JSON.stringify(schedule.filter((s) => s.activity.trim())));

      if (imageFile) formData.append('image', imageFile);
      if (qrFile) formData.append('qr_code', qrFile);

      if (isEditing) {
        const res = await api.put(`/events/${id}`, formData);
        if (res.success) {
          toast.success('Event updated successfully!');
          navigate('/faculty/events');
        }
      } else {
        const res = await api.post('/events', formData);
        if (res.success) {
          toast.success(res.message || 'Event submitted for approval!');
          navigate('/faculty/events');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Error saving event.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingEvent) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-navy-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white">
            {isEditing ? 'Edit Event Proposal' : 'Create New Event Proposal'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Submit full details, rules, schedules, and fee structures for college approval.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 1. Basic Info Section */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 space-y-5">
          <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            1. Basic Information
          </h3>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase text-slate-500">Event Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. CodeFest 2026: 24-Hour National Hackathon"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-500">Category *</label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-500">Department</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Campus-Wide / All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase text-slate-500">Event Description *</label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the objectives, competition tracks, eligibility, and prize pools..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Banner Upload */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase text-slate-500">Event Banner Image</label>
            <div className="flex items-center gap-4">
              {(imageFile || existingImage) && (
                <img
                  src={imageFile ? URL.createObjectURL(imageFile) : existingImage}
                  alt="Banner preview"
                  className="w-20 h-20 rounded-2xl object-cover border"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
                className="text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
              />
            </div>
          </div>
        </div>

        {/* 2. Schedule & Venue Section */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 space-y-5">
          <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            2. Schedule & Location
          </h3>

          {conflictWarning && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-start gap-3 text-rose-800 dark:text-rose-200 animate-fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold">Schedule & Venue Conflict Detected!</p>
                <p>
                  The event <strong>"{conflictWarning.title}"</strong> is already approved for <strong>{conflictWarning.venue}</strong> on {conflictWarning.date} ({conflictWarning.startTime} – {conflictWarning.endTime}).
                </p>
                <p className="text-[11px] opacity-80">Please select an alternate room, venue, or timing interval to prevent overlapping bookings.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-500">Event Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-500">Start Time *</label>
              <input
                type="text"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="09:30 AM"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-500">End Time *</label>
              <input
                type="text"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="05:00 PM"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 sm:col-span-1">
              <label className="block text-xs font-bold uppercase text-slate-500">Venue / Auditorium *</label>
              <input
                type="text"
                required
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. Main Auditorium"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-500">Room / Lab No.</label>
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="e.g. Lab 301"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-500">Building / Block</label>
              <input
                type="text"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                placeholder="e.g. APJ Kalam Wing"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Registration Window */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-500">Registration Opens</label>
              <input
                type="date"
                value={regStart}
                onChange={(e) => setRegStart(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-500">Registration Deadline</label>
              <input
                type="date"
                value={regEnd}
                onChange={(e) => setRegEnd(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* 3. Seats, Fees & QR Payment Setup */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 space-y-5">
          <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            3. Capacity & Ticket Pricing
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-500">Max Seat Capacity *</label>
              <input
                type="number"
                min="10"
                max="5000"
                required
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-500">Event Pricing Model</label>
              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                  <input
                    type="radio"
                    name="pricing"
                    checked={!isPaid}
                    onChange={() => setIsPaid(false)}
                    className="text-brand-600 focus:ring-brand-500"
                  />
                  <span>Free Entry</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold">
                  <input
                    type="radio"
                    name="pricing"
                    checked={isPaid}
                    onChange={() => setIsPaid(true)}
                    className="text-brand-600 focus:ring-brand-500"
                  />
                  <span>Paid Event (UPI QR)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Paid Event Specific Settings */}
          {isPaid && (
            <div className="p-5 rounded-2xl bg-brand-50/70 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-900/40 space-y-4 animate-in fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase text-slate-500">Registration Fee (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    required={isPaid}
                    value={registrationFee}
                    onChange={(e) => setRegistrationFee(e.target.value)}
                    placeholder="e.g. 250"
                    className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-sm focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase text-slate-500">Payment QR Code Image</label>
                  <div className="flex items-center gap-3">
                    {(qrFile || existingQr) && (
                      <img
                        src={qrFile ? URL.createObjectURL(qrFile) : existingQr}
                        alt="QR preview"
                        className="w-12 h-12 rounded-xl object-contain border p-1 bg-white"
                      />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setQrFile(e.target.files[0])}
                      className="text-xs text-slate-500 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-100 file:text-brand-800"
                    />
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                Students will scan this QR code upon registration, pay the exact fee, and submit their transaction UTR number for your verification.
              </p>
            </div>
          )}
        </div>

        {/* 4. Dynamic Rules Builder */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">
              4. Event Rules & Guidelines
            </h3>
            <button
              type="button"
              onClick={addRule}
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Rule</span>
            </button>
          </div>

          <div className="space-y-3">
            {rules.map((rule, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="w-6 text-xs font-bold text-slate-400 text-center">{idx + 1}.</span>
                <input
                  type="text"
                  value={rule}
                  onChange={(e) => updateRule(idx, e.target.value)}
                  placeholder="Enter rule statement..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500"
                />
                {rules.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRule(idx)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 5. Dynamic Agenda Schedule Builder */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">
              5. Event Schedule Timeline
            </h3>
            <button
              type="button"
              onClick={addScheduleItem}
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Timeline Item</span>
            </button>
          </div>

          <div className="space-y-3">
            {schedule.map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-brand-600">Step {idx + 1}</span>
                  {schedule.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeScheduleItem(idx)}
                      className="p-1 text-rose-500 hover:bg-rose-50 rounded-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Time (e.g. 09:30 AM)"
                    value={item.schedule_time}
                    onChange={(e) => updateScheduleItem(idx, 'schedule_time', e.target.value)}
                    className="px-3 py-2 rounded-xl bg-white dark:bg-navy-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-brand-500"
                  />
                  <input
                    type="text"
                    placeholder="Activity (e.g. Hackathon Kickoff)"
                    value={item.activity}
                    onChange={(e) => updateScheduleItem(idx, 'activity', e.target.value)}
                    className="sm:col-span-2 px-3 py-2 rounded-xl bg-white dark:bg-navy-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Optional details or description..."
                  value={item.description || ''}
                  onChange={(e) => updateScheduleItem(idx, 'description', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-navy-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/faculty/events')}
            className="px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-navy-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-brand shadow-glow-primary hover:opacity-95 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Saving...' : isEditing ? 'Update Event Details' : 'Submit for College Approval'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEvent;

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MessageSquare,
  PlusCircle,
  Trash2,
  Save,
  BarChart3,
  Star,
  CheckCircle2,
  TrendingUp,
  Award
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/common/EmptyState';

const COLORS = ['#4f46e5', '#7c3aed', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

const FacultyFeedback = () => {
  const [searchParams] = useSearchParams();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('analytics'); // 'builder' or 'analytics'
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(searchParams.get('eventId') || '');

  // Form Builder State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  const [savingForm, setSavingForm] = useState(false);

  // Analytics State
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // 1. Fetch faculty events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/events/my');
        if (res.success && res.events) {
          setEvents(res.events);
          if (!selectedEventId && res.events.length > 0) {
            setSelectedEventId(res.events[0].id.toString());
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchEvents();
  }, []);

  // 2. Load Form Builder Data
  useEffect(() => {
    if (!selectedEventId) return;

    const loadForm = async () => {
      try {
        const res = await api.get(`/feedback/forms/${selectedEventId}`);
        if (res.success && res.form) {
          setFormTitle(res.form.title);
          setFormDescription(res.form.description || '');
          setQuestions(res.form.questions || []);
        } else {
          setFormTitle('Participant Feedback Survey');
          setFormDescription('');
          setQuestions([
            { question_text: 'How would you rate the overall event?', question_type: 'rating', is_required: true },
            { question_text: 'Did the facilities and venue meet expectations?', question_type: 'yes_no', options: ['Yes', 'No'], is_required: true },
            { question_text: 'What was your favorite highlight or session?', question_type: 'short_text', is_required: false },
            { question_text: 'Suggestions for future editions?', question_type: 'long_text', is_required: false }
          ]);
        }
      } catch (err) {
        setFormTitle('Participant Feedback Survey');
        setQuestions([
          { question_text: 'How would you rate the overall event?', question_type: 'rating', is_required: true },
          { question_text: 'What was your favorite highlight or session?', question_type: 'short_text', is_required: false }
        ]);
      }
    };

    loadForm();
  }, [selectedEventId]);

  // 3. Load Analytics Data
  useEffect(() => {
    if (!selectedEventId || activeTab !== 'analytics') return;

    const loadAnalytics = async () => {
      setLoadingAnalytics(true);
      try {
        const res = await api.get(`/feedback/results/${selectedEventId}`);
        if (res.success) {
          setAnalytics(res.analytics);
        }
      } catch (err) {
        setAnalytics(null);
      } finally {
        setLoadingAnalytics(false);
      }
    };

    loadAnalytics();
  }, [selectedEventId, activeTab]);

  // Builder Handlers
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: '',
        question_type: 'rating',
        is_required: true,
        options: []
      }
    ]);
  };

  const updateQuestion = (idx, field, val) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: val };
    setQuestions(updated);
  };

  const removeQuestion = (idx) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (!selectedEventId || !formTitle.trim()) {
      toast.error('Form title is required.');
      return;
    }

    setSavingForm(true);
    try {
      const res = await api.post('/feedback/forms', {
        event_id: selectedEventId,
        title: formTitle.trim(),
        description: formDescription.trim(),
        questions
      });

      if (res.success) {
        toast.success('Feedback form saved successfully!');
      }
    } catch (err) {
      toast.error(err.message || 'Error saving feedback form.');
    } finally {
      setSavingForm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white">
            Feedback Management & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Build custom dynamic survey questionnaires and analyze student satisfaction ratings.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1.5 rounded-2xl bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'analytics'
                ? 'bg-white dark:bg-navy-800 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>View Analytics</span>
          </button>
          <button
            onClick={() => setActiveTab('builder')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'builder'
                ? 'bg-white dark:bg-navy-800 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Form Builder</span>
          </button>
        </div>
      </div>

      {/* Event Selector */}
      <div className="p-4 sm:p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
          Select Event
        </label>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
        >
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title} ({new Date(e.date).toLocaleDateString()})
            </option>
          ))}
        </select>
      </div>

      {activeTab === 'analytics' ? (
        /* ANALYTICS VIEW */
        loadingAnalytics ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading analytics...</div>
        ) : !analytics || analytics.totalResponses === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="No feedback responses yet"
            description="Students who attend this event will be prompted to submit their ratings. Once submitted, ratings and charts will appear here automatically."
            actionLabel="Edit Questions in Form Builder"
            onAction={() => setActiveTab('builder')}
          />
        ) : (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-slate-400">Total Student Responses</span>
                  <p className="text-3xl font-extrabold font-heading text-slate-900 dark:text-white mt-1">
                    {analytics.totalResponses}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6" />
                </div>
              </div>

              <div className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-slate-400">Average Satisfaction Rating</span>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-3xl font-extrabold font-heading text-slate-900 dark:text-white">
                      {analytics.averageRating}
                    </p>
                    <span className="text-sm text-slate-400">/ 5.0</span>
                    <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                  <Star className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Rating Breakdown Chart */}
            <div className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 space-y-4">
              <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
                Rating Distribution (1 to 5 Stars)
              </h3>
              <div className="h-60 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.ratingDistribution}>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        borderRadius: '12px',
                        border: 'none',
                        color: '#fff',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="count" fill="#7c3aed" radius={[8, 8, 0, 0]} name="Student Ratings" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Individual Questions Insights */}
            <div className="space-y-4">
              <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
                Question Breakdown
              </h3>
              {(analytics.questions || []).map((q, idx) => (
                <div key={q.id || idx} className="p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {idx + 1}. {q.question}
                    </h4>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-navy-800 text-slate-500">
                      {q.type}
                    </span>
                  </div>

                  {q.type === 'rating' && (
                    <p className="text-xs text-brand-600 dark:text-brand-400 font-bold">
                      Average: {q.average} / 5.0 ⭐ (across {q.total} ratings)
                    </p>
                  )}

                  {q.optionsSummary && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                      {q.optionsSummary.map((opt) => (
                        <div key={opt.name} className="p-3 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-100 dark:border-slate-800 text-xs">
                          <p className="font-bold text-slate-900 dark:text-white">{opt.name}</p>
                          <p className="text-slate-500">{opt.value} response(s)</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {q.responses && q.responses.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      {q.responses.map((resp, rIdx) => (
                        <div key={rIdx} className="p-3 rounded-xl bg-slate-50 dark:bg-navy-900 text-xs text-slate-600 dark:text-slate-300 italic border border-slate-100 dark:border-slate-800">
                          "{resp}"
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        /* FORM BUILDER VIEW */
        <form onSubmit={handleSaveForm} className="p-6 sm:p-8 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
          <div className="space-y-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase text-slate-500">Form Title *</label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. CodeFest Participant Survey"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase text-slate-500">Form Description</label>
              <input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Brief instructions for participants..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
                Survey Questions ({questions.length})
              </h3>
              <button
                type="button"
                onClick={addQuestion}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 flex items-center gap-1.5 transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Question</span>
              </button>
            </div>

            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-400">Question {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeQuestion(idx)}
                      className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Enter question statement..."
                      value={q.question_text}
                      onChange={(e) => updateQuestion(idx, 'question_text', e.target.value)}
                      className="sm:col-span-2 px-3 py-2 rounded-xl bg-white dark:bg-navy-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-brand-500"
                    />

                    <select
                      value={q.question_type}
                      onChange={(e) => updateQuestion(idx, 'question_type', e.target.value)}
                      className="px-3 py-2 rounded-xl bg-white dark:bg-navy-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="rating">Rating (1 - 5 Stars)</option>
                      <option value="yes_no">Yes / No</option>
                      <option value="multiple_choice">Multiple Choice (Radio)</option>
                      <option value="checkbox">Checkbox (Multi-select)</option>
                      <option value="short_text">Short Text</option>
                      <option value="long_text">Long Text</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={q.is_required}
                        onChange={(e) => updateQuestion(idx, 'is_required', e.target.checked)}
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
                      />
                      <span>Required question</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={savingForm}
              className="px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-brand shadow-glow-primary hover:opacity-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingForm ? 'Saving Form...' : 'Save Feedback Questionnaire'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default FacultyFeedback;

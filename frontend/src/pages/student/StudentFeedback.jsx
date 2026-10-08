import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MessageSquare, Star, CheckCircle2, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/common/EmptyState';

const StudentFeedback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [registrations, setRegistrations] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(searchParams.get('eventId') || '');
  const [formData, setFormData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  // 1. Fetch completed events the student registered for
  useEffect(() => {
    const fetchMyCompleted = async () => {
      try {
        const res = await api.get('/registrations/my');
        if (res.success) {
          const todayStr = new Date().toISOString().split('T')[0];
          const pastEvents = (res.registrations || []).filter(
            (r) => new Date(r.event_date).toISOString().split('T')[0] <= todayStr && r.status === 'confirmed'
          );
          setRegistrations(pastEvents);

          if (!selectedEventId && pastEvents.length > 0) {
            setSelectedEventId(pastEvents[0].event_id.toString());
          }
        }
      } catch (err) {
        console.error('Error fetching registrations', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyCompleted();
  }, []);

  // 2. Fetch feedback form when event changes
  useEffect(() => {
    if (!selectedEventId) return;

    const fetchForm = async () => {
      setLoading(true);
      setCompleted(false);
      try {
        const res = await api.get(`/feedback/forms/${selectedEventId}`);
        if (res.success) {
          setFormData(res.form);
          if (res.form.has_submitted) {
            setCompleted(true);
          }
          // Initialize empty answers
          const initial = {};
          (res.form.questions || []).forEach((q) => {
            initial[q.id] = q.question_type === 'rating' ? 5 : q.question_type === 'checkbox' ? [] : '';
          });
          setAnswers(initial);
        }
      } catch (err) {
        setFormData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [selectedEventId]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleCheckboxChange = (questionId, option) => {
    setAnswers((prev) => {
      const existing = prev[questionId] || [];
      if (existing.includes(option)) {
        return { ...prev, [questionId]: existing.filter((item) => item !== option) };
      } else {
        return { ...prev, [questionId]: [...existing, option] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData) return;

    // Validate required fields
    for (const q of formData.questions || []) {
      if (q.is_required) {
        const ans = answers[q.id];
        if (ans === undefined || ans === '' || (Array.isArray(ans) && ans.length === 0)) {
          toast.error(`Please answer required question: "${q.question_text}"`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const payloadAnswers = Object.entries(answers).map(([qId, val]) => ({
        question_id: parseInt(qId, 10),
        answer: val
      }));

      const res = await api.post('/feedback/submit', {
        form_id: formData.id,
        answers: payloadAnswers
      });

      if (res.success) {
        toast.success('Thank you for your valuable feedback!');
        setCompleted(true);
      }
    } catch (err) {
      toast.error(err.message || 'Error submitting feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white">
          Event Participant Feedback
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Your honest thoughts and ratings help faculty improve future campus fests.
        </p>
      </div>

      {/* Event Select Dropdown */}
      <div className="p-4 sm:p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
          Select Event to Review
        </label>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full px-3.5 py-3 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
        >
          {registrations.length === 0 && <option value="">No completed events available</option>}
          {registrations.map((r) => (
            <option key={r.event_id} value={r.event_id}>
              {r.event_title} ({new Date(r.event_date).toLocaleDateString()})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs font-semibold text-slate-400">
          Loading feedback form...
        </div>
      ) : completed ? (
        <div className="p-8 sm:p-12 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Feedback Already Submitted!
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            Thank you for sharing your experience for this event. Your response has been recorded for the faculty committee.
          </p>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-brand shadow-glow-primary hover:opacity-95 transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      ) : !formData ? (
        <EmptyState
          icon={MessageSquare}
          title="No feedback form configured"
          description="The organizer has not published an active feedback survey for this event yet."
        />
      ) : (
        /* Dynamic Questionnaire Form */
        <form onSubmit={handleSubmit} className="p-6 sm:p-10 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-8">
          <div className="space-y-1 pb-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
              {formData.title}
            </h2>
            {formData.description && (
              <p className="text-xs text-slate-500">{formData.description}</p>
            )}
          </div>

          <div className="space-y-6">
            {(formData.questions || []).map((q, index) => (
              <div key={q.id} className="space-y-2.5 p-4 rounded-2xl bg-slate-50/70 dark:bg-navy-900/60 border border-slate-200/60 dark:border-slate-800/60">
                <label className="block text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {index + 1}. {q.question_text} {q.is_required && <span className="text-rose-500">*</span>}
                </label>

                {/* Question Type: Rating 1-5 Stars */}
                {q.question_type === 'rating' && (
                  <div className="flex items-center gap-2 pt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => handleAnswerChange(q.id, star)}
                        className="p-1 text-slate-300 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= (answers[q.id] || 0)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-300 dark:text-slate-700'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-500 ml-2">
                      {answers[q.id] ? `${answers[q.id]} / 5 Stars` : 'Rate'}
                    </span>
                  </div>
                )}

                {/* Question Type: Yes / No */}
                {q.question_type === 'yes_no' && (
                  <div className="flex items-center gap-3 pt-1">
                    {['Yes', 'No'].map((opt) => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => handleAnswerChange(q.id, opt)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                          answers[q.id] === opt
                            ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                            : 'bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {/* Question Type: Multiple Choice */}
                {q.question_type === 'multiple_choice' && (
                  <div className="space-y-2 pt-1">
                    {(q.options || []).map((opt) => (
                      <label
                        key={opt}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-navy-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-brand-400 text-xs font-medium"
                      >
                        <input
                          type="radio"
                          name={`q_${q.id}`}
                          value={opt}
                          checked={answers[q.id] === opt}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          className="text-brand-600 focus:ring-brand-500"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Question Type: Checkbox (Multi-select) */}
                {q.question_type === 'checkbox' && (
                  <div className="space-y-2 pt-1">
                    {(q.options || []).map((opt) => (
                      <label
                        key={opt}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-navy-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-brand-400 text-xs font-medium"
                      >
                        <input
                          type="checkbox"
                          checked={(answers[q.id] || []).includes(opt)}
                          onChange={() => handleCheckboxChange(q.id, opt)}
                          className="rounded text-brand-600 focus:ring-brand-500"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Question Type: Short Text */}
                {q.question_type === 'short_text' && (
                  <input
                    type="text"
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    placeholder="Your answer..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-navy-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500"
                  />
                )}

                {/* Question Type: Long Text */}
                {q.question_type === 'long_text' && (
                  <textarea
                    rows={3}
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    placeholder="Provide your detailed feedback..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-navy-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500"
                  />
                )}
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white bg-gradient-brand shadow-glow-primary hover:opacity-95 hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? 'Submitting Responses...' : 'Submit Feedback'}
          </button>
        </form>
      )}
    </div>
  );
};

export default StudentFeedback;

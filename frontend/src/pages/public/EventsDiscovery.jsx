import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, RotateCcw, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import EventCard from '../../components/events/EventCard';
import { EventCardSkeleton } from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';

const EventsDiscovery = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filter options
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);

  // URL States
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || 'all';
  const department = searchParams.get('department') || 'all';
  const isPaid = searchParams.get('is_paid') || 'all';
  const sort = searchParams.get('sort') || 'upcoming';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Fetch Categories & Departments
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catRes, deptRes] = await Promise.all([
          api.get('/categories'),
          api.get('/departments')
        ]);
        if (catRes.success) setCategories(catRes.categories || []);
        if (deptRes.success) setDepartments(deptRes.departments || []);
      } catch (err) {
        console.error('Error fetching filters', err);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch Events when filters change
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: 9,
          sort,
          status: 'published'
        };
        if (search) params.search = search;
        if (category && category !== 'all') params.category = category;
        if (department && department !== 'all') params.department = department;
        if (isPaid !== 'all') params.is_paid = isPaid === 'paid';

        const res = await api.get('/events', { params });
        if (res.success) {
          setEvents(res.events || []);
          setTotal(res.total || 0);
          setTotalPages(res.totalPages || 1);
        }
      } catch (err) {
        console.error('Error loading events', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [search, category, department, isPaid, sort, page]);

  // Update URL Query Params Helper
  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all' && value !== '') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    // Reset to page 1 on filter change
    if (key !== 'page') {
      newParams.delete('page');
    }
    setSearchParams(newParams);
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-5xl font-extrabold font-heading text-slate-900 dark:text-white">
          Discover Campus Events
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
          Find and register for hackathons, sports tournaments, cultural nights, and workshops.
        </p>
      </div>

      {/* Search & Control Bar */}
      <div className="p-4 sm:p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => updateFilter('search', e.target.value)}
            placeholder="Search by event title, venue, or keyword..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-2">
          {/* Category */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Department
            </label>
            <select
              value={department}
              onChange={(e) => updateFilter('department', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.code}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>

          {/* Fee Type */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Ticket Fee
            </label>
            <select
              value={isPaid}
              onChange={(e) => updateFilter('is_paid', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800 dark:text-slate-200"
            >
              <option value="all">All (Free & Paid)</option>
              <option value="free">Free Only</option>
              <option value="paid">Paid Only</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Sort By
            </label>
            <select
              value={sort}
              onChange={(e) => updateFilter('sort', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800 dark:text-slate-200"
            >
              <option value="upcoming">Upcoming Date</option>
              <option value="newest">Newly Added</option>
              <option value="most_registered">Most Registered</option>
              <option value="alphabetical">Title (A-Z)</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="flex items-end col-span-2 sm:col-span-4 lg:col-span-1">
            <button
              onClick={handleResetFilters}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results Meta Info */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-2">
        <p>
          Showing <strong className="text-slate-900 dark:text-white">{events.length}</strong> of{' '}
          <strong className="text-slate-900 dark:text-white">{total}</strong> events
        </p>
        {(category !== 'all' || department !== 'all' || isPaid !== 'all' || search) && (
          <span className="text-brand-600 dark:text-brand-400 font-semibold">Active filters applied</span>
        )}
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          title="No campus events found"
          description="We couldn't find any events matching your selected filters. Try searching for a different keyword or reset filters."
          actionLabel="Clear Filters"
          onAction={handleResetFilters}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            onClick={() => updateFilter('page', page - 1)}
            disabled={page <= 1}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-navy-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }).map((_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => updateFilter('page', pageNum)}
                className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${
                  page === pageNum
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-900'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            onClick={() => updateFilter('page', page + 1)}
            disabled={page >= totalPages}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-navy-900 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default EventsDiscovery;

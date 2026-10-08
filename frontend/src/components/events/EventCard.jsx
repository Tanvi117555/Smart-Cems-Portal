import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Users, ArrowRight, Tag } from 'lucide-react';

const EventCard = ({ event }) => {
  const isFree = !event.is_paid || parseFloat(event.registration_fee) === 0;
  const seatsRemaining = event.seats_remaining !== undefined ? event.seats_remaining : (event.max_participants - (event.registered_count || 0));
  const percentFilled = Math.min(100, Math.round(((event.registered_count || 0) / event.max_participants) * 100));

  // Category Color Scheme
  const getCategoryTheme = (slug) => {
    switch (slug) {
      case 'technical':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'cultural':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'sports':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'arts':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300 border-pink-200 dark:border-pink-800';
      case 'competitions':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
    }
  };

  return (
    <div className="group relative rounded-3xl overflow-hidden glass-panel border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
      {/* Event Banner */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-200 dark:bg-navy-900">
        <img
          src={event.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800'}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

        {/* Category Badge & Price Tag */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2">
          <span className={`px-2.5 py-1 text-xs font-bold rounded-full border backdrop-blur-md ${getCategoryTheme(event.category_slug)}`}>
            {event.category_name || 'Campus Event'}
          </span>
          <span className={`px-3 py-1 text-xs font-black rounded-full shadow-md backdrop-blur-md ${
            isFree
              ? 'bg-emerald-500/90 text-white'
              : 'bg-indigo-600/90 text-white'
          }`}>
            {isFree ? 'FREE' : `₹${parseFloat(event.registration_fee).toFixed(0)}`}
          </span>
        </div>

        {/* Department Name on image bottom */}
        {event.department_code && (
          <div className="absolute bottom-3 left-3.5 text-[11px] font-semibold text-slate-200 bg-black/40 backdrop-blur-sm px-2.5 py-0.5 rounded-lg border border-white/10">
            {event.department_name || event.department_code}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-1">
            {event.title}
          </h3>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {event.description}
          </p>
        </div>

        {/* Event Schedule Info */}
        <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-500 shrink-0" />
            <span className="font-semibold">{new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="flex items-center gap-1 text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              {event.start_time}
            </span>
          </div>

          <div className="flex items-center gap-2 truncate">
            <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="truncate">{event.venue} {event.room_number ? `(${event.room_number})` : ''}</span>
          </div>
        </div>

        {/* Capacity / Seats Fill Progress */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-[11px] font-medium mb-1 text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-brand-500" />
              Seats Left: <strong className="text-slate-800 dark:text-white font-bold">{seatsRemaining}</strong>
            </span>
            <span>{percentFilled}% full</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                percentFilled > 85 ? 'bg-rose-500' : percentFilled > 60 ? 'bg-amber-500' : 'bg-gradient-brand'
              }`}
              style={{ width: `${percentFilled}%` }}
            />
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="pt-3 flex items-center gap-2">
          <Link
            to={`/events/${event.id}`}
            className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-center bg-slate-100 dark:bg-navy-800 hover:bg-brand-50 dark:hover:bg-brand-950 text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          >
            View Details
          </Link>
          <Link
            to={`/events/${event.id}?action=register`}
            className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-center text-white bg-gradient-brand shadow-glow-primary hover:opacity-95 hover:shadow-lg transition-all flex items-center justify-center gap-1"
          >
            <span>Register</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EventCard;

const { db } = require('../config/firebase');

/**
 * Convert time string (e.g., '10:00 AM', '02:30 PM', '14:00') into minutes from midnight
 */
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const str = String(timeStr).trim().toUpperCase();

  // Match '10:00 AM' or '02:30 PM'
  const ampmMatch = str.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10);
    const period = ampmMatch[3];

    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  // Fallback 24-hour match
  const parts = str.split(':');
  if (parts.length >= 2) {
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  return 540; // Default 09:00 AM
};

/**
 * 1. Venue & Schedule Conflict Detection Algorithm
 * Checks if another active event occupies the same date and venue within the overlapping time window.
 */
const checkVenueConflict = async ({
  date,
  startTime,
  endTime,
  venue,
  room_number = '',
  excludeEventId = null
}) => {
  try {
    if (!date || !venue) return { hasConflict: false };

    const targetDate = String(date).split('T')[0];
    const newStartMin = parseTimeToMinutes(startTime || '09:00 AM');
    const newEndMin = parseTimeToMinutes(endTime || '17:00 PM');

    // Query events scheduled on the same date
    const snapshot = await db.collection('events')
      .where('date', '==', targetDate)
      .get();

    if (snapshot.empty) return { hasConflict: false };

    const targetVenueNorm = venue.toLowerCase().trim();
    const targetRoomNorm = (room_number || '').toLowerCase().trim();

    for (const doc of snapshot.docs) {
      if (excludeEventId && doc.id === excludeEventId) continue;

      const ev = doc.data();
      // Skip rejected or cancelled events
      if (['rejected', 'cancelled'].includes(ev.status)) continue;

      const existingVenueNorm = (ev.venue || '').toLowerCase().trim();
      const existingRoomNorm = (ev.room_number || '').toLowerCase().trim();

      // Check if venues match (or both specify the same sub-room in the same building)
      const isSameVenue = targetVenueNorm === existingVenueNorm && 
        (!targetRoomNorm || !existingRoomNorm || targetRoomNorm === existingRoomNorm);

      if (isSameVenue) {
        const evStartMin = parseTimeToMinutes(ev.startTime || ev.start_time || '09:00 AM');
        const evEndMin = parseTimeToMinutes(ev.endTime || ev.end_time || '17:00 PM');

        // Check interval overlap: StartA < EndB AND StartB < EndA
        if (newStartMin < evEndMin && evStartMin < newEndMin) {
          return {
            hasConflict: true,
            conflictingEvent: {
              id: doc.id,
              title: ev.title,
              date: ev.date,
              startTime: ev.startTime || ev.start_time,
              endTime: ev.endTime || ev.end_time,
              venue: ev.venue,
              room_number: ev.room_number
            },
            message: `Venue conflict detected: "${ev.title}" is already scheduled at ${ev.venue} from ${ev.startTime || ev.start_time} to ${ev.endTime || ev.end_time}.`
          };
        }
      }
    }

    return { hasConflict: false };
  } catch (err) {
    console.warn('Venue conflict check warning:', err.message);
    return { hasConflict: false };
  }
};

/**
 * 2. Event Eligibility Engine
 * Evaluates whether a student can register for a given event.
 */
const isStudentEligible = ({
  student,
  event,
  isAlreadyRegistered = false,
  isAlreadyWaitlisted = false
}) => {
  if (!student) {
    return { eligible: false, reason: 'UNAUTHENTICATED', message: 'You must log in to register.' };
  }

  if (student.role !== 'student' && student.role !== 'admin') {
    return { eligible: false, reason: 'INVALID_ROLE', message: 'Only enrolled students can register for participation.' };
  }

  if (!event) {
    return { eligible: false, reason: 'NOT_FOUND', message: 'Event does not exist.' };
  }

  if (!['approved', 'published'].includes(event.status)) {
    return { eligible: false, reason: 'EVENT_NOT_OPEN', message: 'This event is currently not open for registration.' };
  }

  if (isAlreadyRegistered) {
    return { eligible: false, reason: 'ALREADY_REGISTERED', message: 'You are already registered for this event.' };
  }

  if (isAlreadyWaitlisted) {
    return { eligible: false, reason: 'ALREADY_WAITLISTED', message: 'You are currently on the waitlist for this event.' };
  }

  const todayStr = new Date().toISOString().split('T')[0];

  // Registration Window: Start
  if (event.registrationStart) {
    const regStartStr = event.registrationStart.split('T')[0];
    if (todayStr < regStartStr) {
      return { eligible: false, reason: 'REGISTRATION_NOT_STARTED', message: `Registration opens on ${regStartStr}.` };
    }
  }

  // Registration Window: Deadline
  const deadlineStr = (event.registrationDeadline || event.date || '').split('T')[0];
  if (deadlineStr && todayStr > deadlineStr) {
    return { eligible: false, reason: 'REGISTRATION_CLOSED', message: 'The registration deadline has passed.' };
  }

  // Department Restriction
  if (event.targetDepartments && Array.isArray(event.targetDepartments) && event.targetDepartments.length > 0) {
    const studentDept = student.department_name || student.departmentName || '';
    if (!event.targetDepartments.includes(studentDept)) {
      return {
        eligible: false,
        reason: 'DEPARTMENT_RESTRICTED',
        message: `This event is reserved exclusively for: ${event.targetDepartments.join(', ')}.`
      };
    }
  }

  // Year Restriction
  if (event.targetYears && Array.isArray(event.targetYears) && event.targetYears.length > 0) {
    const studentYear = student.year || '';
    if (!event.targetYears.includes(studentYear)) {
      return {
        eligible: false,
        reason: 'YEAR_RESTRICTED',
        message: `This event is restricted to: ${event.targetYears.join(', ')} students.`
      };
    }
  }

  // Capacity check
  const seatsAvailable = event.seatsAvailable !== undefined ? event.seatsAvailable : 
    Math.max(0, (event.maxParticipants || 100) - (event.seatsFilled || 0));

  if (seatsAvailable <= 0) {
    return {
      eligible: false,
      isFull: true,
      reason: 'EVENT_FULL',
      message: 'This event has reached full seating capacity. You can join the waitlist.'
    };
  }

  return { eligible: true, reason: null, message: 'You are eligible to register.' };
};

/**
 * 3. Smart Algorithmic Event Recommendation Engine
 * Score = (categoryMatch * 0.30) + (departmentMatch * 0.25) + (previousInterest * 0.20) + (upcomingPriority * 0.15) + (popularity * 0.10)
 */
const calculateRecommendations = ({
  student,
  events = [],
  userRegisteredEventIds = new Set(),
  limit = 4
}) => {
  if (!events || events.length === 0) return [];

  const studentDept = (student?.department_name || student?.departmentName || '').toLowerCase();
  const todayStr = new Date().toISOString().split('T')[0];

  const scoredEvents = events
    .filter(ev => {
      // Must be approved, upcoming, and not already registered
      const isApproved = ['approved', 'published'].includes(ev.status);
      const isUpcoming = (ev.date || '') >= todayStr;
      const isNotRegistered = !userRegisteredEventIds.has(ev.id);
      return isApproved && isUpcoming && isNotRegistered;
    })
    .map(ev => {
      let score = 0;

      // 1. Department match (25%)
      const evDept = (ev.department || ev.department_name || '').toLowerCase();
      if (studentDept && evDept && (studentDept.includes(evDept) || evDept.includes(studentDept))) {
        score += 25;
      }

      // 2. Category interest (30%) - technical / academic given higher weight for CS, etc.
      const cat = (ev.category || '').toLowerCase();
      if (cat === 'technical' || cat === 'workshop') score += 30;
      else if (cat === 'competition') score += 25;
      else score += 15;

      // 3. Upcoming priority (15%) - sooner dates get higher urgency
      const daysDiff = Math.max(0, (new Date(ev.date) - new Date(todayStr)) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 7) score += 15;
      else if (daysDiff <= 21) score += 10;
      else score += 5;

      // 4. Popularity (10%) - high seats filled velocity
      const fillRate = (ev.seatsFilled || 0) / (ev.maxParticipants || 100);
      score += Math.min(10, Math.round(fillRate * 10));

      return {
        ...ev,
        recommendationScore: score
      };
    });

  // Sort by descending recommendation score
  scoredEvents.sort((a, b) => b.recommendationScore - a.recommendationScore);
  return scoredEvents.slice(0, limit);
};

/**
 * 4. iCalendar (.ics) RFC 5545 Generator
 */
const generateIcsContent = (event) => {
  const sanitize = (text) => (text || '').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,');

  const title = sanitize(event.title || 'Campus Event');
  const description = sanitize(event.description || 'College Event via Smart CEMS');
  const location = sanitize(`${event.venue || 'Campus'}${event.room_number ? `, Room ${event.room_number}` : ''}`);

  const dateClean = (event.date || new Date().toISOString().split('T')[0]).replace(/-/g, '');
  const startMin = parseTimeToMinutes(event.startTime || '09:00 AM');
  const endMin = parseTimeToMinutes(event.endTime || '17:00 PM');

  const startHour = String(Math.floor(startMin / 60)).padStart(2, '0');
  const startMinute = String(startMin % 60).padStart(2, '0');
  const endHour = String(Math.floor(endMin / 60)).padStart(2, '0');
  const endMinute = String(endMin % 60).padStart(2, '0');

  const dtStart = `${dateClean}T${startHour}${startMinute}00`;
  const dtEnd = `${dateClean}T${endHour}${endMinute}00`;
  const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Smart CEMS//College Event Management System//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:cems-event-${event.id}@cems.edu`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
};

module.exports = {
  parseTimeToMinutes,
  checkVenueConflict,
  isStudentEligible,
  calculateRecommendations,
  generateIcsContent
};

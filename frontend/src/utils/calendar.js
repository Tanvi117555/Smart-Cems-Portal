/**
 * Calendar Utilities: Google Calendar Link & .ics iCalendar file download
 */

// Generate Google Calendar Link
export const getGoogleCalendarUrl = (event) => {
  if (!event) return '#';

  const title = encodeURIComponent(event.title || 'Campus Event');
  const details = encodeURIComponent(
    `${event.description || ''}\n\nVenue: ${event.venue || ''}\nOrganized via Smart CEMS.`
  );
  const location = encodeURIComponent(
    `${event.venue || 'Campus Auditorium'} ${event.room_number ? `(${event.room_number})` : ''}`
  );

  // Format dates: YYYYMMDDTHHmmssZ
  let startFormatted = '';
  let endFormatted = '';

  try {
    const eventDate = event.date || new Date().toISOString().split('T')[0];
    const startTime = event.startTime || '09:00';
    const endTime = event.endTime || '17:00';

    // Basic ISO cleaning
    const startIso = new Date(`${eventDate}T${startTime}:00`).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endIso = new Date(`${eventDate}T${endTime}:00`).toISOString().replace(/-|:|\.\d\d\d/g, '');

    startFormatted = startIso;
    endFormatted = endIso;
  } catch (e) {
    const d = new Date().toISOString().replace(/-|:|\.\d\d\d/g, '');
    startFormatted = d;
    endFormatted = d;
  }

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startFormatted}/${endFormatted}&details=${details}&location=${location}`;
};

// Generate and trigger download of .ics iCalendar file
export const downloadIcsFile = (event) => {
  if (!event) return;

  const title = event.title || 'Campus Event';
  const desc = (event.description || '').replace(/\n/g, '\\n');
  const loc = `${event.venue || 'Campus'} ${event.room_number || ''}`;
  const eventDate = event.date || new Date().toISOString().split('T')[0];
  const startTime = (event.startTime || '09:00').replace(':', '') + '00';
  const endTime = (event.endTime || '17:00').replace(':', '') + '00';
  const dateFormatted = eventDate.replace(/-/g, '');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Smart CEMS//College Event Management System//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `SUMMARY:${title}`,
    `DESCRIPTION:${desc}`,
    `LOCATION:${loc}`,
    `DTSTART:${dateFormatted}T${startTime}`,
    `DTEND:${dateFormatted}T${endTime}`,
    `UID:cems-${event.id || Date.now()}@cems.edu`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${(event.title || 'event').replace(/[^a-zA-Z0-9]/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

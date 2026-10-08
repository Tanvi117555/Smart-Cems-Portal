const { db } = require('../config/firebase');
const { sendEmail, templates } = require('../utils/mailService');
const {
  checkVenueConflict,
  isStudentEligible,
  calculateRecommendations,
  generateIcsContent
} = require('../services/eventService');
const { logAudit } = require('../services/auditService');
const { sendNotification, notifyAdmins } = require('../services/notificationService');

/**
 * Get all events with rich search, category/department filters, and pagination
 */
const getEvents = async (req, res) => {
  try {
    const {
      search,
      category,
      department,
      status,
      is_paid,
      sort = 'upcoming',
      page = 1,
      limit = 12
    } = req.query;

    let queryRef = db.collection('events');

    // Filter by status: public only sees approved / published unless admin
    if (status && status !== 'all') {
      queryRef = queryRef.where('status', '==', status);
    } else if (!req.user || req.user.role !== 'admin') {
      queryRef = queryRef.where('status', 'in', ['approved', 'published', 'completed']);
    }

    if (category && category !== 'all') {
      queryRef = queryRef.where('category', '==', category);
    }

    if (department && department !== 'all') {
      queryRef = queryRef.where('department', '==', department);
    }

    const snapshot = await queryRef.get();
    let events = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      events.push({ id: doc.id, ...data });
    });

    // Client-side filtering for properties not indexed together
    if (is_paid !== undefined && is_paid !== '') {
      const paidBool = is_paid === 'true' || is_paid === '1';
      events = events.filter(e => Boolean(e.is_paid || e.fee > 0) === paidBool);
    }

    if (search && search.trim() !== '') {
      const term = search.trim().toLowerCase();
      events = events.filter(e =>
        (e.title && e.title.toLowerCase().includes(term)) ||
        (e.description && e.description.toLowerCase().includes(term)) ||
        (e.venue && e.venue.toLowerCase().includes(term)) ||
        (e.organizerName && e.organizerName.toLowerCase().includes(term))
      );
    }

    // Sorting
    if (sort === 'newest') {
      events.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sort === 'upcoming') {
      events.sort((a, b) => new Date(a.date || '9999-12-31') - new Date(b.date || '9999-12-31'));
    } else if (sort === 'most_registered') {
      events.sort((a, b) => (b.seatsFilled || 0) - (a.seatsFilled || 0));
    } else if (sort === 'alphabetical') {
      events.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    const total = events.length;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum;
    const paginatedEvents = events.slice(offset, offset + limitNum);

    return res.json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      events: paginatedEvents
    });
  } catch (error) {
    console.error('GetEvents Error:', error);
    return res.status(500).json({ success: false, message: 'Error retrieving events.' });
  }
};

/**
 * Get Featured Events
 */
const getFeaturedEvents = async (req, res) => {
  try {
    const snapshot = await db.collection('events')
      .where('status', 'in', ['approved', 'published'])
      .limit(6)
      .get();

    const events = [];
    snapshot.forEach(doc => {
      events.push({ id: doc.id, ...doc.data() });
    });

    return res.json({ success: true, events });
  } catch (error) {
    console.error('GetFeaturedEvents Error:', error);
    return res.status(500).json({ success: false, message: 'Error retrieving featured events.' });
  }
};

/**
 * Get Event by ID
 */
const getEventById = async (req, res) => {
  try {
    const eventId = req.params.id;
    const eventDoc = await db.collection('events').doc(eventId).get();

    if (!eventDoc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const eventData = { id: eventDoc.id, ...eventDoc.data() };

    // Check if current user is registered
    let isRegistered = false;
    let registrationData = null;

    if (req.user) {
      const regSnapshot = await db.collection('registrations')
        .where('eventId', '==', eventId)
        .where('studentId', '==', req.user.id)
        .get();

      const activeDoc = regSnapshot.docs.find(d => d.data().status !== 'cancelled');
      if (activeDoc) {
        isRegistered = true;
        registrationData = { id: activeDoc.id, ...activeDoc.data() };
      }
    }

    // Check if current user is on waitlist
    let isWaitlisted = false;
    let waitlistPosition = null;

    if (req.user) {
      const waitSnapshot = await db.collection('waitlist')
        .where('eventId', '==', eventId)
        .where('studentId', '==', req.user.id)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (!waitSnapshot.empty) {
        isWaitlisted = true;
        waitlistPosition = waitSnapshot.docs[0].data().position || 1;
      }
    }

    return res.json({
      success: true,
      event: eventData,
      isRegistered,
      registration: registrationData,
      isWaitlisted,
      waitlistPosition
    });
  } catch (error) {
    console.error('GetEventById Error:', error);
    return res.status(500).json({ success: false, message: 'Error retrieving event details.' });
  }
};

/**
 * Create a new Event (Faculty or Admin)
 */
const createEvent = async (req, res) => {
  try {
    const title = req.body.title;
    const description = req.body.description || '';
    const date = req.body.date;
    const startTime = req.body.startTime || req.body.start_time || '09:00 AM';
    const endTime = req.body.endTime || req.body.end_time || '05:00 PM';
    const venue = req.body.venue;
    const room_number = req.body.room_number || '';
    const building = req.body.building || '';
    const maxParticipants = req.body.maxParticipants || req.body.max_participants || 100;
    const is_paid = req.body.is_paid === 'true' || req.body.is_paid === true || (parseFloat(req.body.registration_fee || req.body.fee) > 0);
    const fee = is_paid ? (parseFloat(req.body.registration_fee || req.body.fee) || 0) : 0;
    const registrationStart = req.body.registrationStart || req.body.registration_start || date;
    const registrationDeadline = req.body.registrationDeadline || req.body.registration_end || date;

    if (!title || !date || !venue) {
      return res.status(400).json({ success: false, message: 'Please provide Title, Date, and Venue.' });
    }

    // Venue & Schedule Conflict Detection
    const conflict = await checkVenueConflict({
      date,
      startTime,
      endTime,
      venue,
      room_number
    });

    if (conflict.hasConflict) {
      return res.status(409).json({
        success: false,
        code: 'VENUE_CONFLICT',
        message: conflict.message,
        conflictingEvent: conflict.conflictingEvent
      });
    }

    // Resolve Category Name
    let categoryName = req.body.category || req.body.category_name;
    if (!categoryName && req.body.category_id) {
      const catDoc = await db.collection('categories').doc(String(req.body.category_id)).get();
      if (catDoc.exists) categoryName = catDoc.data().name;
    }
    categoryName = categoryName || 'Technical';

    // Resolve Department Name
    let departmentName = req.body.department || req.body.department_name;
    if (!departmentName && req.body.department_id) {
      const deptDoc = await db.collection('departments').doc(String(req.body.department_id)).get();
      if (deptDoc.exists) departmentName = deptDoc.data().name;
    }
    departmentName = departmentName || 'Computer Science & Engineering';

    // Handle Uploaded Banner
    let bannerImage = req.body.bannerImage || req.body.image;
    if (req.files && req.files.image && req.files.image[0]) {
      bannerImage = `/uploads/events/${req.files.image[0].filename}`;
    }
    if (!bannerImage) {
      bannerImage = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1200';
    }

    // Handle Uploaded Payment QR
    let paymentQrUrl = req.body.paymentQrUrl || req.body.payment_qr_url || '';
    if (req.files && req.files.qr_code && req.files.qr_code[0]) {
      paymentQrUrl = `/uploads/qr/${req.files.qr_code[0].filename}`;
    }

    // Safe rules parsing
    let rules = [];
    try {
      rules = typeof req.body.rules === 'string' ? JSON.parse(req.body.rules) : (req.body.rules || []);
    } catch (e) {
      rules = Array.isArray(req.body.rules) ? req.body.rules : [];
    }

    // Safe schedule parsing
    let schedule = [];
    try {
      schedule = typeof req.body.schedule === 'string' ? JSON.parse(req.body.schedule) : (req.body.schedule || []);
    } catch (e) {
      schedule = Array.isArray(req.body.schedule) ? req.body.schedule : [];
    }

    const capacity = parseInt(maxParticipants, 10) || 100;
    const initialStatus = req.user.role === 'admin' ? 'approved' : 'pending';

    const eventPayload = {
      title: title.trim(),
      description: description || '',
      category: categoryName,
      category_name: categoryName,
      category_id: req.body.category_id || 1,
      category_slug: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      department: departmentName,
      department_name: departmentName,
      department_id: req.body.department_id || 1,
      date,
      startTime,
      start_time: startTime,
      endTime,
      end_time: endTime,
      venue: venue.trim(),
      room_number,
      building,
      maxParticipants: capacity,
      max_participants: capacity,
      seatsFilled: 0,
      seatsAvailable: capacity,
      registered_count: 0,
      seats_remaining: capacity,
      fee,
      registration_fee: fee,
      is_paid,
      isPaid: is_paid,
      registrationStart,
      registration_start: registrationStart,
      registrationDeadline,
      registration_end: registrationDeadline,
      rules,
      schedule,
      bannerImage,
      image: bannerImage,
      paymentQrUrl,
      payment_qr_url: paymentQrUrl,
      qr_code_image: paymentQrUrl,
      organizerId: req.user.id || req.user.uid,
      organizer_id: req.user.id || req.user.uid,
      organizerName: req.user.name || 'Faculty Organizer',
      organizer_name: req.user.name || 'Faculty Organizer',
      contactEmail: req.user.email,
      contactPhone: req.user.phone || '',
      status: initialStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await db.collection('events').add(eventPayload);

    // Notify admins if created by faculty
    if (initialStatus === 'pending') {
      try {
        const adminUsers = await db.collection('users').where('role', '==', 'admin').get();
        const batch = db.batch();
        adminUsers.forEach(adminDoc => {
          const notifRef = db.collection('notifications').doc();
          batch.set(notifRef, {
            userId: adminDoc.id,
            title: 'New Event Approval Request 🏛️',
            message: `${req.user.name || 'Faculty'} submitted "${title}" for institutional approval.`,
            type: 'info',
            link: '/admin/events',
            isRead: false,
            createdAt: new Date().toISOString()
          });
        });
        await batch.commit();
      } catch (notifErr) {
        console.warn('Admin notification warning:', notifErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: initialStatus === 'approved' ? 'Event published successfully!' : 'Event submitted for admin review.',
      id: docRef.id,
      event: { id: docRef.id, ...eventPayload }
    });
  } catch (error) {
    console.error('CreateEvent Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create event.' });
  }
};

/**
 * Update Event (Organizer or Admin)
 */
const updateEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const eventDoc = await db.collection('events').doc(eventId).get();

    if (!eventDoc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const existingData = eventDoc.data();
    const userId = req.user.id || req.user.uid;
    if (req.user.role !== 'admin' && existingData.organizerId !== userId && existingData.organizer_id !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to edit this event.' });
    }

    let bannerImage = existingData.bannerImage || existingData.image;
    if (req.files && req.files.image && req.files.image[0]) {
      bannerImage = `/uploads/events/${req.files.image[0].filename}`;
    }

    let paymentQrUrl = existingData.paymentQrUrl || existingData.payment_qr_url || '';
    if (req.files && req.files.qr_code && req.files.qr_code[0]) {
      paymentQrUrl = `/uploads/qr/${req.files.qr_code[0].filename}`;
    }

    const startTime = req.body.startTime || req.body.start_time || existingData.startTime;
    const endTime = req.body.endTime || req.body.end_time || existingData.endTime;

    const updates = {
      ...req.body,
      ...(startTime && { startTime, start_time: startTime }),
      ...(endTime && { endTime, end_time: endTime }),
      ...(bannerImage && { bannerImage, image: bannerImage }),
      ...(paymentQrUrl && { paymentQrUrl, payment_qr_url: paymentQrUrl, qr_code_image: paymentQrUrl }),
      updatedAt: new Date().toISOString()
    };

    if (typeof updates.rules === 'string') {
      try { updates.rules = JSON.parse(updates.rules); } catch (e) { updates.rules = []; }
    }
    if (typeof updates.schedule === 'string') {
      try { updates.schedule = JSON.parse(updates.schedule); } catch (e) { updates.schedule = []; }
    }

    // Clean any undefined fields before updating Firestore
    Object.keys(updates).forEach(key => {
      if (updates[key] === undefined) delete updates[key];
    });

    if (updates.maxParticipants || updates.max_participants) {
      const newMax = parseInt(updates.maxParticipants || updates.max_participants, 10);
      updates.maxParticipants = newMax;
      updates.max_participants = newMax;
      updates.seatsAvailable = Math.max(0, newMax - (existingData.seatsFilled || existingData.registered_count || 0));
      updates.seats_remaining = updates.seatsAvailable;
    }

    await db.collection('events').doc(eventId).update(updates);

    return res.json({
      success: true,
      message: 'Event updated successfully.'
    });
  } catch (error) {
    console.error('UpdateEvent Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update event.' });
  }
};

/**
 * Delete Event (Organizer or Admin)
 */
const deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const eventDoc = await db.collection('events').doc(eventId).get();

    if (!eventDoc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const existingData = eventDoc.data();
    if (req.user.role !== 'admin' && existingData.organizerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this event.' });
    }

    await db.collection('events').doc(eventId).delete();

    return res.json({ success: true, message: 'Event deleted successfully.' });
  } catch (error) {
    console.error('DeleteEvent Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete event.' });
  }
};

/**
 * Admin: Approve Event
 */
const approveEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const eventDoc = await db.collection('events').doc(eventId).get();

    if (!eventDoc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const event = eventDoc.data();
    await db.collection('events').doc(eventId).update({
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: req.user.id,
      rejectionReason: null,
      updatedAt: new Date().toISOString()
    });

    // Notify organizer
    await db.collection('notifications').add({
      userId: event.organizerId,
      title: 'Event Approved & Published! 🎉',
      message: `Your event "${event.title}" has been approved and is now open for registrations.`,
      type: 'success',
      link: `/events/${eventId}`,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    return res.json({ success: true, message: 'Event approved successfully.' });
  } catch (error) {
    console.error('ApproveEvent Error:', error);
    return res.status(500).json({ success: false, message: 'Error approving event.' });
  }
};

/**
 * Admin: Reject Event
 */
const rejectEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const { reason } = req.body;

    const eventDoc = await db.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const event = eventDoc.data();
    await db.collection('events').doc(eventId).update({
      status: 'rejected',
      rejectionReason: reason || 'Does not meet institutional requirements.',
      rejectedAt: new Date().toISOString(),
      rejectedBy: req.user.id,
      updatedAt: new Date().toISOString()
    });

    // Notify organizer
    await db.collection('notifications').add({
      userId: event.organizerId,
      title: 'Event Revision Requested / Rejected ⚠️',
      message: `Your event "${event.title}" was not approved: ${reason || 'Contact administrator for details.'}`,
      type: 'warning',
      link: '/faculty/events',
      isRead: false,
      createdAt: new Date().toISOString()
    });

    return res.json({ success: true, message: 'Event rejected.' });
  } catch (error) {
    console.error('RejectEvent Error:', error);
    return res.status(500).json({ success: false, message: 'Error rejecting event.' });
  }
};

/**
 * Get My Events (Faculty)
 */
const getMyEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    let queryRef = db.collection('events');

    if (req.user.role !== 'admin') {
      queryRef = queryRef.where('organizerId', '==', userId);
    }

    const snapshot = await queryRef.get();
    const events = [];

    snapshot.forEach(doc => {
      events.push({ id: doc.id, ...doc.data() });
    });

    events.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return res.json({ success: true, events });
  } catch (error) {
    console.error('GetMyEvents Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve your events.' });
  }
};

/**
 * Real-Time Conflict Detection Check (Form Helper)
 */
const checkEventConflict = async (req, res) => {
  try {
    const { date, startTime, endTime, venue, room_number, excludeEventId } = req.body;
    const result = await checkVenueConflict({
      date,
      startTime,
      endTime,
      venue,
      room_number,
      excludeEventId
    });
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error('CheckConflict Error:', error);
    return res.status(500).json({ success: false, message: 'Conflict detection check failed.' });
  }
};

/**
 * Check Student Eligibility for Event
 */
const checkEligibility = async (req, res) => {
  try {
    const eventId = req.params.id;
    const student = req.user;

    const eventDoc = await db.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const event = { id: eventDoc.id, ...eventDoc.data() };

    // Check existing registration
    let isAlreadyRegistered = false;
    let isAlreadyWaitlisted = false;

    if (student) {
      const regSnap = await db.collection('registrations')
        .where('eventId', '==', eventId)
        .where('studentId', '==', student.id)
        .get();
      isAlreadyRegistered = regSnap.docs.some(d => d.data().status !== 'cancelled');

      const waitSnap = await db.collection('waitlist')
        .where('eventId', '==', eventId)
        .where('studentId', '==', student.id)
        .where('status', '==', 'active')
        .get();
      isAlreadyWaitlisted = !waitSnap.empty;
    }

    const result = isStudentEligible({
      student,
      event,
      isAlreadyRegistered,
      isAlreadyWaitlisted
    });

    return res.json({ success: true, ...result });
  } catch (error) {
    console.error('CheckEligibility Error:', error);
    return res.status(500).json({ success: false, message: 'Error checking eligibility.' });
  }
};

/**
 * Algorithmic Smart Recommendations (Student)
 */
const getRecommendedEvents = async (req, res) => {
  try {
    const student = req.user || null;
    const todayStr = new Date().toISOString().split('T')[0];

    const eventsSnap = await db.collection('events')
      .where('status', 'in', ['approved', 'published'])
      .get();

    const events = [];
    eventsSnap.forEach(d => {
      const data = { id: d.id, ...d.data() };
      if ((data.date || '') >= todayStr) {
        events.push(data);
      }
    });

    const registeredIds = new Set();
    if (student) {
      const regSnap = await db.collection('registrations')
        .where('studentId', '==', student.id)
        .get();
      regSnap.forEach(d => {
        if (d.data().status !== 'cancelled') {
          registeredIds.add(d.data().eventId);
        }
      });
    }

    const recommendations = calculateRecommendations({
      student,
      events,
      userRegisteredEventIds: registeredIds,
      limit: 6
    });

    return res.json({ success: true, events: recommendations });
  } catch (error) {
    console.error('GetRecommendations Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate recommendations.' });
  }
};

/**
 * Download iCalendar (.ics) RFC 5545
 */
const getEventCalendarIcs = async (req, res) => {
  try {
    const eventId = req.params.id;
    const eventDoc = await db.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      return res.status(404).send('Event not found.');
    }

    const event = { id: eventDoc.id, ...eventDoc.data() };
    const icsString = generateIcsContent(event);

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=event-${eventId}.ics`);
    return res.send(icsString);
  } catch (error) {
    console.error('CalendarIcs Error:', error);
    return res.status(500).send('Error generating calendar file.');
  }
};

module.exports = {
  getEvents,
  getFeaturedEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  approveEvent,
  rejectEvent,
  getMyEvents,
  checkEventConflict,
  checkEligibility,
  getRecommendedEvents,
  getEventCalendarIcs
};

const { db } = require('../config/firebase');
const { sendEmail, templates } = require('../utils/mailService');
const { generateRegistrationCode } = require('../utils/idGenerator');

/**
 * Concurrency-Safe Event Registration using Firestore Transaction
 */
const registerForEvent = async (req, res) => {
  try {
    const studentId = req.user.id;
    const event_id = req.body.event_id || req.body.eventId;
    const is_team = req.body.is_team || req.body.isTeam || false;
    const team_name = req.body.team_name || req.body.teamName || null;
    const team_members = req.body.team_members || req.body.teamMembers || null;

    if (!event_id) {
      return res.status(400).json({ success: false, message: 'Event ID is required.' });
    }

    const eventRef = db.collection('events').doc(event_id);
    const registrationId = generateRegistrationCode();
    const newRegRef = db.collection('registrations').doc();

    let createdRegistration = null;
    let eventTitle = '';
    let isPaidEvent = false;

    // Execute atomic transaction to prevent overselling seats
    await db.runTransaction(async (transaction) => {
      const eventDoc = await transaction.get(eventRef);

      if (!eventDoc.exists) {
        throw new Error('Event not found.');
      }

      const event = eventDoc.data();
      eventTitle = event.title;
      isPaidEvent = Boolean(event.is_paid || event.fee > 0);

      // 1. Status Check
      if (!['approved', 'published'].includes(event.status)) {
        throw new Error('This event is not currently accepting public registrations.');
      }

      // 2. Deadline Check
      const todayStr = new Date().toISOString().split('T')[0];
      const deadlineStr = (event.registrationDeadline || event.date || '').split('T')[0];
      if (todayStr > deadlineStr) {
        throw new Error('The registration deadline for this event has passed.');
      }

      // 3. Duplicate Registration Check
      const existingQuery = db.collection('registrations')
        .where('eventId', '==', event_id)
        .where('studentId', '==', studentId);

      const existingDocs = await transaction.get(existingQuery);
      const activeExisting = existingDocs.docs.find(doc => doc.data().status !== 'cancelled');
      if (activeExisting) {
        const existingReg = activeExisting.data();
        throw new Error(`You have already registered for this event. Pass ID: ${existingReg.registration_id || existingReg.registrationId}`);
      }

      // 4. Capacity & Seat Availability Check
      const currentFilled = event.seatsFilled || 0;
      const maxSeats = event.maxParticipants || 100;

      if (currentFilled >= maxSeats) {
        const err = new Error('This event has reached full capacity. You can join the waitlist.');
        err.isFull = true;
        throw err;
      }

      // Initial Status: Free is confirmed immediately; Paid requires payment verification
      const regStatus = isPaidEvent ? 'pending' : 'confirmed';

      createdRegistration = {
        id: newRegRef.id,
        registration_id: registrationId,
        registrationId,
        eventId: event_id,
        studentId,
        studentName: req.user.name,
        studentEmail: req.user.email,
        studentRollId: req.user.student_id || req.user.studentRollId || 'N/A',
        departmentName: req.user.department_name || req.user.departmentName || 'General',
        isTeam: Boolean(is_team),
        teamName: team_name || null,
        teamMembers: team_members || null,
        status: regStatus,
        paymentStatus: isPaidEvent ? 'pending' : 'free',
        checkedIn: false,
        checkedInAt: null,
        registeredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Set new registration
      transaction.set(newRegRef, createdRegistration);

      // Increment seatsFilled atomically
      const updatedFilled = currentFilled + 1;
      transaction.update(eventRef, {
        seatsFilled: updatedFilled,
        seatsAvailable: Math.max(0, maxSeats - updatedFilled),
        updatedAt: new Date().toISOString()
      });

      // Create in-app notification for student
      const notifRef = db.collection('notifications').doc();
      transaction.set(notifRef, {
        userId: studentId,
        title: isPaidEvent ? 'Registration Initiated (Payment Pending) 💳' : 'Registration Confirmed! 🎉',
        message: isPaidEvent
          ? `You initiated registration for "${event.title}". Please submit UPI payment proof to confirm your seat.`
          : `You are confirmed for "${event.title}". Pass Code: ${registrationId}`,
        type: isPaidEvent ? 'info' : 'success',
        link: '/student/registrations',
        isRead: false,
        createdAt: new Date().toISOString()
      });
    });

    // Send confirmation email asynchronously (do not block client)
    sendEmail({
      to: req.user.email,
      subject: `Registration Confirmed: ${eventTitle}`,
      html: templates.registrationConfirmed(
        req.user.name,
        eventTitle,
        registrationId,
        new Date().toLocaleDateString(),
        'Campus Venue'
      )
    }).catch(err => console.warn('Email dispatch failed:', err.message));

    return res.status(201).json({
      success: true,
      message: isPaidEvent ? 'Registration initiated! Please submit payment proof.' : 'Registration confirmed successfully!',
      registration: createdRegistration
    });
  } catch (error) {
    console.error('RegisterForEvent Error:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message || 'Error processing registration.',
      isFull: Boolean(error.isFull)
    });
  }
};

/**
 * Join Event Waitlist
 */
const joinWaitlist = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { event_id } = req.body;

    if (!event_id) {
      return res.status(400).json({ success: false, message: 'Event ID is required.' });
    }

    const eventDoc = await db.collection('events').doc(event_id).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    // Check if already on waitlist
    const existingWait = await db.collection('waitlist')
      .where('eventId', '==', event_id)
      .where('studentId', '==', studentId)
      .where('status', '==', 'active')
      .get();

    if (!existingWait.empty) {
      return res.status(400).json({
        success: false,
        message: `You are already on the waitlist at position #${existingWait.docs[0].data().position}.`
      });
    }

    // Count existing active waitlist entries
    const waitlistSnapshot = await db.collection('waitlist')
      .where('eventId', '==', event_id)
      .where('status', '==', 'active')
      .get();

    const position = waitlistSnapshot.size + 1;

    const waitlistRef = await db.collection('waitlist').add({
      eventId: event_id,
      studentId,
      studentName: req.user.name,
      studentEmail: req.user.email,
      eventTitle: eventDoc.data().title,
      position,
      status: 'active',
      joinedAt: new Date().toISOString()
    });

    return res.status(201).json({
      success: true,
      message: `You have joined the waitlist at position #${position}. You will be automatically enrolled if a seat opens up!`,
      position,
      id: waitlistRef.id
    });
  } catch (error) {
    console.error('JoinWaitlist Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to join waitlist.' });
  }
};

/**
 * Get My Registrations (Student)
 */
const getMyRegistrations = async (req, res) => {
  try {
    const studentId = req.user.id;

    const snapshot = await db.collection('registrations')
      .where('studentId', '==', studentId)
      .get();

    const registrations = [];

    for (const doc of snapshot.docs) {
      const reg = { id: doc.id, ...doc.data() };

      // Fetch corresponding event details
      if (reg.eventId) {
        const evDoc = await db.collection('events').doc(reg.eventId).get();
        if (evDoc.exists) {
          const evData = evDoc.data();
          reg.event_title = evData.title;
          reg.event_date = evData.date;
          reg.event_start_time = evData.startTime;
          reg.event_end_time = evData.endTime;
          reg.venue = evData.venue;
          reg.room_number = evData.room_number;
          reg.event_image = evData.bannerImage;
          reg.registration_fee = evData.fee || 0;
          reg.is_paid = evData.is_paid;
          reg.category_name = evData.category;
          reg.department_name = evData.department;
        }
      }

      registrations.push(reg);
    }

    registrations.sort((a, b) => new Date(b.registeredAt || 0) - new Date(a.registeredAt || 0));

    return res.json({ success: true, registrations });
  } catch (error) {
    console.error('GetMyRegistrations Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve registrations.' });
  }
};

/**
 * Get Event Participants (Organizer or Admin)
 */
const getEventParticipants = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const eventDoc = await db.collection('events').doc(eventId).get();

    if (!eventDoc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const event = eventDoc.data();
    if (req.user.role !== 'admin' && event.organizerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view attendee roster.' });
    }

    const snapshot = await db.collection('registrations')
      .where('eventId', '==', eventId)
      .get();

    const participants = [];
    snapshot.forEach(doc => {
      participants.push({ id: doc.id, ...doc.data() });
    });

    participants.sort((a, b) => new Date(b.registeredAt || 0) - new Date(a.registeredAt || 0));

    return res.json({
      success: true,
      event_title: event.title,
      total: participants.length,
      participants
    });
  } catch (error) {
    console.error('GetEventParticipants Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve participants.' });
  }
};

/**
 * Cancel Registration and Auto-Promote Waitlisted Student
 */
const cancelRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const regDoc = await db.collection('registrations').doc(id).get();

    if (!regDoc.exists) {
      return res.status(404).json({ success: false, message: 'Registration not found.' });
    }

    const reg = regDoc.data();
    if (req.user.role !== 'admin' && reg.studentId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to cancel this registration.' });
    }

    const eventId = reg.eventId;
    const eventRef = db.collection('events').doc(eventId);

    let promotedStudent = null;

    await db.runTransaction(async (transaction) => {
      // 1. Mark registration cancelled
      transaction.update(db.collection('registrations').doc(id), {
        status: 'cancelled',
        cancelledAt: new Date().toISOString()
      });

      // 2. Check for waitlisted students
      const waitlistQuery = db.collection('waitlist')
        .where('eventId', '==', eventId)
        .where('status', '==', 'active')
        .orderBy('joinedAt', 'asc')
        .limit(1);

      const waitDocs = await transaction.get(waitlistQuery);

      if (!waitDocs.empty) {
        const topWaitDoc = waitDocs.docs[0];
        const waitData = topWaitDoc.data();

        // Promote waitlisted student
        const newCode = generateRegistrationCode();
        const promoRegRef = db.collection('registrations').doc();

        transaction.set(promoRegRef, {
          registration_id: newCode,
          registrationId: newCode,
          eventId,
          studentId: waitData.studentId,
          studentName: waitData.studentName,
          studentEmail: waitData.studentEmail,
          status: 'confirmed',
          checkedIn: false,
          checkedInAt: null,
          promotedFromWaitlist: true,
          registeredAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        // Update waitlist entry
        transaction.update(topWaitDoc.ref, {
          status: 'promoted',
          promotedAt: new Date().toISOString()
        });

        // Notify promoted student
        const notifRef = db.collection('notifications').doc();
        transaction.set(notifRef, {
          userId: waitData.studentId,
          title: 'Waitlist Promotion! 🎉 Seat Confirmed',
          message: `A seat became available and you have been promoted for "${waitData.eventTitle}". Pass Code: ${newCode}`,
          type: 'success',
          link: '/student/registrations',
          isRead: false,
          createdAt: new Date().toISOString()
        });

        promotedStudent = waitData;
      } else {
        // No waitlist: Decrement seatsFilled
        const eventDoc = await transaction.get(eventRef);
        if (eventDoc.exists) {
          const evData = eventDoc.data();
          const newFilled = Math.max(0, (evData.seatsFilled || 1) - 1);
          transaction.update(eventRef, {
            seatsFilled: newFilled,
            seatsAvailable: Math.max(0, (evData.maxParticipants || 100) - newFilled),
            updatedAt: new Date().toISOString()
          });
        }
      }
    });

    if (promotedStudent) {
      sendEmail({
        to: promotedStudent.studentEmail,
        subject: `Promoted from Waitlist: ${promotedStudent.eventTitle}`,
        html: `<p>Great news! A seat opened up and you have been confirmed for <strong>${promotedStudent.eventTitle}</strong>.</p>`
      }).catch(err => console.warn('Email dispatch failed:', err.message));
    }

    return res.json({
      success: true,
      message: 'Registration cancelled.' + (promotedStudent ? ' Next student on waitlist was automatically enrolled!' : '')
    });
  } catch (error) {
    console.error('CancelRegistration Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to cancel registration.' });
  }
};

module.exports = {
  registerForEvent,
  joinWaitlist,
  getMyRegistrations,
  getEventParticipants,
  cancelRegistration
};

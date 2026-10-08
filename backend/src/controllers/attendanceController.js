const { db } = require('../config/firebase');

/**
 * Live QR Attendance Check-In Verification
 */
const verifyAndCheckIn = async (req, res) => {
  try {
    const eventId = req.body.eventId || req.body.event_id;
    const qrData = req.body.qrData || req.body.qr_data || req.body.code;
    const method = req.body.method || 'qr_scanner';
    const checkedInBy = req.user.id;

    if (!qrData) {
      return res.status(400).json({
        success: false,
        status: 'invalid',
        message: 'QR scan data or registration pass code is required.'
      });
    }

    // qrData can be a raw registration code (e.g. CEMS-2026-X8K4P2Q9) or a JSON payload
    let searchCode = qrData.trim();
    let embeddedEventId = eventId;
    try {
      const parsed = JSON.parse(qrData);
      if (parsed.registration_id || parsed.regId || parsed.registrationId) {
        searchCode = parsed.registration_id || parsed.regId || parsed.registrationId;
      }
      if (parsed.event_id || parsed.eventId) {
        embeddedEventId = parsed.event_id || parsed.eventId;
      }
    } catch (e) {
      // Raw string format
    }

    // 1. Fetch Registration
    let regQuery;
    if (embeddedEventId) {
      regQuery = await db.collection('registrations')
        .where('eventId', '==', embeddedEventId)
        .where('registrationId', '==', searchCode)
        .limit(1)
        .get();

      if (regQuery.empty) {
        regQuery = await db.collection('registrations')
          .where('eventId', '==', embeddedEventId)
          .where('registration_id', '==', searchCode)
          .limit(1)
          .get();
      }
    } else {
      regQuery = await db.collection('registrations')
        .where('registrationId', '==', searchCode)
        .limit(1)
        .get();

      if (regQuery.empty) {
        regQuery = await db.collection('registrations')
          .where('registration_id', '==', searchCode)
          .limit(1)
          .get();
      }
    }

    if (regQuery.empty) {
      return res.status(404).json({
        success: false,
        status: 'not_found',
        message: 'No registration pass found matching this code for this event.'
      });
    }

    const regDoc = regQuery.docs[0];
    const regData = regDoc.data();

    // 2. Validate Registration Status
    if (regData.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        status: 'cancelled',
        message: 'This registration has been cancelled.',
        attendee: regData
      });
    }

    if (regData.paymentStatus === 'pending' || regData.status === 'pending') {
      return res.status(400).json({
        success: false,
        status: 'payment_pending',
        message: 'Payment verification is still pending for this attendee.',
        attendee: regData
      });
    }

    // 3. Duplicate Check-in Guard
    if (regData.checkedIn) {
      return res.status(409).json({
        success: false,
        status: 'already_checked_in',
        message: `Attendee was already checked in at ${new Date(regData.checkedInAt).toLocaleTimeString()}.`,
        attendee: regData
      });
    }

    // 4. Record Check-In
    const now = new Date().toISOString();

    const checkInRecord = {
      registrationId: regData.registrationId || regData.registration_id,
      eventId: eventId || regData.eventId || regData.event_id || '',
      studentId: regData.studentId,
      studentName: regData.studentName,
      studentEmail: regData.studentEmail,
      studentRollId: regData.studentRollId || 'N/A',
      departmentName: regData.departmentName || 'General',
      checkedInAt: now,
      checkedInBy,
      method
    };

    const batch = db.batch();

    // Create checkIns document
    const checkInRef = db.collection('checkIns').doc();
    batch.set(checkInRef, checkInRecord);

    // Update registration document
    batch.update(regDoc.ref, {
      checkedIn: true,
      checkedInAt: now,
      checkInMethod: method
    });

    // Notify student of check-in
    const notifRef = db.collection('notifications').doc();
    batch.set(notifRef, {
      userId: regData.studentId,
      title: 'Gate Check-In Confirmed ✅',
      message: `You have successfully checked in for the event. Welcome!`,
      type: 'success',
      link: '/student/registrations',
      isRead: false,
      createdAt: now
    });

    await batch.commit();

    return res.json({
      success: true,
      status: 'success',
      message: `Check-in successful! Welcome, ${regData.studentName}.`,
      attendee: {
        ...regData,
        checkedIn: true,
        checkedInAt: now
      }
    });
  } catch (error) {
    console.error('VerifyAndCheckIn Error:', error);
    return res.status(500).json({
      success: false,
      status: 'error',
      message: 'Server error processing check-in.'
    });
  }
};

/**
 * Get Real-Time Attendance Statistics for an Event
 */
const getAttendanceStats = async (req, res) => {
  try {
    const { eventId } = req.params;

    const eventDoc = await db.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const regSnapshot = await db.collection('registrations')
      .where('eventId', '==', eventId)
      .where('status', 'in', ['confirmed', 'approved'])
      .get();

    const totalConfirmed = regSnapshot.size;

    const checkInSnapshot = await db.collection('checkIns')
      .where('eventId', '==', eventId)
      .get();

    const totalPresent = checkInSnapshot.size;
    const recentCheckIns = [];

    checkInSnapshot.forEach(doc => {
      recentCheckIns.push({ id: doc.id, ...doc.data() });
    });

    recentCheckIns.sort((a, b) => new Date(b.checkedInAt) - new Date(a.checkedInAt));

    return res.json({
      success: true,
      stats: {
        totalConfirmed,
        totalPresent,
        totalAbsent: Math.max(0, totalConfirmed - totalPresent),
        attendanceRate: totalConfirmed > 0 ? Math.round((totalPresent / totalConfirmed) * 100) : 0
      },
      recentCheckIns: recentCheckIns.slice(0, 20)
    });
  } catch (error) {
    console.error('GetAttendanceStats Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve attendance stats.' });
  }
};

module.exports = {
  verifyAndCheckIn,
  getAttendanceStats
};

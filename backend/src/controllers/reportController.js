const { db } = require('../config/firebase');
const { generateEventReport, generateRegistrationReceipt } = require('../utils/pdfGenerator');
const XLSX = require('xlsx');

/**
 * Download Event Summary Report PDF (Faculty or Admin)
 */
const getEventReportPDF = async (req, res) => {
  try {
    const { eventId } = req.params;

    const eventDoc = await db.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const event = { id: eventDoc.id, ...eventDoc.data() };

    // Authorization: Admin or Event Organizer
    if (req.user.role !== 'admin' && event.organizerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to download report for this event.' });
    }

    // Fetch Participants
    const regSnapshot = await db.collection('registrations')
      .where('eventId', '==', eventId)
      .get();

    const participants = [];
    regSnapshot.forEach(doc => {
      participants.push({ id: doc.id, ...doc.data() });
    });

    // Fetch Payments
    const paySnapshot = await db.collection('payments')
      .where('eventId', '==', eventId)
      .get();

    const payments = [];
    paySnapshot.forEach(doc => {
      payments.push({ id: doc.id, ...doc.data() });
    });

    // Fetch Feedback Summary
    let feedbackSummary = { totalResponses: 0, averageRating: '5.0' };
    const formSnapshot = await db.collection('events').doc(eventId).collection('feedbackForms').get();

    if (!formSnapshot.empty) {
      const formIds = formSnapshot.docs.map(d => d.id);
      const responsesSnapshot = await db.collection('feedbackResponses')
        .where('formId', 'in', formIds)
        .get();

      feedbackSummary.totalResponses = responsesSnapshot.size;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Event-Report-${event.id}.pdf`);

    generateEventReport({ event, participants, payments, feedbackSummary }, res);
  } catch (error) {
    console.error('GetEventReportPDF Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate PDF report.' });
  }
};

/**
 * Download Student Registration Ticket / Pass PDF (Supports query token)
 */
const getRegistrationTicketPDF = async (req, res) => {
  try {
    const { regId } = req.params;

    // Search by document ID or registration code
    let regDoc = await db.collection('registrations').doc(regId).get();
    let regData = null;

    if (regDoc.exists) {
      regData = { id: regDoc.id, ...regDoc.data() };
    } else {
      const querySnapshot = await db.collection('registrations')
        .where('registrationId', '==', regId)
        .limit(1)
        .get();

      if (!querySnapshot.empty) {
        regData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
      }
    }

    if (!regData) {
      return res.status(404).json({ success: false, message: 'Registration record not found.' });
    }

    // Authorization: Must be the student or faculty/admin
    if (req.user.role === 'student' && regData.studentId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to download this ticket.' });
    }

    // Fetch event details
    if (regData.eventId) {
      const eventDoc = await db.collection('events').doc(regData.eventId).get();
      if (eventDoc.exists) {
        const ev = eventDoc.data();
        regData.event_title = ev.title;
        regData.event_date = ev.date;
        regData.event_start_time = ev.startTime;
        regData.venue = ev.venue;
        regData.room_number = ev.room_number;
      }
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=CEMS-Pass-${regData.registrationId || regData.id}.pdf`);

    await generateRegistrationReceipt(regData, res);
  } catch (error) {
    console.error('GetRegistrationTicketPDF Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate pass PDF.' });
  }
};

/**
 * Export Event Attendees to Excel (.xlsx)
 */
const exportParticipantsExcel = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { department, status, checkInStatus } = req.query;

    const eventDoc = await db.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const event = eventDoc.data();
    if (req.user.role !== 'admin' && event.organizerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    let snapshot = await db.collection('registrations').where('eventId', '==', eventId).get();
    let records = [];

    snapshot.forEach(doc => {
      const d = doc.data();
      records.push(d);
    });

    if (department && department !== 'all') {
      records = records.filter(r => r.departmentName === department);
    }
    if (status && status !== 'all') {
      records = records.filter(r => r.status === status);
    }
    if (checkInStatus === 'checked_in') {
      records = records.filter(r => r.checkedIn);
    } else if (checkInStatus === 'not_checked_in') {
      records = records.filter(r => !r.checkedIn);
    }

    // Format for Excel worksheet
    const dataForExcel = records.map((r, i) => ({
      'S.No': i + 1,
      'Registration Pass ID': r.registrationId || r.registration_id,
      'Student Name': r.studentName || 'N/A',
      'Student Email': r.studentEmail || 'N/A',
      'Student Roll No': r.studentRollId || 'N/A',
      'Department': r.departmentName || 'General',
      'Registration Status': (r.status || 'confirmed').toUpperCase(),
      'Payment Status': (r.paymentStatus || 'free').toUpperCase(),
      'Gate Check-In': r.checkedIn ? 'PRESENT' : 'ABSENT',
      'Check-In Time': r.checkedInAt ? new Date(r.checkedInAt).toLocaleString() : 'N/A',
      'Registered Date': r.registeredAt ? new Date(r.registeredAt).toLocaleString() : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendees');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=CEMS-Attendees-${eventId}.xlsx`);

    return res.send(buffer);
  } catch (error) {
    console.error('ExportParticipantsExcel Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to export Excel spreadsheet.' });
  }
};

/**
 * Export Event Attendees to CSV
 */
const exportParticipantsCSV = async (req, res) => {
  try {
    const { eventId } = req.params;

    const snapshot = await db.collection('registrations').where('eventId', '==', eventId).get();
    const rows = [
      ['Registration Pass ID', 'Student Name', 'Email', 'Roll ID', 'Department', 'Status', 'Payment', 'Gate Check-In', 'Check-In Time']
    ];

    snapshot.forEach(doc => {
      const r = doc.data();
      rows.push([
        `"${r.registrationId || r.registration_id}"`,
        `"${r.studentName || ''}"`,
        `"${r.studentEmail || ''}"`,
        `"${r.studentRollId || ''}"`,
        `"${r.departmentName || ''}"`,
        `"${(r.status || '').toUpperCase()}"`,
        `"${(r.paymentStatus || '').toUpperCase()}"`,
        `"${r.checkedIn ? 'PRESENT' : 'ABSENT'}"`,
        `"${r.checkedInAt ? new Date(r.checkedInAt).toLocaleString() : 'N/A'}"`
      ]);
    });

    const csvContent = rows.map(e => e.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=CEMS-Attendees-${eventId}.csv`);

    return res.send(csvContent);
  } catch (error) {
    console.error('ExportParticipantsCSV Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to export CSV.' });
  }
};

module.exports = {
  getEventReportPDF,
  getRegistrationTicketPDF,
  exportParticipantsExcel,
  exportParticipantsCSV
};

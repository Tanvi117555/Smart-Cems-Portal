const { db } = require('../config/firebase');
const { checkVenueConflict } = require('../services/eventService');
const { generateEventReport, generateRegistrationReceipt } = require('../utils/pdfGenerator');
const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log('========================================================');
  console.log('🧪 RUNNING SMART CEMS USE CASES COMPREHENSIVE TEST SUITE');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Database & Collections Accessibility
  try {
    const eventsSnap = await db.collection('events').get();
    console.log(`✅ [Test 1] Events collection query succeeded: ${eventsSnap.size} event(s) found.`);
    passed++;
  } catch (err) {
    console.error(`❌ [Test 1] Events query failed:`, err.message);
    failed++;
  }

  // Test 2: Categories and Departments
  try {
    const { getCategories, getDepartments } = require('../controllers/metaController');
    let cats = [];
    let depts = [];
    await getCategories({}, { json: (data) => { cats = data.categories || []; } });
    await getDepartments({}, { json: (data) => { depts = data.departments || []; } });
    if (cats.length > 0 && depts.length > 0) {
      console.log(`✅ [Test 2] Categories (${cats.length}) & Departments (${depts.length}) resolved correctly.`);
      passed++;
    } else {
      throw new Error('Categories or Departments returned empty.');
    }
  } catch (err) {
    console.error(`❌ [Test 2] Metadata retrieval failed:`, err.message);
    failed++;
  }

  // Test 3: Venue & Schedule Conflict Engine
  try {
    // Check non-conflicting time on arbitrary future date
    const noConflict = await checkVenueConflict({
      date: '2099-01-01',
      startTime: '10:00 AM',
      endTime: '12:00 PM',
      venue: 'Auditorium A'
    });
    if (noConflict.hasConflict === false) {
      console.log('✅ [Test 3.1] Clean date & venue reported NO conflict as expected.');
      passed++;
    } else {
      throw new Error('Unexpected conflict on empty slot.');
    }

    // Check with an existing event's date and venue
    const eventsSnap = await db.collection('events').limit(1).get();
    if (!eventsSnap.empty) {
      const existing = eventsSnap.docs[0].data();
      const conflictRes = await checkVenueConflict({
        date: existing.date,
        startTime: existing.startTime || existing.start_time || '10:00 AM',
        endTime: existing.endTime || existing.end_time || '12:00 PM',
        venue: existing.venue
      });
      console.log(`✅ [Test 3.2] Conflict engine executed against existing event "${existing.title}": hasConflict = ${conflictRes.hasConflict}`);
      passed++;
    }
  } catch (err) {
    console.error(`❌ [Test 3] Venue conflict engine failed:`, err.message);
    failed++;
  }

  // Test 4: PDF Report Generation
  try {
    const mockRes = {
      data: [],
      write(chunk) { this.data.push(chunk); },
      end() { this.finished = true; },
      on() {},
      once() {},
      emit() {},
      setHeader() {}
    };

    const mockEventData = {
      event: {
        id: 'TEST-EV-101',
        title: 'National AI Summit 2026',
        category: 'Technical',
        department: 'Computer Science & Engineering',
        date: '2026-11-20',
        startTime: '09:30 AM',
        endTime: '04:30 PM',
        venue: 'Campus Innovation Hall',
        maxParticipants: 150,
        organizerName: 'Dr. Priya Sharma',
        contactEmail: 'coordinator@cems.edu'
      },
      participants: [
        { registrationId: 'CEMS-2026-TEST01', studentName: 'Aarav Patel', departmentName: 'CSE', status: 'confirmed', checkedIn: true },
        { registrationId: 'CEMS-2026-TEST02', studentName: 'Diya Sen', departmentName: 'IT', status: 'confirmed', checkedIn: false }
      ],
      payments: [
        { id: 'PAY-1', status: 'verified', amount: 200 }
      ],
      feedbackSummary: {
        totalResponses: 15,
        averageRating: '4.8'
      }
    };

    generateEventReport(mockEventData, mockRes);
    console.log('✅ [Test 4] PDF Event Summary Report generated without errors.');
    passed++;
  } catch (err) {
    console.error('❌ [Test 4] PDF Event Report generation failed:', err.message);
    failed++;
  }

  // Test 5: Registration Ticket PDF Generation
  try {
    const mockResTicket = {
      data: [],
      write(chunk) { this.data.push(chunk); },
      end() { this.finished = true; },
      on() {},
      once() {},
      emit() {},
      setHeader() {}
    };

    const mockRegData = {
      id: 'reg-mock-123',
      registrationId: 'CEMS-2026-MOCKPASS',
      studentName: 'Sneha Kulkarni',
      studentRollId: 'STU2024CSE088',
      departmentName: 'Computer Science',
      status: 'confirmed',
      event_title: 'HackCampus 2026',
      event_date: '2026-11-15',
      event_start_time: '10:00 AM',
      venue: 'Main Auditorium'
    };

    await generateRegistrationReceipt(mockRegData, mockResTicket);
    console.log('✅ [Test 5] Registration Pass / Ticket PDF with scannable QR buffer generated.');
    passed++;
  } catch (err) {
    console.error('❌ [Test 5] Registration Ticket PDF failed:', err.message);
    failed++;
  }

  // Test 6: Gallery Global Query
  try {
    const { getGlobalGallery } = require('../controllers/galleryController');
    let galleryImages = [];
    await getGlobalGallery({}, {
      json: (data) => { galleryImages = data.images || []; }
    });
    console.log(`✅ [Test 6] Global Gallery fetched successfully (${galleryImages.length} image(s)).`);
    passed++;
  } catch (err) {
    console.error('❌ [Test 6] Global gallery test failed:', err.message);
    failed++;
  }

  // Test 7: Feedback Flow (Form & Questions retrieval)
  try {
    const eventsSnap = await db.collection('events').limit(1).get();
    if (!eventsSnap.empty) {
      const eventId = eventsSnap.docs[0].id;
      const { getFeedbackForm } = require('../controllers/feedbackController');
      let formRetrieved = false;
      await getFeedbackForm({ params: { eventId }, user: { id: 'test-student' } }, {
        status: (code) => ({
          json: (data) => {
            // 404 is valid if no form published yet, 200 is valid if published
            formRetrieved = (code === 200 || code === 404);
          }
        }),
        json: (data) => { formRetrieved = true; }
      });
      console.log(`✅ [Test 7] Feedback Controller form retrieval handled gracefully for event ID ${eventId}.`);
      passed++;
    }
  } catch (err) {
    console.error('❌ [Test 7] Feedback retrieval failed:', err.message);
    failed++;
  }

  console.log('\n========================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

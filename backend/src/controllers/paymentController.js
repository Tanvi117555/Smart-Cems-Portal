const { db } = require('../config/firebase');
const { sendEmail, templates } = require('../utils/mailService');

/**
 * Submit Payment Proof (Student)
 */
const submitPayment = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { registration_id, transaction_id, amount, screenshot_url } = req.body;

    if (!registration_id || !transaction_id) {
      return res.status(400).json({ success: false, message: 'Registration ID and Transaction UTR are required.' });
    }

    // Verify registration belongs to student
    const regDoc = await db.collection('registrations').doc(registration_id).get();
    if (!regDoc.exists) {
      return res.status(404).json({ success: false, message: 'Registration record not found.' });
    }

    const reg = regDoc.data();
    if (reg.studentId !== studentId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    // Fetch Event
    let eventTitle = 'Campus Event';
    let organizerId = null;
    const evDoc = await db.collection('events').doc(reg.eventId).get();
    if (evDoc.exists) {
      eventTitle = evDoc.data().title;
      organizerId = evDoc.data().organizerId;
    }

    const paymentData = {
      registrationId: registration_id,
      registrationCode: reg.registrationId || reg.registration_id,
      eventId: reg.eventId,
      eventTitle,
      studentId,
      studentName: reg.studentName || req.user.name,
      studentEmail: reg.studentEmail || req.user.email,
      amount: parseFloat(amount) || reg.fee || 0,
      transactionId: transaction_id.trim(),
      screenshotUrl: screenshot_url || req.body.screenshotUrl || null,
      status: 'pending',
      rejectionReason: null,
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Check if payment already exists
    const existingPayments = await db.collection('payments')
      .where('registrationId', '==', registration_id)
      .limit(1)
      .get();

    let paymentId;
    if (!existingPayments.empty) {
      paymentId = existingPayments.docs[0].id;
      await db.collection('payments').doc(paymentId).update(paymentData);
    } else {
      const docRef = await db.collection('payments').add(paymentData);
      paymentId = docRef.id;
    }

    // Update registration payment status
    await db.collection('registrations').doc(registration_id).update({
      paymentStatus: 'pending',
      transactionId: transaction_id.trim(),
      updatedAt: new Date().toISOString()
    });

    // Notify organizer
    if (organizerId) {
      await db.collection('notifications').add({
        userId: organizerId,
        title: 'UPI Payment Proof Submitted 💳',
        message: `${req.user.name} submitted UTR: ${transaction_id.trim()} for "${eventTitle}". Requires audit.`,
        type: 'info',
        link: '/faculty/participants',
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }

    return res.json({
      success: true,
      message: 'Payment proof submitted successfully. The organizer will verify shortly.',
      paymentId
    });
  } catch (error) {
    console.error('SubmitPayment Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit payment details.' });
  }
};

/**
 * Verify Payment (Faculty or Admin)
 */
const verifyPayment = async (req, res) => {
  try {
    const paymentId = req.params.id;
    const verifierId = req.user.id;

    const paymentDoc = await db.collection('payments').doc(paymentId).get();
    if (!paymentDoc.exists) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    const payment = paymentDoc.data();
    const now = new Date().toISOString();

    const batch = db.batch();

    // 1. Update payment record
    batch.update(paymentDoc.ref, {
      status: 'verified',
      verifiedBy: verifierId,
      verifiedAt: now,
      rejectionReason: null,
      updatedAt: now
    });

    // 2. Update registration status to confirmed
    const regRef = db.collection('registrations').doc(payment.registrationId);
    batch.update(regRef, {
      status: 'confirmed',
      paymentStatus: 'verified',
      verifiedAt: now,
      updatedAt: now
    });

    // 3. Notify Student
    const notifRef = db.collection('notifications').doc();
    batch.set(notifRef, {
      userId: payment.studentId,
      title: 'Payment Verified & Pass Confirmed! 🎉',
      message: `Your payment of ₹${payment.amount} for "${payment.eventTitle}" was verified. Your pass is ready!`,
      type: 'success',
      link: '/student/registrations',
      isRead: false,
      createdAt: now
    });

    await batch.commit();

    // Email student
    sendEmail({
      to: payment.studentEmail,
      subject: `Payment Verified: ${payment.eventTitle}`,
      html: templates.paymentStatusUpdate(payment.studentName, payment.eventTitle, 'verified')
    }).catch(err => console.warn('Email dispatch failed:', err.message));

    return res.json({ success: true, message: 'Payment verified and registration confirmed!' });
  } catch (error) {
    console.error('VerifyPayment Error:', error);
    return res.status(500).json({ success: false, message: 'Error verifying payment.' });
  }
};

/**
 * Reject Payment (Faculty or Admin)
 */
const rejectPayment = async (req, res) => {
  try {
    const paymentId = req.params.id;
    const verifierId = req.user.id;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'A rejection reason is required.' });
    }

    const paymentDoc = await db.collection('payments').doc(paymentId).get();
    if (!paymentDoc.exists) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    const payment = paymentDoc.data();
    const now = new Date().toISOString();

    const batch = db.batch();

    // 1. Update payment record
    batch.update(paymentDoc.ref, {
      status: 'rejected',
      verifiedBy: verifierId,
      verifiedAt: now,
      rejectionReason: reason.trim(),
      updatedAt: now
    });

    // 2. Update registration status
    const regRef = db.collection('registrations').doc(payment.registrationId);
    batch.update(regRef, {
      paymentStatus: 'rejected',
      paymentRejectionReason: reason.trim(),
      updatedAt: now
    });

    // 3. Notify student
    const notifRef = db.collection('notifications').doc();
    batch.set(notifRef, {
      userId: payment.studentId,
      title: 'Payment Proof Rejected ⚠️',
      message: `Payment proof for "${payment.eventTitle}" was rejected: ${reason.trim()}. Please resubmit valid UTR.`,
      type: 'warning',
      link: '/student/registrations',
      isRead: false,
      createdAt: now
    });

    await batch.commit();

    // Email student
    sendEmail({
      to: payment.studentEmail,
      subject: `Payment Audit Notice: ${payment.eventTitle}`,
      html: templates.paymentStatusUpdate(payment.studentName, payment.eventTitle, 'rejected', reason.trim())
    }).catch(err => console.warn('Email dispatch failed:', err.message));

    return res.json({ success: true, message: 'Payment rejected with explanation sent to student.' });
  } catch (error) {
    console.error('RejectPayment Error:', error);
    return res.status(500).json({ success: false, message: 'Error rejecting payment.' });
  }
};

/**
 * Get All Payments (Admin)
 */
const getAllPayments = async (req, res) => {
  try {
    const snapshot = await db.collection('payments').get();
    const payments = [];

    snapshot.forEach(doc => {
      payments.push({ id: doc.id, ...doc.data() });
    });

    payments.sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));

    return res.json({ success: true, payments });
  } catch (error) {
    console.error('GetAllPayments Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve payments.' });
  }
};

module.exports = {
  submitPayment,
  verifyPayment,
  rejectPayment,
  getAllPayments
};

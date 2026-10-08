const { db } = require('../config/firebase');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { generateCertificateCode } = require('../utils/idGenerator');

/**
 * Generate Digital Certificates for Checked-In / Confirmed Event Attendees
 */
const generateCertificatesForEvent = async (req, res) => {
  try {
    const { eventId, customTitle = 'Certificate of Participation' } = req.body;
    const issuerId = req.user.id;

    const eventDoc = await db.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const event = eventDoc.data();

    // Fetch confirmed attendees who checked in (or all confirmed if gate check-in was optional)
    const regSnapshot = await db.collection('registrations')
      .where('eventId', '==', eventId)
      .where('status', 'in', ['confirmed', 'approved'])
      .get();

    if (regSnapshot.empty) {
      return res.status(400).json({ success: false, message: 'No confirmed attendees found for this event.' });
    }

    const createdCertificates = [];
    const batch = db.batch();
    const now = new Date().toISOString();

    for (const regDoc of regSnapshot.docs) {
      const reg = regDoc.data();

      // Check if certificate already exists
      const existingCert = await db.collection('certificates')
        .where('eventId', '==', eventId)
        .where('studentId', '==', reg.studentId)
        .limit(1)
        .get();

      if (existingCert.empty) {
        const certCode = generateCertificateCode();
        const certRef = db.collection('certificates').doc();

        const certData = {
          certificateId: certCode,
          certificateCode: certCode,
          title: customTitle,
          eventId,
          eventTitle: event.title,
          eventDate: event.date,
          studentId: reg.studentId,
          studentName: reg.studentName,
          studentEmail: reg.studentEmail,
          studentRollId: reg.studentRollId || 'N/A',
          departmentName: reg.departmentName || event.department || 'General',
          organizerName: event.organizerName || req.user.name,
          issuedAt: now,
          issuedBy: issuerId,
          verificationUrl: `${req.headers.origin || 'http://localhost:5173'}/verify-certificate/${certCode}`
        };

        batch.set(certRef, certData);
        createdCertificates.push(certData);

        // Notify student
        const notifRef = db.collection('notifications').doc();
        batch.set(notifRef, {
          userId: reg.studentId,
          title: 'Official Certificate Issued! 📜',
          message: `Your Certificate for "${event.title}" is ready for download. Verification ID: ${certCode}`,
          type: 'success',
          link: '/student/certificates',
          isRead: false,
          createdAt: now
        });
      }
    }

    await batch.commit();

    return res.status(201).json({
      success: true,
      message: `Generated ${createdCertificates.length} new certificates for "${event.title}".`,
      count: createdCertificates.length
    });
  } catch (error) {
    console.error('GenerateCertificates Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate certificates.' });
  }
};

/**
 * Public Verification Endpoint (No authentication required)
 */
const verifyCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;

    const certSnapshot = await db.collection('certificates')
      .where('certificateId', '==', certificateId)
      .limit(1)
      .get();

    if (certSnapshot.empty) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Certificate not found or invalid.'
      });
    }

    const certData = certSnapshot.docs[0].data();

    return res.json({
      success: true,
      valid: true,
      certificate: certData
    });
  } catch (error) {
    console.error('VerifyCertificate Error:', error);
    return res.status(500).json({ success: false, message: 'Verification lookup failed.' });
  }
};

/**
 * Get My Certificates (Student)
 */
const getMyCertificates = async (req, res) => {
  try {
    const studentId = req.user.id;
    const snapshot = await db.collection('certificates')
      .where('studentId', '==', studentId)
      .get();

    const certificates = [];
    snapshot.forEach(doc => {
      certificates.push({ id: doc.id, ...doc.data() });
    });

    certificates.sort((a, b) => new Date(b.issuedAt || 0) - new Date(a.issuedAt || 0));

    return res.json({ success: true, certificates });
  } catch (error) {
    console.error('GetMyCertificates Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve certificates.' });
  }
};

/**
 * Download Certificate PDF with embedded Verification QR Code
 */
const downloadCertificatePDF = async (req, res) => {
  try {
    const { certificateId } = req.params;

    const certSnapshot = await db.collection('certificates')
      .where('certificateId', '==', certificateId)
      .limit(1)
      .get();

    if (certSnapshot.empty) {
      return res.status(404).json({ success: false, message: 'Certificate not found.' });
    }

    const cert = certSnapshot.docs[0].data();

    // Generate Verification QR Code Buffer
    const verificationUrl = `${req.headers.origin || 'http://localhost:5173'}/verify-certificate/${cert.certificateId}`;
    const qrBuffer = await QRCode.toBuffer(verificationUrl, {
      width: 130,
      margin: 1,
      color: { dark: '#1e3a8a', light: '#ffffff' }
    });

    // Create Landscape A4 Certificate
    const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Certificate-${cert.certificateId}.pdf`);
    doc.pipe(res);

    const width = doc.page.width;
    const height = doc.page.height;

    // Outer decorative borders
    doc.rect(20, 20, width - 40, height - 40).lineWidth(4).stroke('#1e3a8a');
    doc.rect(26, 26, width - 52, height - 52).lineWidth(1.5).stroke('#d97706');

    // Header Institutional Banner
    doc.fillColor('#1e3a8a').fontSize(26).font('Helvetica-Bold').text('COLLEGE EVENT MANAGEMENT SYSTEM', 40, 60, { align: 'center' });
    doc.fontSize(11).font('Helvetica').fillColor('#64748b').text('AFFILIATED HIGHER EDUCATION INSTITUTION • OFFICIAL ACCREDITATION', 40, 95, { align: 'center' });

    // Certificate Title
    doc.moveDown(1.5);
    doc.fillColor('#d97706').fontSize(22).font('Helvetica-Bold').text((cert.title || 'CERTIFICATE OF PARTICIPATION').toUpperCase(), 40, 135, { align: 'center' });

    // Recipient Section
    doc.fillColor('#475569').fontSize(12).font('Helvetica-Oblique').text('This certificate is proudly awarded to', 40, 185, { align: 'center' });
    doc.fillColor('#0f172a').fontSize(24).font('Helvetica-Bold').text(cert.studentName, 40, 215, { align: 'center' });

    // Event & Details Description
    doc.fillColor('#334155').fontSize(11).font('Helvetica').text(
      `for active and successful participation in "${cert.eventTitle}", organized by the Department of ${cert.departmentName} on ${new Date(cert.eventDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`,
      100,
      255,
      { align: 'center', width: width - 200 }
    );

    // Signatures & QR Block
    const bottomY = height - 145;

    // Left Signature
    doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(90, bottomY + 45).lineTo(250, bottomY + 45).stroke();
    doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text(cert.organizerName, 90, bottomY + 52, { width: 160, align: 'center' });
    doc.fontSize(8).font('Helvetica').fillColor('#64748b').text('Faculty Convener', 90, bottomY + 68, { width: 160, align: 'center' });

    // Center Verification QR
    doc.image(qrBuffer, (width / 2) - 50, bottomY - 10, { width: 100 });
    doc.fontSize(8).font('Helvetica').fillColor('#64748b').text(`ID: ${cert.certificateId}`, 40, bottomY + 95, { align: 'center' });

    // Right Signature
    doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(width - 250, bottomY + 45).lineTo(width - 90, bottomY + 45).stroke();
    doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('Dean of Student Affairs', width - 250, bottomY + 52, { width: 160, align: 'center' });
    doc.fontSize(8).font('Helvetica').fillColor('#64748b').text('Institutional Authority', width - 250, bottomY + 68, { width: 160, align: 'center' });

    doc.end();
  } catch (error) {
    console.error('DownloadCertificatePDF Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate certificate PDF.' });
  }
};

module.exports = {
  generateCertificatesForEvent,
  verifyCertificate,
  getMyCertificates,
  downloadCertificatePDF
};

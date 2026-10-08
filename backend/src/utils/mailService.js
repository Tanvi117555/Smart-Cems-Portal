const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: process.env.EMAIL_PORT === '465',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }
  return null;
};

const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.log(`\n📧 [EMAIL SIMULATION]`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Message Snippet: ${(text || html || '').substring(0, 150)}...`);
    console.log(`-----------------------------------------\n`);
    return { simulated: true, success: true };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"CEMS Campus Events" <notifications@cems.edu>',
      to,
      subject,
      text: text || '',
      html
    });
    console.log(`📧 Email sent to ${to} [MessageId: ${info.messageId}]`);
    return { success: true, info };
  } catch (error) {
    console.warn(`⚠️ Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

// HTML Email Templates
const templates = {
  registrationConfirmed: (studentName, eventTitle, regId, date, venue) => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 25px; border-radius: 12px; background: #ffffff; border: 1px solid #e2e8f0;">
      <div style="background: linear-gradient(135deg, #1e3a8a, #4f46e5); padding: 24px; border-radius: 8px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px;">Registration Confirmed! 🎉</h1>
        <p style="margin: 6px 0 0 0; opacity: 0.9;">College Event Management System (CEMS)</p>
      </div>
      <div style="padding: 24px 8px; color: #1e293b;">
        <p>Dear <strong>${studentName}</strong>,</p>
        <p>Your registration for <strong>${eventTitle}</strong> has been successfully confirmed!</p>
        <div style="background: #f8fafc; border-left: 4px solid #4f46e5; padding: 14px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 4px 0;"><strong>Registration ID:</strong> <span style="color: #4f46e5; font-weight: bold;">${regId}</span></p>
          <p style="margin: 4px 0;"><strong>Event Date:</strong> ${date}</p>
          <p style="margin: 4px 0;"><strong>Venue:</strong> ${venue}</p>
        </div>
        <p>Please carry your College Student ID card to the venue for verification.</p>
        <p style="margin-top: 30px; font-size: 13px; color: #64748b;">Plan. Participate. Celebrate.<br>— CEMS Event Organizing Committee</p>
      </div>
    </div>
  `,

  paymentStatusUpdate: (studentName, eventTitle, status, reason = '') => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 25px; border-radius: 12px; background: #ffffff; border: 1px solid #e2e8f0;">
      <div style="background: ${status === 'verified' ? 'linear-gradient(135deg, #059669, #10b981)' : 'linear-gradient(135deg, #dc2626, #ef4444)'}; padding: 24px; border-radius: 8px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 22px;">Payment ${status === 'verified' ? 'Verified ✅' : 'Rejected ❌'}</h1>
        <p style="margin: 6px 0 0 0; opacity: 0.9;">College Event Management System (CEMS)</p>
      </div>
      <div style="padding: 24px 8px; color: #1e293b;">
        <p>Dear <strong>${studentName}</strong>,</p>
        <p>Your payment verification status for <strong>${eventTitle}</strong> has been updated to: 
          <strong style="color: ${status === 'verified' ? '#059669' : '#dc2626'}; text-transform: uppercase;">${status}</strong>.
        </p>
        ${reason ? `<div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 15px 0;"><strong>Reason:</strong> ${reason}</div>` : ''}
        <p>You can check your ticket and full receipt in your CEMS Student Dashboard.</p>
        <p style="margin-top: 30px; font-size: 13px; color: #64748b;">Plan. Participate. Celebrate.<br>— CEMS Accounts & Events Team</p>
      </div>
    </div>
  `,

  eventApprovalUpdate: (facultyName, eventTitle, status, reason = '') => `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 25px; border-radius: 12px; background: #ffffff; border: 1px solid #e2e8f0;">
      <div style="background: ${status === 'approved' ? 'linear-gradient(135deg, #1e3a8a, #3b82f6)' : 'linear-gradient(135deg, #991b1b, #ef4444)'}; padding: 24px; border-radius: 8px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 22px;">Event Proposal ${status === 'approved' ? 'Approved & Published 🎉' : 'Needs Revision ⚠️'}</h1>
        <p style="margin: 6px 0 0 0; opacity: 0.9;">Administrative Event Review</p>
      </div>
      <div style="padding: 24px 8px; color: #1e293b;">
        <p>Dear <strong>${facultyName}</strong>,</p>
        <p>Your submitted event proposal <strong>"${eventTitle}"</strong> has been reviewed by the College Administration.</p>
        <p>Status: <strong style="color: ${status === 'approved' ? '#2563eb' : '#dc2626'}; text-transform: uppercase;">${status}</strong></p>
        ${reason ? `<div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 15px 0;"><strong>Administrative Feedback:</strong> ${reason}</div>` : ''}
        <p>Log in to your Faculty Dashboard to view attendees, manage rounds, and monitor registrations.</p>
      </div>
    </div>
  `
};

module.exports = {
  sendEmail,
  templates
};

require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send an email
 * @param {Object} options - { to, subject, html }
 */
async function sendEmail({ to, subject, html }) {
  const mailOptions = {
    from: `"Calendly Clone" <${process.env.EMAIL_FROM || 'noreply@calendlyclone.com'}>`,
    to,
    subject,
    html,
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error('Email send error:', err.message);
    // Don't throw — email failure should not break booking flow
  }
}

module.exports = { sendEmail };

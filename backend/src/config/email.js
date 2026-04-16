require('dotenv').config();

/**
 * Send an email using Resend API over HTTP (port 443)
 * This avoids Railway/Vercel SMTP blocking on ports 25, 465, and 587.
 * @param {Object} options - { to, subject, html }
 */
async function sendEmail({ to, subject, html }) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY is not set. Skipping email send.');
    return;
  }

  const mailOptions = {
    // Resend requires using their onboarding domain until you verify your own domain
    from: "Calendly Clone <onboarding@resend.dev>",
    to: [to],
    subject,
    html,
  };

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mailOptions)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Resend API error');
    }
    
    console.log(`Email successfully sent via Resend to ${to}: ${data.id}`);
    return data;
  } catch (err) {
    console.error('Email send error:', err.message);
  }
}

module.exports = { sendEmail };


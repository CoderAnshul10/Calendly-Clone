const { format } = require('date-fns');
const { toZonedTime } = require('date-fns-tz');

function formatDateTime(isoString, timezone) {
  try {
    const zoned = toZonedTime(new Date(isoString), timezone);
    return format(zoned, "EEEE, MMMM d, yyyy 'at' h:mm a zzz");
  } catch {
    return isoString;
  }
}

function baseTemplate(content) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Calendly Clone</title>
  <style>
    body { margin: 0; padding: 0; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .header { background: #0069ff; padding: 32px 40px; }
    .header h1 { color: #fff; margin: 0; font-size: 24px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px; }
    .body { padding: 32px 40px; }
    .info-row { display: flex; align-items: flex-start; margin-bottom: 16px; }
    .info-label { font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; min-width: 100px; padding-top: 2px; }
    .info-value { font-size: 15px; color: #111827; flex: 1; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
    .cta { display: inline-block; margin-top: 8px; padding: 12px 24px; background: #0069ff; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; }
    .cancel-link { color: #6b7280; font-size: 13px; }
    .cancel-link a { color: #ef4444; text-decoration: underline; }
    .footer { padding: 20px 40px; background: #f9fafb; text-align: center; }
    .footer p { color: #9ca3af; font-size: 13px; margin: 0; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
    .badge-confirmed { background: #d1fae5; color: #065f46; }
    .badge-cancelled { background: #fee2e2; color: #991b1b; }
    .badge-rescheduled { background: #fef3c7; color: #92400e; }
  </style>
</head>
<body>
  <div class="wrapper">
    ${content}
    <div class="footer">
      <p>Sent by Calendly Clone &bull; <a href="${process.env.APP_URL}" style="color:#0069ff;">Visit App</a></p>
    </div>
  </div>
</body>
</html>`;
}

function bookingConfirmationEmail({ booking, eventType, hostName, isAdmin }) {
  const startFormatted = formatDateTime(booking.start_time, booking.timezone);
  const cancelUrl = `${process.env.APP_URL}/cancel/${booking.id}`;
  const rescheduleUrl = `${process.env.APP_URL}/reschedule/${booking.id}`;

  const title = isAdmin
    ? `New Booking: ${eventType.name}`
    : `Your booking is confirmed!`;

  const intro = isAdmin
    ? `<p style="color:#374151;font-size:15px;margin:0 0 24px;">You have a new booking from <strong>${booking.invitee_name}</strong>.</p>`
    : `<p style="color:#374151;font-size:15px;margin:0 0 24px;">Hi <strong>${booking.invitee_name}</strong>, your booking with <strong>${hostName}</strong> has been confirmed.</p>`;

  return baseTemplate(`
    <div class="header">
      <h1>${title}</h1>
      <p><span class="badge badge-confirmed">Confirmed</span></p>
    </div>
    <div class="body">
      ${intro}
      <div class="info-row"><span class="info-label">Event</span><span class="info-value">${eventType.name}</span></div>
      <div class="info-row"><span class="info-label">Duration</span><span class="info-value">${eventType.duration_minutes} minutes</span></div>
      <div class="info-row"><span class="info-label">When</span><span class="info-value">${startFormatted}</span></div>
      <div class="info-row"><span class="info-label">Invitee</span><span class="info-value">${booking.invitee_name} (${booking.invitee_email})</span></div>
      ${booking.notes ? `<div class="info-row"><span class="info-label">Notes</span><span class="info-value">${booking.notes}</span></div>` : ''}
      <hr class="divider" />
      ${!isAdmin ? `
        <p style="margin:0 0 12px;font-size:14px;color:#374151;">Need to make changes?</p>
        <a href="${rescheduleUrl}" class="cta">Reschedule</a>
        <p class="cancel-link" style="margin-top:12px;">Or <a href="${cancelUrl}">cancel this booking</a></p>
      ` : `
        <a href="${process.env.APP_URL}/admin/meetings" class="cta">View in Dashboard</a>
      `}
    </div>
  `);
}

function cancellationEmail({ booking, eventType, reason, cancelledBy }) {
  const startFormatted = formatDateTime(booking.start_time, booking.timezone);
  return baseTemplate(`
    <div class="header" style="background:#ef4444;">
      <h1>Booking Cancelled</h1>
      <p><span class="badge badge-cancelled">Cancelled</span></p>
    </div>
    <div class="body">
      <p style="color:#374151;font-size:15px;margin:0 0 24px;">Your booking for <strong>${eventType.name}</strong> has been cancelled${cancelledBy ? ` by ${cancelledBy}` : ''}.</p>
      <div class="info-row"><span class="info-label">Event</span><span class="info-value">${eventType.name}</span></div>
      <div class="info-row"><span class="info-label">When</span><span class="info-value">${startFormatted}</span></div>
      <div class="info-row"><span class="info-label">Invitee</span><span class="info-value">${booking.invitee_name}</span></div>
      ${reason ? `<div class="info-row"><span class="info-label">Reason</span><span class="info-value">${reason}</span></div>` : ''}
      <hr class="divider" />
      <a href="${process.env.APP_URL}/book/${eventType.slug}" class="cta">Book a new time</a>
    </div>
  `);
}

function rescheduleEmail({ oldBooking, newBooking, eventType, hostName }) {
  const newStart = formatDateTime(newBooking.start_time, newBooking.timezone);
  const cancelUrl = `${process.env.APP_URL}/cancel/${newBooking.id}`;
  return baseTemplate(`
    <div class="header" style="background:#f59e0b;">
      <h1>Booking Rescheduled</h1>
      <p><span class="badge badge-rescheduled">Rescheduled</span></p>
    </div>
    <div class="body">
      <p style="color:#374151;font-size:15px;margin:0 0 24px;">Your booking with <strong>${hostName}</strong> has been rescheduled.</p>
      <div class="info-row"><span class="info-label">Event</span><span class="info-value">${eventType.name}</span></div>
      <div class="info-row"><span class="info-label">New Time</span><span class="info-value">${newStart}</span></div>
      <div class="info-row"><span class="info-label">Invitee</span><span class="info-value">${newBooking.invitee_name}</span></div>
      <hr class="divider" />
      <a href="${cancelUrl}" style="color:#ef4444;font-size:14px;">Cancel this booking</a>
    </div>
  `);
}

module.exports = { bookingConfirmationEmail, cancellationEmail, rescheduleEmail };

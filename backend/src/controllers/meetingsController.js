const { Booking, EventType, BookingAnswer, sequelize } = require('../models');
const { Op } = require('sequelize');
const { sendEmail } = require('../config/email');
const { cancellationEmail, rescheduleEmail } = require('../utils/emailTemplates');
const { addMinutes } = require('date-fns');

const ADMIN_USER_ID = 1;

async function sendEmailsSafely(tasks) {
  try {
    await Promise.all(tasks);
  } catch (err) {
    console.error('Email dispatch failed:', err.message);
  }
}

async function getMeetings(req, res, next) {
  try {
    const { status } = req.query;
    const now = new Date();

    let whereClause = {};
    if (status === 'upcoming') {
      whereClause = { status: 'confirmed', start_time: { [Op.gte]: now } };
    } else if (status === 'past') {
      whereClause = {
        [Op.or]: [
          { start_time: { [Op.lt]: now } },
          { status: { [Op.in]: ['cancelled', 'rescheduled'] } },
        ],
      };
    }

    const bookings = await Booking.findAll({
      where: whereClause,
      include: [
        {
          model: EventType,
          as: 'eventType',
          where: { user_id: ADMIN_USER_ID },
          attributes: ['id', 'name', 'slug', 'color', 'duration_minutes'],
        },
        { model: BookingAnswer, as: 'answers' },
      ],
      order: [['start_time', status === 'past' ? 'DESC' : 'ASC']],
    });

    res.json(bookings);
  } catch (err) {
    next(err);
  }
}

async function cancelMeeting(req, res, next) {
  const t = await sequelize.transaction();
  let booking;
  let reason;
  try {
    const { id } = req.params;
    reason = req.body.reason;

    booking = await Booking.findByPk(id, {
      include: [{ model: EventType, as: 'eventType' }],
      transaction: t,
    });
    if (!booking) { await t.rollback(); return res.status(404).json({ error: 'Booking not found.' }); }
    if (booking.status !== 'confirmed') { await t.rollback(); return res.status(400).json({ error: 'Only confirmed bookings can be cancelled.' }); }

    await booking.update({ status: 'cancelled', cancel_reason: reason || null }, { transaction: t });
    await t.commit();
  } catch (err) {
    if (!t.finished) await t.rollback();
    next(err);
    return;
  }

  const html = cancellationEmail({
    booking,
    eventType: booking.eventType,
    reason,
    cancelledBy: 'the host',
  });

  await sendEmailsSafely([
    sendEmail({ to: booking.invitee_email, subject: 'Your booking has been cancelled', html }),
    sendEmail({ to: process.env.ADMIN_EMAIL, subject: `Booking cancelled: ${booking.eventType.name}`, html }),
  ]);

  res.json(booking);
}

async function rescheduleMeeting(req, res, next) {
  const t = await sequelize.transaction();
  let oldBooking;
  let newBooking;
  try {
    const { id } = req.params;
    const { new_start_time } = req.body;

    oldBooking = await Booking.findByPk(id, {
      include: [{ model: EventType, as: 'eventType' }],
      transaction: t,
    });
    if (!oldBooking) { await t.rollback(); return res.status(404).json({ error: 'Booking not found.' }); }
    if (oldBooking.status !== 'confirmed') { await t.rollback(); return res.status(400).json({ error: 'Only confirmed bookings can be rescheduled.' }); }

    const newEnd = addMinutes(new Date(new_start_time), oldBooking.eventType.duration_minutes);

    // Check for conflicts
    const conflict = await Booking.findOne({
      where: {
        id: { [Op.ne]: id },
        status: 'confirmed',
        [Op.or]: [
          { start_time: { [Op.between]: [new_start_time, newEnd] } },
          { end_time: { [Op.between]: [new_start_time, newEnd] } },
          { start_time: { [Op.lte]: new_start_time }, end_time: { [Op.gte]: newEnd } },
        ],
      },
      transaction: t,
    });
    if (conflict) { await t.rollback(); return res.status(409).json({ error: 'That time slot is no longer available.' }); }

    await oldBooking.update({ status: 'rescheduled' }, { transaction: t });

    newBooking = await Booking.create({
      event_type_id: oldBooking.event_type_id,
      invitee_name: oldBooking.invitee_name,
      invitee_email: oldBooking.invitee_email,
      start_time: new_start_time,
      end_time: newEnd.toISOString(),
      timezone: oldBooking.timezone,
      status: 'confirmed',
      notes: oldBooking.notes,
      buffer_before: oldBooking.buffer_before,
      buffer_after: oldBooking.buffer_after,
    }, { transaction: t });

    await t.commit();
  } catch (err) {
    if (!t.finished) await t.rollback();
    next(err);
    return;
  }

  const html = rescheduleEmail({
    oldBooking,
    newBooking,
    eventType: oldBooking.eventType,
    hostName: process.env.ADMIN_NAME || 'The Host',
  });

  await sendEmailsSafely([
    sendEmail({ to: oldBooking.invitee_email, subject: 'Your booking has been rescheduled', html }),
    sendEmail({ to: process.env.ADMIN_EMAIL, subject: `Booking rescheduled: ${oldBooking.eventType.name}`, html }),
  ]);

  res.json(newBooking);
}

module.exports = { getMeetings, cancelMeeting, rescheduleMeeting };

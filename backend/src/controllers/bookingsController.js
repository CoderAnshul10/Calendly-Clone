const { Booking, EventType, EventTypeQuestion, BookingAnswer, Availability, DateOverride, User, sequelize } = require('../models');
const { Op } = require('sequelize');
const { addMinutes } = require('date-fns');
const { generateSlots } = require('../utils/slots');
const { sendEmail } = require('../config/email');
const { bookingConfirmationEmail, cancellationEmail, rescheduleEmail } = require('../utils/emailTemplates');

const ADMIN_USER_ID = 1;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

async function loadAvailabilityContext(date) {
  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);

  const [availability, dateOverride, existingBookings] = await Promise.all([
    Availability.findAll({ where: { user_id: ADMIN_USER_ID } }),
    DateOverride.findOne({ where: { user_id: ADMIN_USER_ID, override_date: date } }),
    Booking.findAll({
      where: {
        status: 'confirmed',
        start_time: {
          [Op.between]: [
            new Date(dayStart.getTime() - ONE_DAY_MS),
            new Date(dayEnd.getTime() + ONE_DAY_MS),
          ],
        },
      },
      include: [
        {
          model: EventType,
          as: 'eventType',
          where: { user_id: ADMIN_USER_ID },
          attributes: ['id'],
        },
      ],
    }),
  ]);

  return { availability, dateOverride, existingBookings };
}

async function sendEmailsSafely(tasks) {
  try {
    await Promise.all(tasks);
  } catch (err) {
    console.error('Email dispatch failed:', err.message);
  }
}

async function getEventTypeBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    const eventType = await EventType.findOne({
      where: { slug, is_active: true, user_id: ADMIN_USER_ID },
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'timezone'] },
        { model: EventTypeQuestion, as: 'questions', separate: true, order: [['sort_order', 'ASC']] },
      ],
    });
    if (!eventType) return res.status(404).json({ error: 'Event type not found.' });

    const [availability, dateOverrides] = await Promise.all([
      Availability.findAll({ where: { user_id: ADMIN_USER_ID }, order: [['day_of_week', 'ASC']] }),
      DateOverride.findAll({ where: { user_id: ADMIN_USER_ID }, order: [['override_date', 'ASC']] }),
    ]);

    res.json({
      ...eventType.toJSON(),
      availability,
      dateOverrides,
    });
  } catch (err) {
    next(err);
  }
}

async function getSlots(req, res, next) {
  try {
    const { slug } = req.params;
    const { date, timezone } = req.query;

    if (!date) return res.status(400).json({ error: 'date query param is required (YYYY-MM-DD).' });

    const eventType = await EventType.findOne({
      where: { slug, is_active: true, user_id: ADMIN_USER_ID },
    });
    if (!eventType) return res.status(404).json({ error: 'Event type not found.' });

    const user = await User.findByPk(ADMIN_USER_ID);
    const hostTimezone = user.timezone || 'UTC';

    const { availability, dateOverride, existingBookings } = await loadAvailabilityContext(date);

    const slots = generateSlots({
      date,
      eventType,
      availability,
      dateOverride,
      existingBookings,
      hostTimezone,
      inviteeTimezone: timezone || hostTimezone,
    });

    res.json({ slots, timezone: timezone || hostTimezone });
  } catch (err) {
    next(err);
  }
}

async function createBooking(req, res, next) {
  const t = await sequelize.transaction();
  let eventType;
  let fullBooking;
  let inviteeEmail;
  let inviteeName;
  try {
    const { slug } = req.params;
    const { invitee_name, invitee_email, start_time, timezone, notes, answers } = req.body;
    inviteeEmail = invitee_email;
    inviteeName = invitee_name;

    eventType = await EventType.findOne({
      where: { slug, is_active: true, user_id: ADMIN_USER_ID },
      transaction: t,
    });
    if (!eventType) { await t.rollback(); return res.status(404).json({ error: 'Event type not found.' }); }

    const startUTC = new Date(start_time);
    const endUTC = addMinutes(startUTC, eventType.duration_minutes);
    const paddedStart = addMinutes(startUTC, -eventType.buffer_before);
    const paddedEnd = addMinutes(endUTC, eventType.buffer_after);

    // Check for double booking (within padded window)
    const conflict = await Booking.findOne({
      where: {
        status: 'confirmed',
        [Op.or]: [
          {
            start_time: { [Op.lt]: paddedEnd },
            end_time: { [Op.gt]: paddedStart },
          },
        ],
      },
      include: [
        { model: EventType, as: 'eventType', where: { user_id: ADMIN_USER_ID }, attributes: ['id'] },
      ],
      transaction: t,
    });

    if (conflict) {
      await t.rollback();
      return res.status(409).json({ error: 'This time slot is no longer available. Please choose another.' });
    }

    const booking = await Booking.create({
      event_type_id: eventType.id,
      invitee_name,
      invitee_email,
      start_time: startUTC.toISOString(),
      end_time: endUTC.toISOString(),
      timezone: timezone || 'UTC',
      status: 'confirmed',
      notes: notes || null,
      buffer_before: eventType.buffer_before,
      buffer_after: eventType.buffer_after,
    }, { transaction: t });

    // Save answers to custom questions
    if (answers && Array.isArray(answers) && answers.length > 0) {
      const answerRows = answers.map((a) => ({
        booking_id: booking.id,
        question: a.question,
        answer: a.answer,
      }));
      await BookingAnswer.bulkCreate(answerRows, { transaction: t });
    }

    fullBooking = await Booking.findByPk(booking.id, {
      include: [{ model: BookingAnswer, as: 'answers' }],
      transaction: t,
    });
    await t.commit();
  } catch (err) {
    if (!t.finished) await t.rollback();
    next(err);
    return;
  }

  const htmlInvitee = bookingConfirmationEmail({
    booking: fullBooking,
    eventType,
    hostName: process.env.ADMIN_NAME || 'The Host',
    isAdmin: false,
  });
  const htmlAdmin = bookingConfirmationEmail({
    booking: fullBooking,
    eventType,
    hostName: process.env.ADMIN_NAME || 'The Host',
    isAdmin: true,
  });

  await sendEmailsSafely([
    sendEmail({ to: inviteeEmail, subject: `Booking confirmed: ${eventType.name}`, html: htmlInvitee }),
    sendEmail({ to: process.env.ADMIN_EMAIL, subject: `New booking: ${eventType.name} with ${inviteeName}`, html: htmlAdmin }),
  ]);

  res.status(201).json(fullBooking);
}

async function getBooking(req, res, next) {
  try {
    const { id } = req.params;
    const booking = await Booking.findByPk(id, {
      include: [
        {
          model: EventType,
          as: 'eventType',
          include: [{ model: User, as: 'user', attributes: ['name', 'email', 'timezone'] }],
        },
        { model: BookingAnswer, as: 'answers' },
      ],
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    res.json(booking);
  } catch (err) {
    next(err);
  }
}

async function cancelBooking(req, res, next) {
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

  const html = cancellationEmail({ booking, eventType: booking.eventType, reason, cancelledBy: 'the invitee' });
  await sendEmailsSafely([
    sendEmail({ to: booking.invitee_email, subject: 'Booking cancelled', html }),
    sendEmail({ to: process.env.ADMIN_EMAIL, subject: `Booking cancelled: ${booking.eventType.name}`, html }),
  ]);

  res.json({ message: 'Booking cancelled.', booking });
}

async function rescheduleBooking(req, res, next) {
  const t = await sequelize.transaction();
  let oldBooking;
  let newBooking;
  try {
    const { id } = req.params;
    const { new_start_time, timezone } = req.body;

    oldBooking = await Booking.findByPk(id, {
      include: [{ model: EventType, as: 'eventType' }],
      transaction: t,
    });
    if (!oldBooking) { await t.rollback(); return res.status(404).json({ error: 'Booking not found.' }); }
    if (oldBooking.status !== 'confirmed') { await t.rollback(); return res.status(400).json({ error: 'Only confirmed bookings can be rescheduled.' }); }

    const newStart = new Date(new_start_time);
    const newEnd = addMinutes(newStart, oldBooking.eventType.duration_minutes);
    const paddedStart = addMinutes(newStart, -oldBooking.buffer_before);
    const paddedEnd = addMinutes(newEnd, oldBooking.buffer_after);

    const conflict = await Booking.findOne({
      where: {
        id: { [Op.ne]: id },
        status: 'confirmed',
        start_time: { [Op.lt]: paddedEnd },
        end_time: { [Op.gt]: paddedStart },
      },
      include: [{ model: EventType, as: 'eventType', where: { user_id: ADMIN_USER_ID } }],
      transaction: t,
    });
    if (conflict) { await t.rollback(); return res.status(409).json({ error: 'That time slot is no longer available.' }); }

    await oldBooking.update({ status: 'rescheduled' }, { transaction: t });

    newBooking = await Booking.create({
      event_type_id: oldBooking.event_type_id,
      invitee_name: oldBooking.invitee_name,
      invitee_email: oldBooking.invitee_email,
      start_time: newStart.toISOString(),
      end_time: newEnd.toISOString(),
      timezone: timezone || oldBooking.timezone,
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

  res.status(201).json(newBooking);
}

module.exports = { getEventTypeBySlug, getSlots, createBooking, getBooking, cancelBooking, rescheduleBooking };

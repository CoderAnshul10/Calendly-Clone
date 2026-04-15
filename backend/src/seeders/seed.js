require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { sequelize, User, EventType, Availability, Booking, EventTypeQuestion } = require('../models');
const { addDays, addMinutes, subDays } = require('date-fns');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to DB.');
    await sequelize.sync({ force: true });
    console.log('✅ Tables created (force sync).');

    // 1. Default user
    const user = await User.create({
      id: 1,
      name: 'Alex Johnson',
      email: 'alex@example.com',
      timezone: 'America/New_York',
    });
    console.log('✅ User created:', user.name);

    // 2. Event types
    const et1 = await EventType.create({
      user_id: 1,
      name: '15 Min Chat',
      slug: '15-min-chat',
      duration_minutes: 15,
      description: 'A quick 15-minute introductory chat.',
      color: '#0069ff',
      buffer_before: 5,
      buffer_after: 5,
      is_active: true,
    });

    const et2 = await EventType.create({
      user_id: 1,
      name: '30 Min Meeting',
      slug: '30-min-meeting',
      duration_minutes: 30,
      description: 'A focused 30-minute work session.',
      color: '#10b981',
      buffer_before: 10,
      buffer_after: 10,
      is_active: true,
    });

    const et3 = await EventType.create({
      user_id: 1,
      name: '1 Hour Deep Dive',
      slug: '1-hour-deep-dive',
      duration_minutes: 60,
      description: 'An in-depth 1-hour consultation or strategy session.',
      color: '#8b5cf6',
      buffer_before: 15,
      buffer_after: 15,
      is_active: true,
    });
    console.log('✅ Event types created.');

    // Add some custom questions to et2
    await EventTypeQuestion.create({
      event_type_id: et2.id,
      question_text: 'What topics would you like to cover?',
      is_required: true,
      sort_order: 1,
    });
    await EventTypeQuestion.create({
      event_type_id: et2.id,
      question_text: 'Have we spoken before?',
      is_required: false,
      sort_order: 2,
    });
    console.log('✅ Event type questions created.');

    // 3. Weekly availability: Mon–Fri 9am–5pm (user timezone is America/New_York)
    // day_of_week: 0=Sun,1=Mon,...,5=Fri,6=Sat
    for (let day = 1; day <= 5; day++) {
      await Availability.create({
        user_id: 1,
        day_of_week: day,
        start_time: '09:00:00',
        end_time: '17:00:00',
        is_active: true,
      });
    }
    // Weekend: inactive
    await Availability.create({ user_id: 1, day_of_week: 0, start_time: '09:00:00', end_time: '17:00:00', is_active: false });
    await Availability.create({ user_id: 1, day_of_week: 6, start_time: '09:00:00', end_time: '17:00:00', is_active: false });
    console.log('✅ Availability set (Mon–Fri 9am–5pm ET).');

    // 4. Sample bookings
    const now = new Date();

    // Find next Monday
    function nextWeekday(dayNum) {
      const d = new Date(now);
      while (d.getDay() !== dayNum) d.setDate(d.getDate() + 1);
      return d;
    }

    const nextMon = nextWeekday(1);
    const nextTue = nextWeekday(2);
    const nextWed = nextWeekday(3);

    // 3 upcoming bookings
    const up1Start = new Date(nextMon);
    up1Start.setUTCHours(14, 0, 0, 0); // 10am ET = 14:00 UTC (EST)
    await Booking.create({
      event_type_id: et1.id,
      invitee_name: 'Sarah Connor',
      invitee_email: 'sarah@example.com',
      start_time: up1Start,
      end_time: addMinutes(up1Start, 15),
      timezone: 'America/New_York',
      status: 'confirmed',
      notes: 'Looking forward to chatting!',
      buffer_before: et1.buffer_before,
      buffer_after: et1.buffer_after,
    });

    const up2Start = new Date(nextTue);
    up2Start.setUTCHours(15, 0, 0, 0); // 11am ET
    await Booking.create({
      event_type_id: et2.id,
      invitee_name: 'John Doe',
      invitee_email: 'john@example.com',
      start_time: up2Start,
      end_time: addMinutes(up2Start, 30),
      timezone: 'America/Chicago',
      status: 'confirmed',
      notes: 'Project kickoff discussion.',
      buffer_before: et2.buffer_before,
      buffer_after: et2.buffer_after,
    });

    const up3Start = new Date(nextWed);
    up3Start.setUTCHours(16, 0, 0, 0); // 12pm ET
    await Booking.create({
      event_type_id: et3.id,
      invitee_name: 'Priya Sharma',
      invitee_email: 'priya@example.com',
      start_time: up3Start,
      end_time: addMinutes(up3Start, 60),
      timezone: 'America/Los_Angeles',
      status: 'confirmed',
      notes: 'Strategy deep dive.',
      buffer_before: et3.buffer_before,
      buffer_after: et3.buffer_after,
    });

    // 2 past bookings
    const past1Start = subDays(now, 7);
    past1Start.setUTCHours(14, 0, 0, 0);
    await Booking.create({
      event_type_id: et1.id,
      invitee_name: 'Michael Scott',
      invitee_email: 'michael@dundermifflin.com',
      start_time: past1Start,
      end_time: addMinutes(past1Start, 15),
      timezone: 'America/New_York',
      status: 'cancelled',
      cancel_reason: 'Schedule conflict.',
      buffer_before: et1.buffer_before,
      buffer_after: et1.buffer_after,
    });

    const past2Start = subDays(now, 3);
    past2Start.setUTCHours(17, 0, 0, 0);
    await Booking.create({
      event_type_id: et2.id,
      invitee_name: 'Dwight Schrute',
      invitee_email: 'dwight@dundermifflin.com',
      start_time: past2Start,
      end_time: addMinutes(past2Start, 30),
      timezone: 'America/New_York',
      status: 'confirmed',
      notes: 'Bears. Beets. Battlestar Galactica.',
      buffer_before: et2.buffer_before,
      buffer_after: et2.buffer_after,
    });

    console.log('✅ Sample bookings created.');
    console.log('\n🎉 Seed complete! Your Calendly clone is ready.\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();

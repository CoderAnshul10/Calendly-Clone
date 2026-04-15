const { addMinutes, isAfter, isBefore, getDay } = require('date-fns');
const { fromZonedTime } = require('date-fns-tz');

/**
 * Generate available time slots for a given date and event type.
 *
 * @param {Object} params
 * @param {string} params.date         - 'YYYY-MM-DD' in the admin's (host) timezone
 * @param {Object} params.eventType    - EventType instance with duration_minutes, buffer_before, buffer_after
 * @param {Object[]} params.availability - Array of Availability rows for the user
 * @param {Object|null} params.dateOverride - DateOverride row for this date (or null)
 * @param {Object[]} params.existingBookings - Active bookings for the user on this date (UTC datetimes)
 * @param {string} params.hostTimezone - Admin user's timezone (e.g. 'America/New_York')
 * @returns {string[]} Array of ISO UTC datetime strings representing slot start times
 */
function generateSlots({
  date,
  eventType,
  availability,
  dateOverride,
  existingBookings,
  hostTimezone,
}) {
  const { duration_minutes, buffer_before = 0, buffer_after = 0 } = eventType;

  // Parse the requested date in host's timezone
  const localDate = new Date(`${date}T00:00:00`);
  const dayOfWeek = getDay(localDate); // 0=Sun...6=Sat

  let workStart = null;
  let workEnd = null;

  // Check date override first
  if (dateOverride) {
    if (dateOverride.is_unavailable) {
      return []; // Marked completely unavailable
    }
    if (dateOverride.start_time && dateOverride.end_time) {
      workStart = dateOverride.start_time; // 'HH:mm:ss'
      workEnd = dateOverride.end_time;
    }
  }

  // Fall back to regular weekly availability
  if (!workStart) {
    const avail = availability.find(
      (a) => a.day_of_week === dayOfWeek && a.is_active
    );
    if (!avail) return []; // Not available on this day
    workStart = avail.start_time;
    workEnd = avail.end_time;
  }

  // Build UTC Date objects for the work window
  const startStr = `${date}T${workStart.substring(0, 5)}:00`;
  const endStr = `${date}T${workEnd.substring(0, 5)}:00`;

  // Convert host local time → UTC
  const windowStartUTC = fromZonedTime(startStr, hostTimezone);
  const windowEndUTC = fromZonedTime(endStr, hostTimezone);

  // Generate candidate slots
  const slots = [];
  let cursor = new Date(windowStartUTC.getTime());

  // Account for buffer_before at the very start
  cursor = addMinutes(cursor, buffer_before);

  const now = new Date();

  while (true) {
    const slotStart = new Date(cursor.getTime());
    const slotEnd = addMinutes(slotStart, duration_minutes);
    const paddedStart = addMinutes(slotStart, -buffer_before);
    const paddedEnd = addMinutes(slotEnd, buffer_after);

    // Stop if the slot end exceeds the work window
    if (isAfter(paddedEnd, windowEndUTC)) break;

    // Filter out past slots
    if (isAfter(slotStart, now)) {
      // Check for conflicts with existing bookings
      const hasConflict = existingBookings.some((booking) => {
        const bStart = new Date(booking.start_time);
        const bEnd = new Date(booking.end_time);
        // Extend with booking's own buffers
        const bPaddedStart = addMinutes(bStart, -(booking.buffer_before || 0));
        const bPaddedEnd = addMinutes(bEnd, booking.buffer_after || 0);

        // Overlap check: paddedStart < bPaddedEnd && paddedEnd > bPaddedStart
        return (
          isBefore(paddedStart, bPaddedEnd) && isAfter(paddedEnd, bPaddedStart)
        );
      });

      if (!hasConflict) {
        slots.push(slotStart.toISOString());
      }
    }

    cursor = addMinutes(cursor, duration_minutes);
  }

  return slots;
}

module.exports = { generateSlots };

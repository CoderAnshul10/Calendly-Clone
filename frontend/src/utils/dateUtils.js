import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

/**
 * Format a UTC ISO string to a human-readable date/time in the given timezone.
 */
export function formatDateTime(isoString, timezone = 'UTC', fmt = "EEE, MMM d, yyyy 'at' h:mm a") {
  try {
    return formatInTimeZone(new Date(isoString), timezone, fmt);
  } catch {
    return isoString;
  }
}

/**
 * Format just the time portion.
 */
export function formatTime(isoString, timezone = 'UTC') {
  return formatDateTime(isoString, timezone, 'h:mm a');
}

/**
 * Format just the date portion.
 */
export function formatDate(isoString, timezone = 'UTC') {
  return formatDateTime(isoString, timezone, 'MMMM d, yyyy');
}

/**
 * Return a friendly label like "Today", "Tomorrow", or a date string.
 */
export function friendlyDate(isoString, timezone = 'UTC') {
  const zoned = toZonedTime(new Date(isoString), timezone);
  if (isToday(zoned)) return 'Today';
  if (isTomorrow(zoned)) return 'Tomorrow';
  return format(zoned, 'EEEE, MMMM d, yyyy');
}

/**
 * Get the user's local timezone via Intl API.
 */
export function getLocalTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * List all IANA timezones supported by the browser.
 */
export function getAllTimezones() {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    // Fallback list for older browsers
    return [
      'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
      'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo',
      'Asia/Kolkata', 'Australia/Sydney',
    ];
  }
}

/**
 * Get Google Calendar URL for a booking.
 */
export function getGoogleCalendarUrl({ title, startISO, endISO, description, location }) {
  const fmt = (iso) => new Date(iso).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${fmt(startISO)}/${fmt(endISO)}`,
    details: description || '',
    location: location || '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

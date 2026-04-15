import { useState, useMemo } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, subMonths, eachDayOfInterval, isSameMonth,
  isSameDay, isToday, isBefore, format, getDay,
} from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * CalendarPicker
 * Props:
 *   selectedDate: string | null (YYYY-MM-DD)
 *   onSelect: (dateStr: string) => void
 *   availability: Availability[] — array of { day_of_week, is_active }
 *   dateOverrides: DateOverride[] — array of { override_date, is_unavailable }
 *   timezone: string
 */
export default function CalendarPicker({ selectedDate, onSelect, availability = [], dateOverrides = [], timezone = 'UTC' }) {
  const [viewMonth, setViewMonth] = useState(() => {
    if (selectedDate) return new Date(`${selectedDate}T12:00:00Z`);
    return new Date();
  });

  const today = useMemo(() => toZonedTime(new Date(), timezone), [timezone]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [viewMonth]);

  // Build a set of active day-of-week numbers
  const activeDaysOfWeek = useMemo(() => {
    return new Set(availability.filter((a) => a.is_active).map((a) => a.day_of_week));
  }, [availability]);

  // Build a map of date-string → override
  const overrideMap = useMemo(() => {
    const map = {};
    dateOverrides.forEach((o) => { map[o.override_date] = o; });
    return map;
  }, [dateOverrides]);

  function isDateAvailable(date) {
    const todayLocal = toZonedTime(new Date(), timezone);
    todayLocal.setHours(0, 0, 0, 0);
    if (isBefore(date, todayLocal)) return false;

    const dateStr = format(date, 'yyyy-MM-dd');
    const override = overrideMap[dateStr];

    if (override) {
      if (override.is_unavailable) return false;
      return true; // Custom hours set
    }

    const dayOfWeek = getDay(date);
    return activeDaysOfWeek.has(dayOfWeek);
  }

  const selectedDateObj = selectedDate ? new Date(`${selectedDate}T12:00:00Z`) : null;

  return (
    <div className="select-none">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setViewMonth(subMonths(viewMonth, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
          aria-label="Previous month"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h3 className="text-base font-semibold text-gray-900">
          {format(viewMonth, 'MMMM yyyy')}
        </h3>

        <button
          onClick={() => setViewMonth(addMonths(viewMonth, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
          aria-label="Next month"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {calendarDays.map((date) => {
          const isCurrentMonth = isSameMonth(date, viewMonth);
          const available = isDateAvailable(date);
          const dateStr = format(date, 'yyyy-MM-dd');
          const isSelected = selectedDateObj && isSameDay(date, selectedDateObj);
          const isTodayDate = isToday(date);

          return (
            <button
              key={dateStr}
              disabled={!available || !isCurrentMonth}
              onClick={() => available && isCurrentMonth && onSelect(dateStr)}
              className={`
                relative mx-auto w-9 h-9 rounded-full text-sm font-medium transition-all flex items-center justify-center
                ${!isCurrentMonth ? 'invisible' : ''}
                ${isSelected
                  ? 'bg-blue-600 text-white shadow-md'
                  : available && isCurrentMonth
                    ? 'text-gray-900 hover:bg-blue-50 hover:text-blue-600 cursor-pointer'
                    : 'text-gray-300 cursor-not-allowed'
                }
                ${isTodayDate && !isSelected ? 'ring-2 ring-blue-200' : ''}
              `}
              aria-label={format(date, 'EEEE, MMMM d, yyyy')}
              aria-pressed={isSelected}
            >
              {format(date, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}

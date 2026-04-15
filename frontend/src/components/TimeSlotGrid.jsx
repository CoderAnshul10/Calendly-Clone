import { formatTime } from '../utils/dateUtils';
import Spinner from './Spinner';

/**
 * TimeSlotGrid
 * Props:
 *   slots: string[] — ISO UTC datetimes
 *   selectedSlot: string | null
 *   onSelect: (slotISO: string) => void
 *   loading: boolean
 *   timezone: string
 */
export default function TimeSlotGrid({ slots, selectedSlot, onSelect, loading, timezone }) {
  if (loading) {
    return (
      <div className="space-y-2 mt-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton h-11 rounded-lg w-full" />
        ))}
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <svg className="w-10 h-10 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm font-medium">No available times on this day.</p>
        <p className="text-xs mt-1">Try selecting a different date.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 mt-2 max-h-96 overflow-y-auto pr-1">
      {slots.map((slot) => {
        const isSelected = slot === selectedSlot;
        return (
          <button
            key={slot}
            onClick={() => onSelect(slot)}
            className={`
              w-full py-3 px-4 rounded-xl text-sm font-semibold border-2 transition-all
              ${isSelected
                ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-[1.01]'
                : 'bg-white text-blue-600 border-blue-200 hover:border-blue-500 hover:bg-blue-50'
              }
            `}
          >
            {formatTime(slot, timezone)}
          </button>
        );
      })}
    </div>
  );
}

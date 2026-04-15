import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import publicApi from '../../api/publicApi';
import CalendarPicker from '../../components/CalendarPicker';
import TimeSlotGrid from '../../components/TimeSlotGrid';
import Spinner from '../../components/Spinner';
import { usePublicSlots } from '../../hooks';
import { friendlyDate, getLocalTimezone, getAllTimezones, formatDateTime } from '../../utils/dateUtils';

export default function ReschedulePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [timezone, setTimezone] = useState(getLocalTimezone);
  const [submitting, setSubmitting] = useState(false);
  const [allTimezones] = useState(getAllTimezones);

  const slug = booking?.eventType?.slug;
  const { slots, loading: loadingSlots } = usePublicSlots(slug, selectedDate, timezone);

  useEffect(() => {
    async function fetch() {
      try {
        const res = await publicApi.get(`/booking/${id}`);
        setBooking(res.data);
        setTimezone(res.data.timezone || getLocalTimezone());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [id]);

  async function handleReschedule() {
    if (!selectedSlot) return;
    setSubmitting(true);
    try {
      const res = await publicApi.put(`/booking/${id}/reschedule`, {
        new_start_time: selectedSlot,
        timezone,
      });
      toast.success('Booking rescheduled!');
      navigate(`/confirmation/${res.data.id}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="xl" /></div>;
  if (error || !booking) return <div className="min-h-screen flex items-center justify-center"><p className="text-red-500">{error || 'Booking not found.'}</p></div>;

  if (booking.status !== 'confirmed') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-gray-600 text-lg">This booking cannot be rescheduled (status: <strong>{booking.status}</strong>).</p>
          <Link to={`/book/${booking?.eventType?.slug}`} className="btn-primary mt-4 inline-block">Book a new time</Link>
        </div>
      </div>
    );
  }

  const eventType = booking.eventType;
  const availability = eventType?.availability || [];
  const dateOverrides = eventType?.dateOverrides || [];

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center p-4 py-8 md:py-16">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">

        {/* Left panel */}
        <div className="md:w-72 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-200 p-8 flex-shrink-0">
          <div className="mb-2">
            <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">Rescheduling</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mt-3">{eventType?.name}</h2>
          <p className="text-sm text-gray-500 mt-1">Current time:</p>
          <p className="text-sm text-gray-700 font-medium">{formatDateTime(booking.start_time, booking.timezone)}</p>

          {selectedSlot && (
            <div className="mt-6 p-3 bg-blue-50 rounded-xl border border-blue-100 text-sm">
              <p className="font-semibold text-blue-700 mb-1">New time</p>
              <p className="text-gray-700">{friendlyDate(selectedSlot, timezone)}</p>
              <p className="text-gray-700 font-medium">{formatDateTime(selectedSlot, timezone, 'h:mm a')}</p>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="flex-1 p-8">
          <div className="mb-6 flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
            </svg>
            <select
              className="text-sm text-gray-600 border-0 bg-transparent focus:outline-none"
              value={timezone}
              onChange={(e) => { setTimezone(e.target.value); setSelectedSlot(null); }}
            >
              {allTimezones.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>

          <div className={`${selectedDate ? 'grid grid-cols-1 sm:grid-cols-2 gap-8' : ''}`}>
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-4">Select a New Date</h3>
              <CalendarPicker
                selectedDate={selectedDate}
                onSelect={(d) => { setSelectedDate(d); setSelectedSlot(null); }}
                  availability={availability}
                  dateOverrides={dateOverrides}
                timezone={timezone}
              />
            </div>

            {selectedDate && (
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">{friendlyDate(`${selectedDate}T12:00:00Z`, timezone)}</h3>
                <p className="text-sm text-gray-400 mb-3">{timezone}</p>
                <TimeSlotGrid
                  slots={slots}
                  selectedSlot={selectedSlot}
                  onSelect={setSelectedSlot}
                  loading={loadingSlots}
                  timezone={timezone}
                />
              </div>
            )}
          </div>

          {selectedSlot && (
            <div className="mt-6">
              <button
                onClick={handleReschedule}
                disabled={submitting}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
              >
                {submitting && <Spinner size="sm" />}
                Confirm New Time
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

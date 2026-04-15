import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import publicApi from '../../api/publicApi';
import Spinner from '../../components/Spinner';
import { formatDateTime, friendlyDate, getGoogleCalendarUrl } from '../../utils/dateUtils';

export default function ConfirmationPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchBooking() {
      try {
        const res = await publicApi.get(`/booking/${id}`);
        setBooking(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchBooking();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Booking not found</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  const eventType = booking.eventType;
  const hostUser = eventType?.user;
  const timezone = booking.timezone || 'UTC';

  const gcalUrl = getGoogleCalendarUrl({
    title: `${eventType?.name} with ${hostUser?.name}`,
    startISO: booking.start_time,
    endISO: booking.end_time,
    description: booking.notes || '',
  });

  const isCancelled = booking.status === 'cancelled';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Top banner */}
          <div className={`px-8 py-8 text-center ${isCancelled ? 'bg-red-50' : 'bg-gradient-to-br from-blue-600 to-blue-700'}`}>
            {isCancelled ? (
              <>
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-red-700">Booking Cancelled</h1>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-white">You're scheduled!</h1>
                <p className="text-blue-100 mt-1 text-sm">A confirmation email has been sent to your inbox.</p>
              </>
            )}
          </div>

          {/* Details */}
          <div className="px-8 py-6 space-y-4">
            {/* Event name */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: eventType?.color || '#0069ff' }}>
                {hostUser?.name?.charAt(0) || 'A'}
              </div>
              <div>
                <p className="text-xs text-gray-400">{hostUser?.name}</p>
                <p className="font-semibold text-gray-900">{eventType?.name}</p>
              </div>
            </div>

            {/* Time info */}
            <div className="space-y-3 text-sm">
              <InfoRow icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              } label="Date & Time">
                <p className="font-medium text-gray-900">{friendlyDate(booking.start_time, timezone)}</p>
                <p className="text-gray-600">
                  {formatDateTime(booking.start_time, timezone, 'h:mm a')} –{' '}
                  {formatDateTime(booking.end_time, timezone, 'h:mm a')}
                </p>
                <p className="text-xs text-gray-400">{timezone}</p>
              </InfoRow>

              <InfoRow icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              } label="Invitee">
                <p className="font-medium text-gray-900">{booking.invitee_name}</p>
                <p className="text-gray-500">{booking.invitee_email}</p>
              </InfoRow>

              {booking.notes && (
                <InfoRow icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                } label="Notes">
                  <p className="text-gray-600 italic">"{booking.notes}"</p>
                </InfoRow>
              )}
            </div>

            {/* Actions */}
            {!isCancelled && (
              <div className="pt-4 space-y-3">
                <a
                  href={gcalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.5 3h-2V1.5h-1.5V3h-9V1.5H5.5V3h-2C2.675 3 2 3.675 2 4.5v15c0 .825.675 1.5 1.5 1.5h16c.825 0 1.5-.675 1.5-1.5v-15c0-.825-.675-1.5-1.5-1.5zm0 16.5h-16V9h16v10.5zm0-12h-16V4.5h2V6H7V4.5h9V6h1.5V4.5h2V7.5z" />
                  </svg>
                  Add to Google Calendar
                </a>

                <div className="flex gap-3">
                  <Link
                    to={`/reschedule/${booking.id}`}
                    className="flex-1 text-center py-2 text-sm text-blue-600 hover:text-blue-800 font-medium border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Reschedule
                  </Link>
                  <Link
                    to={`/cancel/${booking.id}`}
                    className="flex-1 text-center py-2 text-sm text-red-500 hover:text-red-700 font-medium border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Cancel
                  </Link>
                </div>
              </div>
            )}

            {isCancelled && (
              <Link
                to={`/book/${eventType?.slug}`}
                className="btn-primary w-full block text-center"
              >
                Book a new time
              </Link>
            )}
          </div>
        </div>

        {/* Booking ID */}
        <p className="text-center text-xs text-gray-400 mt-4">Booking #{booking.id}</p>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-gray-400 flex-shrink-0">{icon}</div>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
        {children}
      </div>
    </div>
  );
}

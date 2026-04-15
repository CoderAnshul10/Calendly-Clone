import { useState } from 'react';
import toast from 'react-hot-toast';
import { useBookings } from '../../hooks';
import adminApi from '../../api/adminApi';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import { formatDateTime, friendlyDate } from '../../utils/dateUtils';

function MeetingCard({ booking, onCancelled }) {
  const [cancelling, setCancelling] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [reason, setReason] = useState('');

  async function handleCancel(e) {
    e.preventDefault();
    setCancelling(true);
    try {
      await adminApi.put(`/meetings/${booking.id}/cancel`, { reason });
      toast.success('Meeting cancelled.');
      setShowCancel(false);
      onCancelled();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(false);
    }
  }

  const startFormatted = formatDateTime(booking.start_time, booking.timezone);
  const endTime = formatDateTime(booking.end_time, booking.timezone, 'h:mm a');

  return (
    <>
      <div className="card p-5 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ backgroundColor: booking.eventType?.color || '#0069ff' }}>
              {booking.invitee_name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900">{booking.invitee_name}</h3>
                <Badge status={booking.status} />
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{booking.invitee_email}</p>
              <div className="mt-2 space-y-1">
                <p className="text-sm font-medium text-gray-800">
                  <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: booking.eventType?.color || '#0069ff' }} />
                  {booking.eventType?.name}
                </p>
                <p className="text-sm text-gray-600">
                  {startFormatted} – {endTime}
                </p>
                <p className="text-xs text-gray-400">{booking.timezone}</p>
                {booking.notes && (
                  <p className="text-xs text-gray-500 mt-1 italic">"{booking.notes}"</p>
                )}
                {booking.cancel_reason && (
                  <p className="text-xs text-red-500 mt-1">Cancelled: {booking.cancel_reason}</p>
                )}
              </div>
            </div>
          </div>
          {booking.status === 'confirmed' && (
            <div className="flex gap-2 flex-shrink-0 flex-wrap">
              <a href={`/reschedule/${booking.id}`} className="btn-primary text-sm">
                Reschedule
              </a>
              <button onClick={() => setShowCancel(true)} className="btn-danger text-sm">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showCancel} onClose={() => setShowCancel(false)} title="Cancel Meeting">
        <form onSubmit={handleCancel} className="space-y-4">
          <p className="text-sm text-gray-600">
            Cancel meeting with <strong>{booking.invitee_name}</strong>? Both parties will be notified.
          </p>
          <div>
            <label className="label">Reason (optional)</label>
            <textarea className="input resize-none" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Let them know why..." />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowCancel(false)} className="btn-secondary flex-1">Keep</button>
            <button type="submit" disabled={cancelling} className="flex-1 btn-danger flex items-center justify-center gap-2">
              {cancelling && <Spinner size="sm" />} Yes, Cancel
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default function MeetingsPage() {
  const [tab, setTab] = useState('upcoming');
  const { bookings, loading, error, refetch } = useBookings(tab);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scheduled Events</h1>
        <p className="text-sm text-gray-500 mt-1">View and manage all your bookings.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {['upcoming', 'past'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : error ? (
        <div className="card p-6 text-red-500">{error}</div>
      ) : bookings.length === 0 ? (
        <div className="card p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 font-medium">No {tab} events.</p>
          <p className="text-sm text-gray-400 mt-1">
            {tab === 'upcoming' ? 'Bookings will appear here once someone schedules with you.' : 'Past bookings will show here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <MeetingCard key={b.id} booking={b} onCancelled={refetch} />
          ))}
        </div>
      )}
    </div>
  );
}

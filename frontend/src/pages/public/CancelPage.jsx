import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import publicApi from '../../api/publicApi';
import Spinner from '../../components/Spinner';
import { formatDateTime, friendlyDate } from '../../utils/dateUtils';

export default function CancelPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reason, setReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    async function fetch() {
      try {
        const res = await publicApi.get(`/booking/${id}`);
        setBooking(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [id]);

  async function handleCancel(e) {
    e.preventDefault();
    setCancelling(true);
    try {
      await publicApi.put(`/booking/${id}/cancel`, { reason });
      setCancelled(true);
      toast.success('Booking cancelled.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(false);
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="xl" /></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center"><p className="text-red-500">{error}</p></div>;

  const timezone = booking?.timezone || 'UTC';

  if (cancelled) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Booking Cancelled</h2>
          <p className="text-sm text-gray-500 mb-6">Your booking has been cancelled. A confirmation email was sent.</p>
          <Link to={`/book/${booking?.eventType?.slug}`} className="btn-primary w-full block text-center">
            Book a new time
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Cancel Booking</h2>
        <p className="text-sm text-gray-500 mb-6">Are you sure you want to cancel this booking?</p>

        <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2 text-sm">
          <p className="font-semibold text-gray-900">{booking?.eventType?.name}</p>
          <p className="text-gray-600">{friendlyDate(booking?.start_time, timezone)}</p>
          <p className="text-gray-600">{formatDateTime(booking?.start_time, timezone, 'h:mm a')} – {formatDateTime(booking?.end_time, timezone, 'h:mm a')}</p>
        </div>

        {booking?.status !== 'confirmed' ? (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">This booking is already <strong>{booking?.status}</strong> and cannot be cancelled.</p>
            <Link to={`/book/${booking?.eventType?.slug}`} className="btn-primary mt-4 inline-block">Book a new time</Link>
          </div>
        ) : (
          <form onSubmit={handleCancel} className="space-y-4">
            <div>
              <label className="label">Reason for cancellation <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea className="input resize-none" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Let them know why..." />
            </div>
            <div className="flex gap-3">
              <Link to={`/confirmation/${id}`} className="btn-secondary flex-1 text-center">Keep It</Link>
              <button type="submit" disabled={cancelling} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                {cancelling && <Spinner size="sm" />}
                Yes, Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

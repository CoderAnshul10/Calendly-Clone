import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import publicApi from '../../api/publicApi';
import CalendarPicker from '../../components/CalendarPicker';
import TimeSlotGrid from '../../components/TimeSlotGrid';
import Spinner from '../../components/Spinner';
import { usePublicSlots } from '../../hooks';
import { formatDateTime, friendlyDate, getLocalTimezone, getAllTimezones } from '../../utils/dateUtils';

const STEPS = { CALENDAR: 1, TIME: 2, FORM: 3 };

export default function BookingPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [eventType, setEventType] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [eventError, setEventError] = useState(null);

  const [step, setStep] = useState(STEPS.CALENDAR);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [timezone, setTimezone] = useState(getLocalTimezone);
  const [allTimezones] = useState(getAllTimezones);

  const [form, setForm] = useState({ name: '', email: '', notes: '' });
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const { slots, loading: loadingSlots } = usePublicSlots(slug, selectedDate, timezone);

  useEffect(() => {
    async function fetchEvent() {
      try {
        setLoadingEvent(true);
        const res = await publicApi.get(`/${slug}`);
        setEventType(res.data);
      } catch (err) {
        setEventError(err.message);
      } finally {
        setLoadingEvent(false);
      }
    }
    fetchEvent();
  }, [slug]);

  function handleDateSelect(date) {
    setSelectedDate(date);
    setSelectedSlot(null);
    setStep(STEPS.TIME);
  }

  function handleSlotSelect(slot) {
    setSelectedSlot(slot);
    setStep(STEPS.FORM);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const answersArray = eventType.questions?.map((q) => ({
        question: q.question_text,
        answer: answers[q.id] || '',
      })) || [];

      const res = await publicApi.post(`/${slug}/book`, {
        invitee_name: form.name,
        invitee_email: form.email,
        start_time: selectedSlot,
        timezone,
        notes: form.notes,
        answers: answersArray,
      });

      navigate(`/confirmation/${res.data.id}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  if (eventError || !eventType) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event not found</h2>
          <p className="text-gray-500">{eventError || 'This booking link may be invalid or inactive.'}</p>
        </div>
      </div>
    );
  }

  const hostUser = eventType.user;
  const availability = eventType.availability || [];
  const dateOverrides = eventType.dateOverrides || [];

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center p-4 py-8 md:py-16">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">

        {/* Left panel — host info */}
        <div className="md:w-72 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-200 p-8 flex-shrink-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
              style={{ backgroundColor: eventType.color }}>
              {hostUser?.name?.charAt(0) || 'A'}
            </div>
            <div>
              <p className="text-sm text-gray-500">{hostUser?.name}</p>
              <h2 className="font-bold text-gray-900 leading-tight">{eventType.name}</h2>
            </div>
          </div>

          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{eventType.duration_minutes} minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Web conferencing details provided upon confirmation</span>
            </div>
            {eventType.description && (
              <p className="mt-4 text-gray-500 text-sm leading-relaxed">{eventType.description}</p>
            )}
          </div>

          {/* Summary when slot selected */}
          {selectedSlot && (
            <div className="mt-6 p-3 bg-blue-50 rounded-xl border border-blue-100 text-sm">
              <p className="font-semibold text-blue-700 mb-1">Selected time</p>
              <p className="text-gray-700">{friendlyDate(selectedSlot, timezone)}</p>
              <p className="text-gray-700 font-medium">{formatDateTime(selectedSlot, timezone, 'h:mm a')}</p>
              <p className="text-xs text-gray-400 mt-1">{timezone}</p>
            </div>
          )}
        </div>

        {/* Right panel — booking flow */}
        <div className="flex-1 p-8">
          {/* Timezone selector */}
          <div className="mb-6 flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
            </svg>
            <select
              className="text-sm text-gray-600 border-0 bg-transparent focus:outline-none focus:ring-0 cursor-pointer"
              value={timezone}
              onChange={(e) => { setTimezone(e.target.value); setSelectedSlot(null); if (step === STEPS.FORM) setStep(STEPS.TIME); }}
            >
              {allTimezones.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>

          {/* STEP 1: Calendar */}
          {(step === STEPS.CALENDAR || step === STEPS.TIME) && (
            <div className={`${step === STEPS.TIME ? 'grid grid-cols-1 sm:grid-cols-2 gap-8' : ''}`}>
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  {step === STEPS.CALENDAR ? 'Select a Date' : 'Select a Date & Time'}
                </h3>
                <CalendarPicker
                  selectedDate={selectedDate}
                  onSelect={handleDateSelect}
                  availability={availability}
                  dateOverrides={dateOverrides}
                  timezone={timezone}
                />
              </div>

              {/* STEP 2: Time slots */}
              {step === STEPS.TIME && selectedDate && (
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    {friendlyDate(`${selectedDate}T12:00:00Z`, timezone)}
                  </h3>
                  <p className="text-sm text-gray-400 mb-3">{timezone}</p>
                  <TimeSlotGrid
                    slots={slots}
                    selectedSlot={selectedSlot}
                    onSelect={handleSlotSelect}
                    loading={loadingSlots}
                    timezone={timezone}
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Booking form */}
          {step === STEPS.FORM && (
            <div>
              <button
                onClick={() => { setStep(STEPS.TIME); setSelectedSlot(null); }}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-5 font-medium"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <h3 className="text-base font-semibold text-gray-900 mb-5">Enter your details</h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Name *</label>
                  <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required placeholder="Your full name" />
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input type="email" className="input" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required placeholder="you@example.com" />
                </div>
                <div>
                  <label className="label">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
                  <textarea className="input resize-none" rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Anything you'd like the host to know..." />
                </div>

                {/* Custom questions */}
                {eventType.questions?.map((q) => (
                  <div key={q.id}>
                    <label className="label">
                      {q.question_text}
                      {q.is_required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      className="input"
                      value={answers[q.id] || ''}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      required={q.is_required}
                    />
                  </div>
                ))}

                <button type="submit" disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base">
                  {submitting && <Spinner size="sm" />}
                  Confirm Booking
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

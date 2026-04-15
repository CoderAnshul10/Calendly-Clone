import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAvailability } from '../../hooks';
import adminApi from '../../api/adminApi';
import Spinner from '../../components/Spinner';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DEFAULT_AVAILABILITY = DAY_NAMES.map((_, i) => ({
  day_of_week: i,
  start_time: '09:00',
  end_time: '17:00',
  is_active: i >= 1 && i <= 5,
}));

export default function AvailabilityPage() {
  const { availability, dateOverrides, loading, error, refetch } = useAvailability();
  const [days, setDays] = useState(DEFAULT_AVAILABILITY);
  const [saving, setSaving] = useState(false);
  const [overrideForm, setOverrideForm] = useState({ override_date: '', start_time: '09:00', end_time: '17:00', is_unavailable: false });
  const [addingOverride, setAddingOverride] = useState(false);
  const [deletingOverride, setDeletingOverride] = useState(null);

  useEffect(() => {
    if (availability.length > 0) {
      const merged = DEFAULT_AVAILABILITY.map((def) => {
        const found = availability.find((a) => a.day_of_week === def.day_of_week);
        return found
          ? { ...def, start_time: found.start_time?.substring(0, 5), end_time: found.end_time?.substring(0, 5), is_active: found.is_active }
          : def;
      });
      setDays(merged);
    }
  }, [availability]);

  function setDay(index, field, value) {
    setDays((prev) => prev.map((d) => d.day_of_week === index ? { ...d, [field]: value } : d));
  }

  async function handleSaveAvailability() {
    setSaving(true);
    try {
      await adminApi.put('/availability', days.map((d) => ({
        day_of_week: d.day_of_week,
        start_time: d.start_time,
        end_time: d.end_time,
        is_active: d.is_active,
      })));
      toast.success('Availability saved!');
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddOverride(e) {
    e.preventDefault();
    setAddingOverride(true);
    try {
      await adminApi.post('/availability/date-overrides', {
        ...overrideForm,
        start_time: overrideForm.is_unavailable ? null : overrideForm.start_time,
        end_time: overrideForm.is_unavailable ? null : overrideForm.end_time,
      });
      toast.success('Date override added!');
      setOverrideForm({ override_date: '', start_time: '09:00', end_time: '17:00', is_unavailable: false });
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAddingOverride(false);
    }
  }

  async function handleDeleteOverride(id) {
    setDeletingOverride(id);
    try {
      await adminApi.delete(`/availability/date-overrides/${id}`);
      toast.success('Override removed.');
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeletingOverride(null);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (error) return <div className="card p-6 text-red-500">{error}</div>;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Availability</h1>
        <p className="text-sm text-gray-500 mt-1">Set your weekly working hours and date-specific overrides.</p>
      </div>

      {/* Weekly hours */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Weekly Hours</h2>
        <div className="space-y-3">
          {days.map((day) => (
            <div key={day.day_of_week} className="flex items-center gap-4">
              {/* Toggle */}
              <button
                onClick={() => setDay(day.day_of_week, 'is_active', !day.is_active)}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors ${day.is_active ? 'bg-blue-600' : 'bg-gray-200'}`}
                role="switch"
                aria-checked={day.is_active}
              >
                <span className={`inline-block h-4 w-4 mt-0.5 ml-0.5 rounded-full bg-white shadow transition-transform ${day.is_active ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>

              {/* Day name */}
              <span className={`w-24 text-sm font-medium ${day.is_active ? 'text-gray-900' : 'text-gray-400'}`}>
                {DAY_NAMES[day.day_of_week]}
              </span>

              {/* Time pickers */}
              {day.is_active ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    className="input w-auto text-sm"
                    value={day.start_time}
                    onChange={(e) => setDay(day.day_of_week, 'start_time', e.target.value)}
                  />
                  <span className="text-gray-400 text-sm">–</span>
                  <input
                    type="time"
                    className="input w-auto text-sm"
                    value={day.end_time}
                    onChange={(e) => setDay(day.day_of_week, 'end_time', e.target.value)}
                  />
                </div>
              ) : (
                <span className="text-sm text-gray-400 flex-1">Unavailable</span>
              )}
            </div>
          ))}
        </div>

        <button onClick={handleSaveAvailability} disabled={saving} className="btn-primary mt-6 flex items-center gap-2">
          {saving && <Spinner size="sm" />}
          Save Hours
        </button>
      </div>

      {/* Date Overrides */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Date-Specific Overrides</h2>
        <p className="text-sm text-gray-500 mb-4">Override hours for a specific date, or mark it as fully unavailable.</p>

        {/* Existing overrides */}
        {dateOverrides.length > 0 && (
          <ul className="space-y-2 mb-4">
            {dateOverrides.map((o) => (
              <li key={o.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                <div>
                  <span className="font-medium text-gray-900">{o.override_date}</span>
                  {o.is_unavailable
                    ? <span className="ml-2 text-red-500 font-medium">Unavailable</span>
                    : <span className="ml-2 text-gray-500">{o.start_time?.substring(0, 5)} – {o.end_time?.substring(0, 5)}</span>
                  }
                </div>
                <button
                  onClick={() => handleDeleteOverride(o.id)}
                  disabled={deletingOverride === o.id}
                  className="text-gray-400 hover:text-red-500 p-1"
                >
                  {deletingOverride === o.id ? <Spinner size="sm" /> : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Add override form */}
        <form onSubmit={handleAddOverride} className="space-y-3 border-t pt-4">
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              required
              value={overrideForm.override_date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setOverrideForm((f) => ({ ...f, override_date: e.target.value }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="unavailable"
              checked={overrideForm.is_unavailable}
              onChange={(e) => setOverrideForm((f) => ({ ...f, is_unavailable: e.target.checked }))}
              className="rounded"
            />
            <label htmlFor="unavailable" className="text-sm text-gray-700 font-medium">Mark as fully unavailable</label>
          </div>
          {!overrideForm.is_unavailable && (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="label">Start</label>
                <input type="time" className="input" value={overrideForm.start_time} onChange={(e) => setOverrideForm((f) => ({ ...f, start_time: e.target.value }))} />
              </div>
              <div className="flex-1">
                <label className="label">End</label>
                <input type="time" className="input" value={overrideForm.end_time} onChange={(e) => setOverrideForm((f) => ({ ...f, end_time: e.target.value }))} />
              </div>
            </div>
          )}
          <button type="submit" disabled={addingOverride} className="btn-secondary flex items-center gap-2">
            {addingOverride && <Spinner size="sm" />}
            Add Override
          </button>
        </form>
      </div>
    </div>
  );
}

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useEventTypes } from '../../hooks';
import adminApi from '../../api/adminApi';
import Modal from '../../components/Modal';
import Spinner from '../../components/Spinner';
import Badge from '../../components/Badge';

const COLORS = [
  '#0069ff', '#10b981', '#8b5cf6', '#f59e0b',
  '#ef4444', '#ec4899', '#06b6d4', '#6366f1',
];

const DEFAULT_FORM = {
  name: '', slug: '', duration_minutes: 30,
  description: '', color: '#0069ff',
  buffer_before: 0, buffer_after: 0,
};

function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export default function EventTypesPage() {
  const { eventTypes, loading, error, refetch } = useEventTypes();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [showQModal, setShowQModal] = useState(null); // eventTypeId
  const [qForm, setQForm] = useState({ question_text: '', is_required: false });
  const [savingQ, setSavingQ] = useState(false);

  function openCreate() {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setShowModal(true);
  }

  function openEdit(et) {
    setEditingId(et.id);
    setForm({
      name: et.name,
      slug: et.slug,
      duration_minutes: et.duration_minutes,
      description: et.description || '',
      color: et.color || '#0069ff',
      buffer_before: et.buffer_before || 0,
      buffer_after: et.buffer_after || 0,
    });
    setShowModal(true);
  }

  function handleNameChange(val) {
    setForm((f) => ({ ...f, name: val, slug: editingId ? f.slug : slugify(val) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await adminApi.put(`/event-types/${editingId}`, form);
        toast.success('Event type updated!');
      } else {
        await adminApi.post('/event-types', form);
        toast.success('Event type created!');
      }
      setShowModal(false);
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this event type? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await adminApi.delete(`/event-types/${id}`);
      toast.success('Event type deleted.');
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(null);
    }
  }

  async function handleToggleActive(et) {
    try {
      await adminApi.put(`/event-types/${et.id}`, { is_active: !et.is_active });
      toast.success(`Event type ${et.is_active ? 'deactivated' : 'activated'}.`);
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  }

  function openBookingLink(slug) {
    const url = `${window.location.origin}/book/${slug}`;
    window.open(url, '_blank');
  }

  async function handleAddQuestion(e) {
    e.preventDefault();
    setSavingQ(true);
    try {
      await adminApi.post(`/event-types/${showQModal}/questions`, qForm);
      toast.success('Question added!');
      setQForm({ question_text: '', is_required: false });
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingQ(false);
    }
  }

  async function handleDeleteQuestion(etId, qId) {
    try {
      await adminApi.delete(`/event-types/${etId}/questions/${qId}`);
      toast.success('Question removed.');
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  }

  const qModalEt = showQModal ? eventTypes.find((e) => e.id === showQModal) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Event Types</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage your bookable event types.</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Event Type
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : error ? (
        <div className="card p-6 text-center text-red-500">{error}</div>
      ) : eventTypes.length === 0 ? (
        <div className="card p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-500 font-medium">No event types yet.</p>
          <p className="text-sm text-gray-400 mt-1">Create your first event type to get started.</p>
          <button onClick={openCreate} className="btn-primary mt-4">Create Event Type</button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {eventTypes.map((et) => (
            <div key={et.id} className="card p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
              {/* Top row */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: et.color }} />
                  <div>
                    <h3 className="font-semibold text-gray-900 leading-tight">{et.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">/{et.slug}</p>
                  </div>
                </div>
                <Badge status={et.is_active ? 'active' : 'inactive'} />
              </div>

              {/* Meta */}
              <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {et.duration_minutes} min
                </span>
                {(et.buffer_before > 0 || et.buffer_after > 0) && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {et.buffer_before}m / {et.buffer_after}m buffer
                  </span>
                )}
                {et.questions?.length > 0 && (
                  <span>{et.questions.length} question{et.questions.length > 1 ? 's' : ''}</span>
                )}
              </div>

              {et.description && (
                <p className="text-sm text-gray-500 line-clamp-2">{et.description}</p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1 border-t border-gray-100 flex-wrap">
                <button
                  onClick={() => openBookingLink(et.slug)}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open Link
                </button>
                <button
                  onClick={() => setShowQModal(et.id)}
                  className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-800 font-medium px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Questions
                </button>
                <button
                  onClick={() => handleToggleActive(et)}
                  className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-800 font-medium px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {et.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <div className="ml-auto flex gap-1">
                  <button
                    onClick={() => openEdit(et)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(et.id)}
                    disabled={deleting === et.id}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    {deleting === et.id ? <Spinner size="sm" /> : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Event Type' : 'New Event Type'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input className="input" value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. 30 Min Meeting" required />
          </div>
          <div>
            <label className="label">URL Slug *</label>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
              <span className="px-3 py-2 bg-gray-50 text-gray-400 text-sm border-r border-gray-300">/book/</span>
              <input
                className="flex-1 px-3 py-2 text-sm focus:outline-none"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                placeholder="30-min-meeting"
                required
              />
            </div>
          </div>
          <div>
            <label className="label">Duration (minutes) *</label>
            <select className="input" value={form.duration_minutes} onChange={(e) => setForm((f) => ({ ...f, duration_minutes: Number(e.target.value) }))}>
              {[15, 20, 30, 45, 60, 90, 120].map((d) => <option key={d} value={d}>{d} min</option>)}
            </select>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Brief description of this event type" />
          </div>
          <div>
            <label className="label">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Buffer Before (min)</label>
              <input type="number" min={0} max={60} className="input" value={form.buffer_before} onChange={(e) => setForm((f) => ({ ...f, buffer_before: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="label">Buffer After (min)</label>
              <input type="number" min={0} max={60} className="input" value={form.buffer_after} onChange={(e) => setForm((f) => ({ ...f, buffer_after: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving && <Spinner size="sm" />}
              {editingId ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Questions Modal */}
      <Modal isOpen={!!showQModal} onClose={() => setShowQModal(null)} title={`Custom Questions — ${qModalEt?.name || ''}`}>
        <div className="space-y-4">
          {qModalEt?.questions?.length > 0 ? (
            <ul className="space-y-2">
              {qModalEt.questions.map((q) => (
                <li key={q.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                  <div>
                    <p className="font-medium text-gray-800">{q.question_text}</p>
                    {q.is_required && <span className="text-xs text-red-500 font-medium">Required</span>}
                  </div>
                  <button onClick={() => handleDeleteQuestion(showQModal, q.id)} className="text-gray-400 hover:text-red-500 ml-3">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">No questions yet. Add one below.</p>
          )}

          <form onSubmit={handleAddQuestion} className="border-t pt-4 space-y-3">
            <div>
              <label className="label">Question Text *</label>
              <input className="input" value={qForm.question_text} onChange={(e) => setQForm((f) => ({ ...f, question_text: e.target.value }))} placeholder="What topics would you like to cover?" required />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="qRequired" checked={qForm.is_required} onChange={(e) => setQForm((f) => ({ ...f, is_required: e.target.checked }))} className="rounded" />
              <label htmlFor="qRequired" className="text-sm text-gray-700">Required</label>
            </div>
            <button type="submit" disabled={savingQ} className="btn-primary w-full flex items-center justify-center gap-2">
              {savingQ && <Spinner size="sm" />} Add Question
            </button>
          </form>
        </div>
      </Modal>
    </div>
  );
}

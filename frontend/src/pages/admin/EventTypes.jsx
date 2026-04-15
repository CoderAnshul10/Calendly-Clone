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
  name: '',
  slug: '',
  duration_minutes: 30,
  description: '',
  color: '#0069ff',
  buffer_before: 0,
  buffer_after: 0,
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
    setForm((f) => ({
      ...f,
      name: val,
      slug: editingId ? f.slug : slugify(val),
    }));
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
    if (!window.confirm('Delete this event type?')) return;

    setDeleting(id);
    try {
      await adminApi.delete(`/event-types/${id}`);
      toast.success('Deleted successfully');
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(null);
    }
  }

  async function handleToggleActive(et) {
    try {
      await adminApi.put(`/event-types/${et.id}`, {
        is_active: !et.is_active,
      });
      toast.success('Status updated');
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  }

  function openBookingLink(slug) {
    window.open(`${window.location.origin}/book/${slug}`, '_blank');
  }

  // 🔥 FIXED ERROR HANDLING
  const errorMessage =
    typeof error === 'string'
      ? error
      : error?.message || 'Something went wrong';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Event Types</h1>
        <button onClick={openCreate} className="btn-primary">
          + New Event Type
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="card p-6 text-center text-red-500">
          {errorMessage}
        </div>
      ) : eventTypes.length === 0 ? (
        <div className="card p-12 text-center">
          <p>No event types yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {eventTypes.map((et) => (
            <div key={et.id} className="card p-5">
              <div className="flex justify-between">
                <h3>{et.name}</h3>
                <Badge status={et.is_active ? 'active' : 'inactive'} />
              </div>

              <p className="text-sm text-gray-500">{et.duration_minutes} min</p>

              <div className="flex gap-2 mt-3 flex-wrap">
                <button onClick={() => openBookingLink(et.slug)}>
                  Open Link
                </button>

                <button onClick={() => openEdit(et)}>Edit</button>

                <button onClick={() => handleToggleActive(et)}>
                  Toggle
                </button>

                <button onClick={() => handleDelete(et.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Edit' : 'Create'}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            className="input"
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Name"
            required
          />

          <input
            className="input"
            value={form.slug}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                slug: slugify(e.target.value),
              }))
            }
          />

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
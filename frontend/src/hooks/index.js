import { useState, useEffect, useCallback } from 'react';
import adminApi from '../api/adminApi';
import publicApi from '../api/publicApi';

// ─── useEventTypes ────────────────────────────────────────────────
export function useEventTypes() {
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.get('/event-types');
      setEventTypes(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { eventTypes, loading, error, refetch: fetch };
}

// ─── useAvailability ──────────────────────────────────────────────
export function useAvailability() {
  const [availability, setAvailability] = useState([]);
  const [dateOverrides, setDateOverrides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [availRes, overrideRes] = await Promise.all([
        adminApi.get('/availability'),
        adminApi.get('/availability/date-overrides'),
      ]);
      setAvailability(availRes.data);
      setDateOverrides(overrideRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { availability, dateOverrides, loading, error, refetch: fetch };
}

// ─── useBookings (admin meetings) ─────────────────────────────────
export function useBookings(status = 'upcoming') {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.get(`/meetings?status=${status}`);
      setBookings(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { fetch(); }, [fetch]);

  return { bookings, loading, error, refetch: fetch };
}

// ─── usePublicSlots ───────────────────────────────────────────────
export function usePublicSlots(slug, date, timezone) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug || !date) return;
    let cancelled = false;
    async function fetchSlots() {
      try {
        setLoading(true);
        setError(null);
        const res = await publicApi.get(`/${slug}/slots`, {
          params: { date, timezone },
        });
        if (!cancelled) setSlots(res.data.slots || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchSlots();
    return () => { cancelled = true; };
  }, [slug, date, timezone]);

  return { slots, loading, error };
}

import axios from 'axios';

const FALLBACK_API_BASE_URL = 'http://localhost:4000';

export default function createApiClient(prefix) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || FALLBACK_API_BASE_URL;

  const client = axios.create({
    baseURL: `${baseUrl}${prefix}`,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.response.use(
    (res) => res,
    (err) => {
      const message = err.response?.data?.error || err.message || 'An unexpected error occurred.';
      return Promise.reject(new Error(message));
    }
  );

  return client;
}

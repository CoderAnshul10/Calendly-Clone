import axios from 'axios';

// In production (Vercel), API calls go through the Vercel proxy (/api/...)
// so we use the same origin (empty baseURL prefix).
// In local dev, we use VITE_API_BASE_URL to point to the local backend.
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;
const isProduction = import.meta.env.PROD;

let baseUrl = '';

if (isProduction) {
  // In production, use Vercel rewrites (same origin) — no cross-domain needed
  baseUrl = '';
} else if (rawBaseUrl) {
  let normalizedBaseUrl = rawBaseUrl.trim().replace(/\/$/, '');
  if (!/^https?:\/\//i.test(normalizedBaseUrl)) {
    normalizedBaseUrl = `https://${normalizedBaseUrl}`;
  }

  try {
    new URL(normalizedBaseUrl);
    baseUrl = normalizedBaseUrl;
  } catch (err) {
    console.error(
      'Invalid VITE_API_BASE_URL value:',
      normalizedBaseUrl
    );
  }
}

console.log('API Base URL:', baseUrl || '(same origin via proxy)');

export default function createApiClient(prefix) {
  const client = axios.create({
    baseURL: `${baseUrl}${prefix}`,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.response.use(
    (res) => res,
    (err) => {
      const message =
        err.response?.data?.error ||
        err.message ||
        'An unexpected error occurred.';
      return Promise.reject(new Error(message));
    }
  );

  return client;
}
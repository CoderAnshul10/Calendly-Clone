import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;
const baseUrl = rawBaseUrl ? rawBaseUrl.replace(/\/$/, '') : null;

console.log('Resolved VITE_API_BASE_URL:', baseUrl);

if (!baseUrl) {
  console.error(
    'Missing VITE_API_BASE_URL. Set this environment variable in Vercel to your Railway backend URL.'
  );
}

export default function createApiClient(prefix) {
  const client = axios.create({
    baseURL: baseUrl ? `${baseUrl}${prefix}` : undefined,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.response.use(
    (res) => res,
    (err) => {
      if (!baseUrl) {
        return Promise.reject(
          new Error(
            'Missing VITE_API_BASE_URL. Set this environment variable in Vercel to your Railway backend URL.'
          )
        );
      }

      const message =
        err.response?.data?.error ||
        err.message ||
        'An unexpected error occurred.';
      return Promise.reject(new Error(message));
    }
  );

  return client;
}
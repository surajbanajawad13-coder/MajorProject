const API_BASE_URL = import.meta.env.VITE_API_URL
  || (import.meta.env.DEV ? 'http://localhost:8000' : '');

if (!API_BASE_URL) {
  throw new Error('VITE_API_URL must point to the deployed CampusConnect API in production.');
}

export default API_BASE_URL;

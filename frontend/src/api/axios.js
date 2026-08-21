import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
});

// Sisipkan token JWT ke setiap request jika sudah login.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('payroll_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Jika token expired/invalid, otomatis logout dan lempar ke halaman login.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('payroll_token');
      localStorage.removeItem('payroll_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

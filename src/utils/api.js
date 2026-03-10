import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import router from '../../router';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const authStore = useAuthStore();
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`;
  }
  return config;
});

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const authStore = useAuthStore();
      authStore.clearAuth();
      router.push({ name: 'Login' });
    }
    return Promise.reject(error);
  }
);

export default api;

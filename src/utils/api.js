import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
});

let interceptorsInitialized = false;

export const initApiInterceptors = (routerInstance) => {
  if (interceptorsInitialized) {
    return;
  }

  interceptorsInitialized = true;

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
        routerInstance.push({ name: 'Login' });
      }
      return Promise.reject(error);
    }
  );
};

export default api;

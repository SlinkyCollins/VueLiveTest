import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const baseURL = (configuredBaseUrl && configuredBaseUrl.length > 0
  ? configuredBaseUrl
  : 'https://laravellivebankapptest.onrender.com/api').replace(/\/$/, '');

const api = axios.create({
  baseURL,
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
      const authStore = useAuthStore();
      const hadToken = Boolean(authStore.token);

      if (error.response && error.response.status === 401 && hadToken) {
        authStore.clearAuth();
        routerInstance.push({ name: 'Login', query: { sessionExpired: '1' } });
      }
      return Promise.reject(error);
    }
  );
};

export default api;

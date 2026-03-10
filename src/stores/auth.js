import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import api from '@/utils/api';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('access_token') || null);
  const user = ref(null);

  const isAuthenticated = computed(() => !!token.value);

  function setAuth(newToken, newUser) {
    token.value = newToken;
    user.value = newUser;
    localStorage.setItem('access_token', newToken);
  }

  function setUser(newUser) {
    user.value = newUser;
  }

  function updateBalance(newBalance) {
    if (user.value) {
      user.value.balance = newBalance;
    }
  }

  function clearAuth() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }

  async function fetchDashboard() {
    const res = await api.get('/dashboard');
    user.value = res.data.user;
  }

  async function fetchBalance() {
    const res = await api.get('/balance');
    if (user.value) {
      user.value.balance = res.data.balance;
    }
  }

  return { token, user, isAuthenticated, setAuth, setUser, updateBalance, clearAuth, fetchDashboard, fetchBalance };
});

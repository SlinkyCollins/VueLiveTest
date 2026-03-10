<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center h-64">
      <p class="text-gray-500 text-lg">Loading dashboard...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage" class="flex flex-col justify-center items-center h-64">
      <p class="text-red-600 text-lg mb-4">{{ errorMessage }}</p>
      <button @click="fetchDashboard" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Retry</button>
    </div>

    <!-- Dashboard Content -->
    <div v-else-if="user" class="max-w-4xl mx-auto space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-800">Welcome, {{ user.name }}!</h1>
        <button
          @click="handleLogout"
          :disabled="loggingOut"
          class="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >{{ loggingOut ? 'Logging out...' : 'Logout' }}</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Balance Card -->
        <div class="bg-white rounded-xl shadow p-6">
          <p class="text-sm text-gray-500">Available Balance</p>
          <p class="text-3xl font-bold text-blue-600 mt-1">₦{{ Number(user.balance).toLocaleString('en-NG', { minimumFractionDigits: 2 }) }}</p>
        </div>

        <!-- Account Info Card -->
        <div class="bg-white rounded-xl shadow p-6">
          <p class="text-sm text-gray-500">Account Number</p>
          <p class="text-xl font-semibold text-gray-800 mt-1">{{ user.account_number }}</p>
          <p class="text-sm text-gray-500 mt-2">Account Type</p>
          <p class="text-base font-medium text-gray-700 capitalize">{{ user.account_type }}</p>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="flex gap-3">
        <button
          @click="router.push({ name: 'Deposit' })"
          class="px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition"
        >+ Add Money</button>
        <button
          @click="router.push({ name: 'Transfer' })"
          class="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
        >Transfer</button>
        <button
          @click="router.push({ name: 'TransactionHistory' })"
          class="px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-800 transition"
        >History</button>
      </div>

      <!-- User Details Card -->
      <div class="bg-white rounded-xl shadow p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">Profile</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p class="text-gray-500">Email</p>
            <p class="text-gray-800">{{ user.email }}</p>
          </div>
          <div>
            <p class="text-gray-500">Member Since</p>
            <p class="text-gray-800">{{ new Date(user.created_at).toLocaleDateString() }}</p>
          </div>
          <div v-if="user.next_of_kin_name">
            <p class="text-gray-500">Next of Kin</p>
            <p class="text-gray-800">{{ user.next_of_kin_name }}</p>
          </div>
          <div v-if="user.next_of_kin_phone">
            <p class="text-gray-500">Next of Kin Phone</p>
            <p class="text-gray-800">{{ user.next_of_kin_phone }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/utils/api';
import { useAuthStore } from '@/stores/auth';

const loading = ref(true);
const errorMessage = ref('');
const loggingOut = ref(false);
const router = useRouter();
const authStore = useAuthStore();

const user = computed(() => authStore.user);

const handleLogout = async () => {
  loggingOut.value = true;

  try {
    await api.post('/logout');
  } catch (err) {
    // Even if the API call fails, clear local data and redirect
  } finally {
    authStore.clearAuth();
    loggingOut.value = false;
    router.push({ name: 'Login' });
  }
};

const fetchDashboard = async () => {
  loading.value = true;
  errorMessage.value = '';

  if (!authStore.token) {
    router.push({ name: 'Login' });
    return;
  }

  try {
    await authStore.fetchDashboard();
  } catch (err) {
    if (err.code === 'ERR_NETWORK') {
      errorMessage.value = 'Unable to connect to the server.';
    } else {
      errorMessage.value = 'Failed to load dashboard data.';
    }
  } finally {
    loading.value = false;
  }
};

onMounted(fetchDashboard);
</script>

<style></style>
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
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const user = ref(null);
const loading = ref(true);
const errorMessage = ref('');
const loggingOut = ref(false);
const router = useRouter();

const handleLogout = async () => {
  loggingOut.value = true;
  const token = localStorage.getItem('access_token');

  try {
    await axios.post('http://127.0.0.1:8000/api/logout', {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    // Even if the API call fails, clear local data and redirect
  } finally {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    loggingOut.value = false;
    router.push({ name: 'Login' });
  }
};

const fetchDashboard = async () => {
  loading.value = true;
  errorMessage.value = '';

  const token = localStorage.getItem('access_token');

  if (!token) {
    router.push({ name: 'Login' });
    return;
  }

  try {
    const res = await axios.get('http://127.0.0.1:8000/api/dashboard', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    user.value = res.data.user;
  } catch (err) {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      router.push({ name: 'Login' });
    } else if (err.code === 'ERR_NETWORK') {
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
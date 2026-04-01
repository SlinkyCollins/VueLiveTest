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
      <div
        v-if="flashSuccessMessage"
        class="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
      >
        {{ flashSuccessMessage }}
      </div>

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
      <div class="flex gap-3 flex-wrap">
        <button
          @click="router.push({ name: 'Deposit', params: { userId: String(user.id) } })"
          class="px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition"
        >+ Add Money</button>
        <button
          @click="router.push({ name: 'Transfer', params: { userId: String(user.id) } })"
          class="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
        >Transfer</button>
        <button
          @click="router.push({ name: 'Beneficiaries', params: { userId: String(user.id) } })"
          class="px-6 py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition"
        >Beneficiaries</button>
        <button
          @click="router.push({ name: 'TransactionHistory', params: { userId: String(user.id) } })"
          class="px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-800 transition"
        >History</button>
        <button
          @click="router.push({ name: 'Withdraw', params: { userId: String(user.id) } })"
          class="px-6 py-3 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700 transition"
        >Withdraw</button>
        <button
          @click="router.push({ name: 'Profile', params: { userId: String(user.id) } })"
          class="px-6 py-3 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-700 transition"
        >Profile</button>
      </div>

      <!-- Security Section -->
      <div class="bg-white rounded-xl shadow p-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-3">Security</h2>
        <div class="flex gap-3">
          <button
            v-if="!user.has_pin"
            @click="router.push({ name: 'SetPin', params: { userId: String(user.id) } })"
            class="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition"
          >Set Transaction PIN</button>
          <button
            v-else
            @click="router.push({ name: 'ChangePin', params: { userId: String(user.id) } })"
            class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
          >Change PIN</button>
        </div>
        <p v-if="!user.has_pin" class="text-amber-600 text-sm mt-2">⚠ You must set a transaction PIN before making transfers.</p>
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
import { useRoute, useRouter } from 'vue-router';
import api from '@/utils/api';
import { useAuthStore } from '@/stores/auth';

const loading = ref(true);
const errorMessage = ref('');
const loggingOut = ref(false);
const flashSuccessMessage = ref('');
const router = useRouter();
const route = useRoute();
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

onMounted(async () => {
  if (route.query.pinSet === '1') {
    flashSuccessMessage.value = 'Transaction PIN set successfully.';

    const nextQuery = { ...route.query };
    delete nextQuery.pinSet;

    router.replace({
      name: 'Dashboard',
      params: { userId: String(route.params.userId) },
      query: nextQuery,
    });
  } else if (route.query.pinChanged === '1') {
    flashSuccessMessage.value = 'Transaction PIN changed successfully.';

    const nextQuery = { ...route.query };
    delete nextQuery.pinChanged;

    router.replace({
      name: 'Dashboard',
      params: { userId: String(route.params.userId) },
      query: nextQuery,
    });
  }

  await fetchDashboard();
});
</script>

<style></style>
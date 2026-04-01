<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-4xl mx-auto space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-800">Transaction History</h1>
        <button @click="router.push({ name: 'Dashboard', params: { userId: String(route.params.userId) } })"
          class="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition">← Back
          to Dashboard</button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center items-center h-40">
        <p class="text-gray-500">Loading transactions...</p>
      </div>

      <!-- Error -->
      <div v-else-if="errorMessage" class="text-center py-10">
        <p class="text-red-600 mb-4">{{ errorMessage }}</p>
        <button @click="fetchTransactions"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Retry</button>
      </div>

      <!-- Empty State -->
      <div v-else-if="transactions.length === 0" class="text-center py-10">
        <p class="text-gray-500 text-lg">No transactions yet.</p>
      </div>

      <!-- Transaction List -->
      <div v-else class="space-y-3">
        <div v-for="tx in transactions" :key="tx.transaction_reference"
          class="bg-white rounded-xl shadow p-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <!-- Direction Icon -->
            <div :class="tx.direction === 'credit'
              ? 'bg-green-100 text-green-600'
              : 'bg-red-100 text-red-600'"
              class="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold">
              {{ tx.direction === 'credit' ? '↓' : '↑' }}
            </div>
            <div>
              <p class="font-semibold text-gray-800 capitalize">{{ tx.type }}</p>
              <p class="text-xs text-gray-500">Ref: {{ tx.transaction_reference }}</p>
              <p class="text-xs text-gray-500">{{ formatDate(tx.created_at) }}</p>
              <p class="text-xs text-gray-500">From: {{ tx.sender_account_name }} ({{ tx.sender_account_number }})</p>
              <p class="text-xs text-gray-500">To: {{ tx.recipient_account_name }} ({{ tx.recipient_account_number }})</p>
            </div>
          </div>
          <div class="text-right">
            <p :class="tx.direction === 'credit' ? 'text-green-600' : 'text-red-600'" class="font-bold text-lg">
              {{ tx.direction === 'credit' ? '+' : '-' }}₦{{ Number(tx.amount).toLocaleString('en-NG', {
              minimumFractionDigits: 2 }) }}
            </p>
            <p class="text-xs text-gray-500">Bal: ₦{{ Number(tx.balance_after).toLocaleString('en-NG', {
              minimumFractionDigits: 2 }) }}</p>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="lastPage > 1" class="flex justify-center gap-2 pt-4">
          <button v-for="page in lastPage" :key="page" @click="fetchTransactions(page)" :class="page === currentPage
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100'"
            class="w-10 h-10 rounded-lg text-sm font-medium shadow transition">{{ page }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/utils/api';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const transactions = ref([]);
const loading = ref(true);
const errorMessage = ref('');
const currentPage = ref(1);
const lastPage = ref(1);

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const fetchTransactions = async (page = 1) => {
  loading.value = true;
  errorMessage.value = '';

  try {
    const res = await api.get(`/transactions?page=${page}`);
    transactions.value = res.data.transactions.data;
    currentPage.value = res.data.transactions.current_page;
    lastPage.value = res.data.transactions.last_page;
  } catch (err) {
    if (err.code === 'ERR_NETWORK') {
      errorMessage.value = 'Unable to connect to the server.';
    } else {
      errorMessage.value = 'Failed to load transactions.';
    }
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  if (!authStore.user) {
    try {
      await authStore.fetchDashboard();
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        router.push({ name: 'Login' });
        return;
      }
      errorMessage.value = 'Unable to load your account information. Please try again.';
    }
  }
  fetchTransactions();
});
</script>

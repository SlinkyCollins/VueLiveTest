<template>
  <PageWrapper>
    <div class="page-stack">
      <SectionHeader
        title="Transaction history"
        subtitle="Review recent credits and debits across your account."
        eyebrow="Activity"
      >
        <template #actions>
          <button
            class="btn-secondary"
            @click="router.push({ name: 'Dashboard', params: { userId: String(route.params.userId) } })"
          >
            <span class="pi pi-arrow-left text-sm" />
            Back to dashboard
          </button>
        </template>
      </SectionHeader>

      <div v-if="loading" class="empty-state min-h-64">
        <span class="pi pi-spin pi-spinner text-2xl text-brand-600" />
        <p>Loading transactions...</p>
      </div>

      <div v-else-if="errorMessage" class="empty-state min-h-64">
        <span class="pi pi-exclamation-circle text-2xl text-red-600" />
        <p>{{ errorMessage }}</p>
        <button class="btn-primary" @click="fetchTransactions()">Retry</button>
      </div>

      <div v-else-if="transactions.length === 0" class="empty-state min-h-64">
        <span class="pi pi-receipt text-2xl text-surface-400" />
        <p>No transactions yet.</p>
      </div>

      <section v-else class="content-card section-stack">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div class="space-y-1">
            <h2 class="section-title">Recent activity</h2>
            <p class="section-subtitle">
              Each item shows the direction, amount, reference, and balance after the transaction.
            </p>
          </div>
          <span class="badge-primary">{{ transactions.length }} records</span>
        </div>

        <div class="table-list">
          <article
            v-for="tx in transactions"
            :key="tx.transaction_reference"
            class="table-row"
          >
            <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div class="flex items-start gap-4">
                <div
                  :class="tx.direction === 'credit'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-surface-100 text-surface-700'"
                  class="flex h-11 w-11 items-center justify-center rounded-full text-lg"
                >
                  <span :class="tx.direction === 'credit' ? 'pi pi-arrow-down-left' : 'pi pi-arrow-up-right'" />
                </div>

                <div class="space-y-2">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="text-sm font-semibold capitalize text-surface-900">{{ tx.type }}</p>
                    <span :class="tx.direction === 'credit' ? 'badge-success' : 'badge-muted'">
                      {{ tx.direction }}
                    </span>
                  </div>

                  <div class="space-y-1 text-sm text-surface-500">
                    <p>Reference: {{ tx.transaction_reference }}</p>
                    <p>{{ formatDate(tx.created_at) }}</p>
                    <p>From: {{ tx.sender_account_name }} ({{ tx.sender_account_number }})</p>
                    <p>To: {{ tx.recipient_account_name }} ({{ tx.recipient_account_number }})</p>
                  </div>
                </div>
              </div>

              <div class="space-y-1 text-left lg:text-right">
                <p
                  :class="tx.direction === 'credit' ? 'text-emerald-600' : 'text-red-600'"
                  class="text-lg font-semibold"
                >
                  {{ tx.direction === 'credit' ? '+' : '-' }}{{ formatCurrency(tx.amount) }}
                </p>
                <p class="text-sm text-surface-500">
                  Balance after: {{ formatCurrency(tx.balance_after) }}
                </p>
              </div>
            </div>
          </article>
        </div>

        <div v-if="lastPage > 1" class="flex flex-wrap justify-center gap-2 pt-2">
          <button
            v-for="page in lastPage"
            :key="page"
            :class="page === currentPage ? 'btn-primary' : 'btn-secondary'"
            class="h-10 min-w-10 px-3 py-0"
            @click="fetchTransactions(page)"
          >
            {{ page }}
          </button>
        </div>
      </section>
    </div>
  </PageWrapper>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/utils/api';
import { useAuthStore } from '@/stores/auth';
import PageWrapper from '@/components/ui/PageWrapper.vue';
import SectionHeader from '@/components/ui/SectionHeader.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const transactions = ref([]);
const loading = ref(true);
const errorMessage = ref('');
const currentPage = ref(1);
const lastPage = ref(1);
const formatCurrency = (value) => `₦${Number(value || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

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

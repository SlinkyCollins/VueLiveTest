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
        <div class="w-full max-w-4xl space-y-4 pt-2">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Skeleton height="8.5rem" borderRadius="1rem" />
            <Skeleton height="8.5rem" borderRadius="1rem" />
            <Skeleton height="8.5rem" borderRadius="1rem" />
          </div>
          <Skeleton height="10.5rem" borderRadius="1rem" />
        </div>
      </div>

      <div v-else-if="hadLoadError" class="empty-state min-h-64">
        <span class="pi pi-exclamation-circle text-2xl text-red-600" />
        <p>{{ loadErrorMessage }}</p>
        <button class="btn-primary" @click="fetchTransactions(currentPage)">Retry</button>
      </div>

      <div v-else-if="transactions.length === 0" class="empty-state min-h-64">
        <span class="pi pi-receipt text-2xl text-surface-400" />
        <p>No transactions yet.</p>
      </div>

      <section v-else class="content-card section-stack w-full">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div class="space-y-1">
            <h2 class="section-title">Recent activity</h2>
            <p class="section-subtitle">
              Each item shows the direction, amount, reference, and balance after the transaction.
            </p>
          </div>
          <span class="badge-primary">{{ transactions.length }} records</span>
        </div>

        <div class="w-full overflow-hidden rounded-2xl border border-surface-200 bg-white">
          <!-- Desktop header -->
          <div
            class="hidden md:grid md:grid-cols-[minmax(0,2.4fr)_minmax(0,1.2fr)_minmax(0,1fr)] gap-4 border-b border-surface-200 bg-surface-50 px-5 py-3"
          >
            <span class="text-xs font-semibold uppercase tracking-wide text-surface-500">
              Transaction
            </span>
            <span class="text-xs font-semibold uppercase tracking-wide text-surface-500">
              Parties
            </span>
            <span class="text-right text-xs font-semibold uppercase tracking-wide text-surface-500">
              Amount
            </span>
          </div>

          <article
            v-for="tx in transactions"
            :key="tx.transaction_reference"
            class="border-b border-surface-200 last:border-b-0"
          >
            <!-- Mobile card -->
            <div class="flex flex-col gap-4 px-4 py-4 md:hidden">
              <div class="flex items-start gap-3">
                <div
                  :class="tx.direction === 'credit'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-surface-100 text-surface-700'"
                  class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg"
                >
                  <span :class="tx.direction === 'credit' ? 'pi pi-arrow-down-left' : 'pi pi-arrow-up-right'" />
                </div>

                <div class="min-w-0 flex-1 space-y-2">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="text-sm font-semibold capitalize text-surface-900">
                      {{ tx.type }}
                    </p>
                    <span :class="tx.direction === 'credit' ? 'badge-success' : 'badge-muted'">
                      {{ tx.direction }}
                    </span>
                  </div>

                  <div class="space-y-1 text-sm text-surface-500 wrap-break-word">
                    <p>Reference: {{ tx.transaction_reference }}</p>
                    <p>{{ formatDate(tx.created_at) }}</p>
                    <p>From: {{ tx.sender_account_name }} ({{ tx.sender_account_number }})</p>
                    <p>To: {{ tx.recipient_account_name }} ({{ tx.recipient_account_number }})</p>
                  </div>
                </div>
              </div>

              <div class="space-y-1 border-t border-surface-200 pt-3">
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

            <!-- Desktop row -->
            <div
              class="hidden md:grid md:grid-cols-[minmax(0,2.4fr)_minmax(0,1.2fr)_minmax(0,1fr)] md:items-start gap-4 px-5 py-4"
            >
              <div class="flex min-w-0 items-start gap-4">
                <div
                  :class="tx.direction === 'credit'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-surface-100 text-surface-700'"
                  class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg"
                >
                  <span :class="tx.direction === 'credit' ? 'pi pi-arrow-down-left' : 'pi pi-arrow-up-right'" />
                </div>

                <div class="min-w-0 space-y-2">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="truncate text-sm font-semibold capitalize text-surface-900">
                      {{ tx.type }}
                    </p>
                    <span :class="tx.direction === 'credit' ? 'badge-success' : 'badge-muted'">
                      {{ tx.direction }}
                    </span>
                  </div>

                  <div class="space-y-1 text-sm text-surface-500 wrap-break-word">
                    <p class="truncate">Reference: {{ tx.transaction_reference }}</p>
                    <p>{{ formatDate(tx.created_at) }}</p>
                  </div>
                </div>
              </div>

              <div class="min-w-0 space-y-1 text-sm text-surface-500 wrap-break-word">
                <p class="truncate">From: {{ tx.sender_account_name }} ({{ tx.sender_account_number }})</p>
                <p class="truncate">To: {{ tx.recipient_account_name }} ({{ tx.recipient_account_number }})</p>
              </div>

              <div class="space-y-1 text-right">
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
import Skeleton from 'primevue/skeleton';
import { useToast } from 'primevue/usetoast';
import api from '@/utils/api';
import { useAuthStore } from '@/stores/auth';
import PageWrapper from '@/components/ui/PageWrapper.vue';
import SectionHeader from '@/components/ui/SectionHeader.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const toast = useToast();

const transactions = ref([]);
const loading = ref(true);
const hadLoadError = ref(false);
const loadErrorMessage = ref('');
const currentPage = ref(1);
const lastPage = ref(1);

const formatCurrency = (value) =>
  `₦${Number(value || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const fetchTransactions = async (page = 1) => {
  loading.value = true;

  try {
    const res = await api.get(`/transactions?page=${page}`);
    const txList = res.data.transactions.data || [];
    transactions.value = txList;
    currentPage.value = res.data.transactions.current_page;
    lastPage.value = res.data.transactions.last_page;
    loadErrorMessage.value = '';

    if (hadLoadError.value) {
      toast.add({
        severity: 'success',
        summary: 'Transactions loaded',
        detail: 'Your transaction history is up to date.',
        life: 2200,
      });
      hadLoadError.value = false;
    }

    if (page === 1 && txList.length === 0) {
      toast.add({
        severity: 'info',
        summary: 'No transactions yet',
        detail: 'New activity will appear here once available.',
        life: 2200,
      });
    }
  } catch (err) {
    hadLoadError.value = true;
    if (err.code === 'ERR_NETWORK') {
      loadErrorMessage.value = 'Unable to connect to the server.';
      toast.add({
        severity: 'warn',
        summary: 'Connection issue',
        detail: 'Unable to connect to the server.',
        life: 3000,
      });
    } else {
      loadErrorMessage.value = 'Failed to load transactions.';
      toast.add({
        severity: 'error',
        summary: 'Load failed',
        detail: 'Failed to load transactions.',
        life: 3200,
      });
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
        toast.add({
          severity: 'warn',
          summary: 'Session expired',
          detail: 'Please log in again.',
          life: 2200,
        });
        router.push({ name: 'Login' });
        return;
      }
      toast.add({
        severity: 'error',
        summary: 'Unable to load account information',
        detail: 'Please try again.',
        life: 3200,
      });
    }
  }

  fetchTransactions();
});
</script>
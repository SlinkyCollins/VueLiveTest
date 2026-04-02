<template>
  <PageWrapper>
    <div class="page-stack">
      <SectionHeader
        title="Dashboard"
        :subtitle="user ? `Welcome back, ${user.name}. Here's your latest account overview.` : 'Review your account summary and next actions.'"
        eyebrow="Vaultly"
      >
        <template #actions>
          <button
            class="btn-danger"
            :disabled="loggingOut"
            @click="handleLogout"
          >
            <span class="pi pi-sign-out text-sm" />
            {{ loggingOut ? 'Logging out...' : 'Logout' }}
          </button>
        </template>
      </SectionHeader>

      <div v-if="loading" class="empty-state min-h-72">
        <span class="pi pi-spin pi-spinner text-2xl text-brand-600" />
        <p>Loading dashboard...</p>
        <div class="w-full max-w-4xl space-y-4 pt-2">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Skeleton height="8.5rem" borderRadius="1rem" />
            <Skeleton height="8.5rem" borderRadius="1rem" />
            <Skeleton height="8.5rem" borderRadius="1rem" />
          </div>
          <Skeleton height="10.5rem" borderRadius="1rem" />
        </div>
      </div>

      <div v-else-if="errorMessage" class="empty-state min-h-72">
        <span class="pi pi-exclamation-circle text-2xl text-red-600" />
        <p>{{ errorMessage }}</p>
        <button class="btn-primary" @click="fetchDashboard">Retry</button>
      </div>

      <div v-else-if="user" class="page-stack">
        <div class="stats-grid">
          <StatCard
            label="Available balance"
            :value="formatCurrency(user.balance)"
            meta="Available for transfers and withdrawals"
          >
            <template #icon>
              <span class="pi pi-wallet text-lg" />
            </template>
          </StatCard>

          <StatCard
            label="Account number"
            :value="user.account_number"
            :meta="`Account type: ${user.account_type}`"
          >
            <template #icon>
              <span class="pi pi-credit-card text-lg" />
            </template>
          </StatCard>

          <StatCard
            label="Security"
            :value="user.has_pin ? 'PIN active' : 'PIN required'"
            :meta="user.has_pin ? 'Transfers are protected with your transaction PIN.' : 'Set a transaction PIN before sending money.'"
          >
            <template #icon>
              <span class="pi pi-shield text-lg" />
            </template>
          </StatCard>
        </div>

        <section class="content-card section-stack">
          <div class="space-y-1.5">
            <h2 class="section-title">Quick actions</h2>
            <p class="section-subtitle">
              Use the same controls across the app to keep the workflow predictable.
            </p>
          </div>

          <div class="action-grid">
            <button
              class="btn-primary justify-start"
              @click="router.push({ name: 'Deposit', params: { userId: String(user.id) } })"
            >
              <span class="pi pi-plus-circle text-sm" />
              Add money
            </button>
            <button
              class="btn-secondary justify-start"
              @click="router.push({ name: 'Transfer', params: { userId: String(user.id) } })"
            >
              <span class="pi pi-arrow-right-arrow-left text-sm" />
              Transfer
            </button>
            <button
              class="btn-secondary justify-start"
              @click="router.push({ name: 'Beneficiaries', params: { userId: String(user.id) } })"
            >
              <span class="pi pi-users text-sm" />
              Beneficiaries
            </button>
            <button
              class="btn-secondary justify-start"
              @click="router.push({ name: 'TransactionHistory', params: { userId: String(user.id) } })"
            >
              <span class="pi pi-history text-sm" />
              History
            </button>
            <button
              class="btn-secondary justify-start"
              @click="router.push({ name: 'Withdraw', params: { userId: String(user.id) } })"
            >
              <span class="pi pi-arrow-circle-up text-sm" />
              Withdraw
            </button>
            <button
              class="btn-secondary justify-start"
              @click="router.push({ name: 'Profile', params: { userId: String(user.id) } })"
            >
              <span class="pi pi-user text-sm" />
              Profile
            </button>
          </div>
        </section>

        <section class="content-card section-stack">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="space-y-1.5">
              <h2 class="section-title">Security</h2>
              <p class="section-subtitle">
                Keep transfers protected with a dedicated transaction PIN.
              </p>
            </div>

            <button
              v-if="!user.has_pin"
              class="btn-primary"
              @click="router.push({ name: 'SetPin', params: { userId: String(user.id) } })"
            >
              Set transaction PIN
            </button>
            <button
              v-else
              class="btn-secondary"
              @click="router.push({ name: 'ChangePin', params: { userId: String(user.id) } })"
            >
              Change PIN
            </button>
          </div>

          <div
            v-if="!user.has_pin"
            class="alert-warning"
          >
            You must set a transaction PIN before making transfers.
          </div>
          <div
            v-else
            class="alert-info"
          >
            Your transaction PIN is active and ready for secure transfers.
          </div>
        </section>

        <section class="content-card section-stack">
          <div class="space-y-1.5">
            <h2 class="section-title">Profile summary</h2>
            <p class="section-subtitle">
              Core account information for quick reference.
            </p>
          </div>

          <div class="key-value-grid">
            <div>
              <p class="key-value-label">Email</p>
              <p class="key-value-value">{{ user.email }}</p>
            </div>
            <div>
              <p class="key-value-label">Member since</p>
              <p class="key-value-value">{{ formatDate(user.created_at) }}</p>
            </div>
            <div v-if="user.next_of_kin_name">
              <p class="key-value-label">Next of kin</p>
              <p class="key-value-value">{{ user.next_of_kin_name }}</p>
            </div>
            <div v-if="user.next_of_kin_phone">
              <p class="key-value-label">Next of kin phone</p>
              <p class="key-value-value">{{ user.next_of_kin_phone }}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  </PageWrapper>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Skeleton from 'primevue/skeleton';
import api from '@/utils/api';
import { useAuthStore } from '@/stores/auth';
import PageWrapper from '@/components/ui/PageWrapper.vue';
import SectionHeader from '@/components/ui/SectionHeader.vue';
import StatCard from '@/components/ui/StatCard.vue';

const loading = ref(true);
const errorMessage = ref('');
const loggingOut = ref(false);
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const toast = useToast();

const user = computed(() => authStore.user);

const formatCurrency = (value) => `₦${Number(value || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
const formatDate = (value) => new Date(value).toLocaleDateString();

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
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'PIN set successfully.',
      life: 2500,
    });

    const nextQuery = { ...route.query };
    delete nextQuery.pinSet;

    router.replace({
      name: 'Dashboard',
      params: { userId: String(route.params.userId) },
      query: nextQuery,
    });
  } else if (route.query.pinChanged === '1') {
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'PIN changed successfully.',
      life: 2500,
    });

    const nextQuery = { ...route.query };
    delete nextQuery.pinChanged;

    router.replace({
      name: 'Dashboard',
      params: { userId: String(route.params.userId) },
      query: nextQuery,
    });
  } else if (route.query.loginSuccess === '1') {
    toast.add({
      severity: 'success',
      summary: 'Welcome back',
      detail: 'Login successful.',
      life: 2500,
    });

    const nextQuery = { ...route.query };
    delete nextQuery.loginSuccess;

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

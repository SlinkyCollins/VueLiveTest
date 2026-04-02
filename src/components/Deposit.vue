<template>
  <PageWrapper narrow>
    <div class="page-stack">
      <SectionHeader
        title="Deposit"
        subtitle="Add money to your Vaultly balance with a single, straightforward workflow."
        eyebrow="Funding"
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

      <FormCard
        title="Add money"
        subtitle="Enter a deposit amount and confirm the transaction."
      >
        <form @submit.prevent="handleDeposit" class="form-stack">
          <div class="surface-muted text-center">
            <p class="stat-label">Current balance</p>
            <p class="mt-2 text-3xl font-semibold tracking-tight text-brand-700">
              {{ formatCurrency(authStore.user?.balance) }}
            </p>
          </div>

          <div>
            <label class="field-label">Amount (₦)</label>
            <InputText
              v-model="amount"
              type="number"
              min="100"
              step="0.01"
              placeholder="Enter amount (minimum ₦100)"
              :class="{ 'p-invalid': errors.amount }"
              @input="clearErrors"
            />
            <p v-if="errors.amount" class="field-error">{{ errors.amount }}</p>
          </div>

          <div v-if="successMessage" class="alert-success">{{ successMessage }}</div>
          <div v-if="errorMessage" class="alert-error">{{ errorMessage }}</div>

          <Button
            type="submit"
            class="btn-primary w-full"
            :disabled="loading"
            :label="loading ? 'Processing...' : 'Deposit'"
          />
        </form>
      </FormCard>
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
import FormCard from '@/components/ui/FormCard.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const amount = ref('');
const loading = ref(false);
const errors = ref({});
const errorMessage = ref('');
const successMessage = ref('');
const formatCurrency = (value) => `₦${Number(value || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

onMounted(async () => {
  if (!authStore.user) {
    try {
      await authStore.fetchDashboard();
    } catch (err) {
      // Redirect only when authentication is invalid
      if (err?.response?.status === 401) {
        router.push({ name: 'Login' });
        return;
      }

      // Keep user on page for transient/server errors
      errorMessage.value = 'Unable to load your account details. Please try again.';
      return;
    }
  }

  try {
    await authStore.fetchBalance();
  } catch (err) {
    // Don't force logout on non-auth errors
    if (err?.response?.status === 401) {
      router.push({ name: 'Login' });
      return;
    }
    errorMessage.value = 'Unable to refresh your balance right now.';
  }
});

const clearErrors = () => {
  errors.value = {};
  errorMessage.value = '';
};

const validate = () => {
  const newErrors = {};
  const value = Number(amount.value);

  if (!amount.value) {
    newErrors.amount = 'Amount is required.';
  } else if (isNaN(value) || value <= 0) {
    newErrors.amount = 'Please enter a valid amount.';
  } else if (value < 100) {
    newErrors.amount = 'Minimum deposit is ₦100.';
  } else if (value > 10000000) {
    newErrors.amount = 'Maximum deposit is ₦10,000,000.';
  }

  errors.value = newErrors;
  return Object.keys(newErrors).length === 0;
};

const handleDeposit = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  if (!validate()) return;

  loading.value = true;

  try {
    const res = await api.post('/deposit', {
      amount: Number(amount.value),
    });

    if (res.data.status === '200') {
      successMessage.value = res.data.msg;
      authStore.updateBalance(res.data.new_balance);
      amount.value = '';
    } else if (res.data.status === '422') {
      const serverErrors = res.data.msg;
      if (serverErrors.amount) errors.value.amount = serverErrors.amount[0];
    } else {
      errorMessage.value = 'Something went wrong. Please try again.';
    }
  } catch (err) {
    if (err.code === 'ERR_NETWORK') {
      errorMessage.value = 'Unable to connect to the server.';
    } else {
      errorMessage.value = 'Deposit failed. Please try again.';
    }
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-6">
    <div class="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
      <button
        @click="router.push({ name: 'Dashboard' })"
        class="text-blue-600 text-sm font-medium hover:underline mb-4 inline-block"
      >&larr; Back to Dashboard</button>

      <h2 class="text-2xl font-bold text-center mb-6 text-red-600">Withdraw Cash</h2>

      <form @submit.prevent="handleWithdraw" class="space-y-4">
        <div class="bg-gray-50 rounded-lg p-4 text-center">
          <p class="text-sm text-gray-500">Current Balance</p>
          <p class="text-2xl font-bold text-blue-600">
            ₦{{ authStore.user ? Number(authStore.user.balance).toLocaleString('en-NG', { minimumFractionDigits: 2 }) : '0.00' }}
          </p>
        </div>

        <div>
          <label class="block text-gray-700 font-medium">Amount (₦)</label>
          <input
            v-model="amount"
            @input="clearErrors"
            type="number"
            min="100"
            step="0.01"
            placeholder="Enter amount (min ₦100)"
            class="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            :class="{ 'border-red-500': errors.amount }"
          />
          <p v-if="errors.amount" class="text-red-500 text-sm mt-1">{{ errors.amount }}</p>
        </div>

        <div>
          <label class="block text-gray-700 font-medium">Transaction PIN</label>
          <input
            v-model="pin"
            @input="handlePinInput"
            type="password"
            inputmode="numeric"
            maxlength="4"
            placeholder="Enter 4-digit PIN"
            class="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            :class="{ 'border-red-500': errors.pin }"
          />
          <p v-if="errors.pin" class="text-red-500 text-sm mt-1">{{ errors.pin }}</p>
        </div>

        <button
          type="submit"
          class="w-full py-2 px-4 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="loading"
        >{{ loading ? 'Processing...' : 'Withdraw' }}</button>

        <p v-if="successMessage" class="text-green-600 text-center text-sm mt-3">{{ successMessage }}</p>
        <p v-if="errorMessage" class="text-red-600 text-center text-sm mt-3">{{ errorMessage }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/utils/api';
import { useAuthStore } from '@/stores/auth';
import { useInputNormalization } from '@/composables/useInputNormalization';

const router = useRouter();
const authStore = useAuthStore();
const { normalizeRefDigits } = useInputNormalization();

const amount = ref('');
const pin = ref('');
const loading = ref(false);
const errors = ref({});
const errorMessage = ref('');
const successMessage = ref('');

onMounted(async () => {
  if (!authStore.user) {
    try {
      await authStore.fetchDashboard();
    } catch (err) {
      if (err?.response?.status === 401) {
        router.push({ name: 'Login' });
        return;
      }
      errorMessage.value = 'Unable to load your account details. Please try again.';
      return;
    }
  }

  try {
    await authStore.fetchBalance();
  } catch (err) {
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

const handlePinInput = () => {
  normalizeRefDigits(pin, 4);
  clearErrors();
};

const validate = () => {
  const newErrors = {};
  const value = Number(amount.value);

  if (!amount.value) {
    newErrors.amount = 'Amount is required.';
  } else if (isNaN(value) || value <= 0) {
    newErrors.amount = 'Please enter a valid amount.';
  } else if (value < 100) {
    newErrors.amount = 'Minimum withdrawal is ₦100.';
  } else if (value > 10000000) {
    newErrors.amount = 'Maximum withdrawal is ₦10,000,000.';
  }

  if (!pin.value) {
    newErrors.pin = 'PIN is required.';
  } else if (!/^\d{4}$/.test(pin.value)) {
    newErrors.pin = 'PIN must be exactly 4 digits.';
  }

  errors.value = newErrors;
  return Object.keys(newErrors).length === 0;
};

const handleWithdraw = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  if (!validate()) return;

  loading.value = true;

  try {
    const res = await api.post('/withdraw', {
      amount: Number(amount.value),
      pin: pin.value,
    });

    if (res.data.status === '200') {
      successMessage.value = res.data.msg;
      authStore.updateBalance(res.data.new_balance);
      amount.value = '';
      pin.value = '';
    } else if (res.data.status === '422') {
      const serverErrors = res.data.msg;
      if (serverErrors.amount) errors.value.amount = serverErrors.amount[0];
      if (serverErrors.pin) errors.value.pin = serverErrors.pin[0];
    } else {
      errorMessage.value = res.data.msg || 'Something went wrong. Please try again.';
    }
  } catch (err) {
    if (err.code === 'ERR_NETWORK') {
      errorMessage.value = 'Unable to connect to the server.';
    } else {
      errorMessage.value = err?.response?.data?.msg || 'Withdrawal failed. Please try again.';
    }
  } finally {
    loading.value = false;
  }
};
</script>
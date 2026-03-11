<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-6">
    <div class="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
      <button
        @click="router.push({ name: 'Dashboard' })"
        class="text-blue-600 text-sm font-medium hover:underline mb-4 inline-block"
      >&larr; Back to Dashboard</button>

      <h2 class="text-2xl font-bold text-center mb-2 text-blue-600">Set Transaction PIN 🔒</h2>
      <p class="text-gray-500 text-center text-sm mb-6">Create a 4-digit PIN to authorize transfers</p>

      <form @submit.prevent="handleSetPin" class="space-y-4">
        <div>
          <label class="block text-gray-700 font-medium">PIN</label>
          <input
            v-model="pin"
            @input="clearErrors"
            type="password"
            maxlength="4"
            inputmode="numeric"
            placeholder="Enter 4-digit PIN"
            class="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-center text-2xl tracking-[0.5em]"
            :class="{ 'border-red-500': errors.pin }"
          />
          <p v-if="errors.pin" class="text-red-500 text-sm mt-1">{{ errors.pin }}</p>
        </div>

        <div>
          <label class="block text-gray-700 font-medium">Confirm PIN</label>
          <input
            v-model="pinConfirmation"
            @input="clearErrors"
            type="password"
            maxlength="4"
            inputmode="numeric"
            placeholder="Re-enter 4-digit PIN"
            class="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-center text-2xl tracking-[0.5em]"
            :class="{ 'border-red-500': errors.pin_confirmation }"
          />
          <p v-if="errors.pin_confirmation" class="text-red-500 text-sm mt-1">{{ errors.pin_confirmation }}</p>
        </div>

        <button
          type="submit"
          class="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="loading"
        >{{ loading ? 'Setting PIN...' : 'Set PIN' }}</button>

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

const router = useRouter();
const authStore = useAuthStore();

const pin = ref('');
const pinConfirmation = ref('');
const loading = ref(false);
const errors = ref({});
const errorMessage = ref('');
const successMessage = ref('');

onMounted(async () => {
  if (!authStore.user) {
    try {
      await authStore.fetchDashboard();
    } catch {
      router.push({ name: 'Login' });
      return;
    }
  }

  // Redirect if PIN already set
  if (authStore.user?.has_pin) {
    router.push({ name: 'ChangePin' });
  }
});

const clearErrors = () => {
  errors.value = {};
  errorMessage.value = '';
};

const validate = () => {
  const newErrors = {};

  if (!pin.value) {
    newErrors.pin = 'PIN is required.';
  } else if (!/^\d{4}$/.test(pin.value)) {
    newErrors.pin = 'PIN must be exactly 4 digits.';
  }

  if (!pinConfirmation.value) {
    newErrors.pin_confirmation = 'Please confirm your PIN.';
  } else if (pin.value !== pinConfirmation.value) {
    newErrors.pin_confirmation = 'PINs do not match.';
  }

  errors.value = newErrors;
  return Object.keys(newErrors).length === 0;
};

const handleSetPin = async () => {
  errorMessage.value = '';
  successMessage.value = '';
  if (!validate()) return;

  loading.value = true;

  try {
    const res = await api.post('/set-pin', {
      pin: pin.value,
      pin_confirmation: pinConfirmation.value,
    });

    if (res.data.status === '200') {
      successMessage.value = res.data.msg;
      if (authStore.user) authStore.user.has_pin = true;
      setTimeout(() => router.push({ name: 'Dashboard' }), 1500);
    } else if (res.data.status === '422') {
      const serverErrors = res.data.msg;
      if (serverErrors.pin) errors.value.pin = serverErrors.pin[0];
      if (serverErrors.pin_confirmation) errors.value.pin_confirmation = serverErrors.pin_confirmation[0];
    } else {
      errorMessage.value = res.data.msg;
    }
  } catch (err) {
    if (err.code === 'ERR_NETWORK') {
      errorMessage.value = 'Unable to connect to the server.';
    } else {
      errorMessage.value = 'Failed to set PIN. Please try again.';
    }
  } finally {
    loading.value = false;
  }
};
</script>

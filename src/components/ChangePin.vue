<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-6">
    <div class="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
      <button
        @click="router.push({ name: 'Dashboard', params: { userId: String(route.params.userId) } })"
        class="text-blue-600 text-sm font-medium hover:underline mb-4 inline-block"
      >&larr; Back to Dashboard</button>

      <h2 class="text-2xl font-bold text-center mb-2 text-blue-600">Change PIN 🔐</h2>
      <p class="text-gray-500 text-center text-sm mb-6">Update your 4-digit transaction PIN</p>

      <form @submit.prevent="handleChangePin" class="space-y-4">
        <div>
          <label class="block text-gray-700 font-medium">Current PIN</label>
          <input
            v-model="currentPin"
            @input="onCurrentPinInput"
            type="password"
            maxlength="4"
            inputmode="numeric"
            placeholder="Enter current PIN"
            class="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-center text-2xl tracking-[0.5em]"
            :class="{ 'border-red-500': errors.current_pin }"
          />
          <p v-if="errors.current_pin" class="text-red-500 text-sm mt-1">{{ errors.current_pin }}</p>
        </div>

        <div>
          <label class="block text-gray-700 font-medium">New PIN</label>
          <input
            v-model="newPin"
            @input="onNewPinInput"
            type="password"
            maxlength="4"
            inputmode="numeric"
            placeholder="Enter new 4-digit PIN"
            class="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-center text-2xl tracking-[0.5em]"
            :class="{ 'border-red-500': errors.new_pin }"
          />
          <p v-if="errors.new_pin" class="text-red-500 text-sm mt-1">{{ errors.new_pin }}</p>
        </div>

        <div>
          <label class="block text-gray-700 font-medium">Confirm New PIN</label>
          <input
            v-model="newPinConfirmation"
            @input="onNewPinConfirmationInput"
            type="password"
            maxlength="4"
            inputmode="numeric"
            placeholder="Re-enter new PIN"
            class="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-center text-2xl tracking-[0.5em]"
            :class="{ 'border-red-500': errors.new_pin_confirmation }"
          />
          <p v-if="errors.new_pin_confirmation" class="text-red-500 text-sm mt-1">{{ errors.new_pin_confirmation }}</p>
        </div>

        <button
          type="submit"
          class="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="loading"
        >{{ loading ? 'Changing PIN...' : 'Change PIN' }}</button>

        <p v-if="successMessage" class="text-green-600 text-center text-sm mt-3">{{ successMessage }}</p>
        <p v-if="errorMessage" class="text-red-600 text-center text-sm mt-3">{{ errorMessage }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/utils/api';
import { useAuthStore } from '@/stores/auth';
import { useInputNormalization } from '@/composables/useInputNormalization';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { normalizeRefDigits } = useInputNormalization();

const currentPin = ref('');
const newPin = ref('');
const newPinConfirmation = ref('');
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

  // Redirect if no PIN set yet
  if (authStore.user && !authStore.user.has_pin) {
    router.push({ name: 'SetPin', params: { userId: String(route.params.userId) } });
  }
});

const clearErrors = () => {
  errors.value = {};
  errorMessage.value = '';
};

const onCurrentPinInput = () => {
  normalizeRefDigits(currentPin, 4);
  clearErrors();
};

const onNewPinInput = () => {
  normalizeRefDigits(newPin, 4);
  clearErrors();
};

const onNewPinConfirmationInput = () => {
  normalizeRefDigits(newPinConfirmation, 4);
  clearErrors();
};

const validate = () => {
  const newErrors = {};

  if (!currentPin.value) {
    newErrors.current_pin = 'Current PIN is required.';
  } else if (!/^\d{4}$/.test(currentPin.value)) {
    newErrors.current_pin = 'PIN must be exactly 4 digits.';
  }

  if (!newPin.value) {
    newErrors.new_pin = 'New PIN is required.';
  } else if (!/^\d{4}$/.test(newPin.value)) {
    newErrors.new_pin = 'PIN must be exactly 4 digits.';
  }

  if (!newPinConfirmation.value) {
    newErrors.new_pin_confirmation = 'Please confirm your new PIN.';
  } else if (newPin.value !== newPinConfirmation.value) {
    newErrors.new_pin_confirmation = 'PINs do not match.';
  }

  if (currentPin.value && newPin.value && currentPin.value === newPin.value) {
    newErrors.new_pin = 'New PIN must be different from current PIN.';
  }

  errors.value = newErrors;
  return Object.keys(newErrors).length === 0;
};

const handleChangePin = async () => {
  errorMessage.value = '';
  successMessage.value = '';
  if (!validate()) return;

  loading.value = true;

  try {
    const res = await api.put('/change-pin', {
      current_pin: currentPin.value,
      new_pin: newPin.value,
      new_pin_confirmation: newPinConfirmation.value,
    });

    if (res.data.status === '200') {
      currentPin.value = '';
      newPin.value = '';
      newPinConfirmation.value = '';
      router.push({
        name: 'Dashboard',
        params: { userId: String(route.params.userId) },
        query: { pinChanged: '1' },
      });
    } else if (res.data.status === '422') {
      const serverErrors = res.data.msg;
      if (serverErrors.current_pin) errors.value.current_pin = serverErrors.current_pin[0];
      if (serverErrors.new_pin) errors.value.new_pin = serverErrors.new_pin[0];
      if (serverErrors.new_pin_confirmation) errors.value.new_pin_confirmation = serverErrors.new_pin_confirmation[0];
    } else {
      errorMessage.value = res.data.msg;
    }
  } catch (err) {
    if (err.code === 'ERR_NETWORK') {
      errorMessage.value = 'Unable to connect to the server.';
    } else {
      errorMessage.value = 'Failed to change PIN. Please try again.';
    }
  } finally {
    loading.value = false;
  }
};
</script>

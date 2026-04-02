<template>
  <PageWrapper auth>
    <FormCard
      title="Set transaction PIN"
      subtitle="Create a 4-digit PIN to authorize transfers from your Vaultly account."
    >
      <div class="mb-6">
        <button
          class="btn-link"
          @click="router.push({ name: 'Dashboard', params: { userId: String(route.params.userId) } })"
        >
          <span class="pi pi-arrow-left text-sm" />
          Back to dashboard
        </button>
      </div>

      <form @submit.prevent="handleSetPin" class="form-stack">
        <div>
          <label class="field-label">PIN</label>
          <Password
            v-model="pin"
            maxlength="4"
            inputmode="numeric"
            placeholder="Enter 4-digit PIN"
            :feedback="false"
            toggleMask
            fluid
            :inputClass="errors.pin ? 'w-full p-invalid text-center text-2xl tracking-[0.5em]' : 'w-full text-center text-2xl tracking-[0.5em]'"
            @input="onPinInput"
          />
          <p v-if="errors.pin" class="field-error">{{ errors.pin }}</p>
        </div>

        <div>
          <label class="field-label">Confirm PIN</label>
          <Password
            v-model="pinConfirmation"
            maxlength="4"
            inputmode="numeric"
            placeholder="Re-enter 4-digit PIN"
            :feedback="false"
            toggleMask
            fluid
            :inputClass="errors.pin_confirmation ? 'w-full p-invalid text-center text-2xl tracking-[0.5em]' : 'w-full text-center text-2xl tracking-[0.5em]'"
            @input="onPinConfirmationInput"
          />
          <p v-if="errors.pin_confirmation" class="field-error">{{ errors.pin_confirmation }}</p>
        </div>

        <div class="space-y-3">
          <Button
            type="submit"
            class="btn-primary w-full"
            :disabled="loading"
            :label="loading ? 'Setting PIN...' : 'Set PIN'"
          />

          <div v-if="successMessage" class="alert-success">{{ successMessage }}</div>
          <div v-if="errorMessage" class="alert-error">{{ errorMessage }}</div>
        </div>
      </form>
    </FormCard>
  </PageWrapper>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/utils/api';
import { useAuthStore } from '@/stores/auth';
import { useInputNormalization } from '@/composables/useInputNormalization';
import PageWrapper from '@/components/ui/PageWrapper.vue';
import FormCard from '@/components/ui/FormCard.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { normalizeRefDigits } = useInputNormalization();

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
    router.push({ name: 'ChangePin', params: { userId: String(route.params.userId) } });
  }
});

const clearErrors = () => {
  errors.value = {};
  errorMessage.value = '';
};

const onPinInput = () => {
  normalizeRefDigits(pin, 4);
  clearErrors();
};

const onPinConfirmationInput = () => {
  normalizeRefDigits(pinConfirmation, 4);
  clearErrors();
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
      if (authStore.user) {
        authStore.setUser({ ...authStore.user, has_pin: true });
      }

      pin.value = '';
      pinConfirmation.value = '';

      // Optional: sync from server (prefer handling errors explicitly)
      try {
        await authStore.fetchDashboard();
      } catch {
        // keep optimistic state; don't block success flow
      }

      router.push({
        name: 'Dashboard',
        params: { userId: String(route.params.userId) },
        query: { pinSet: '1' },
      });
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

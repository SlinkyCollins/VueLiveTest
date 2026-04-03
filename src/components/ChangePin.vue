<template>
  <PageWrapper auth>
    <FormCard
      title="Change transaction PIN"
      subtitle="Update your 4-digit PIN to keep transfers secure."
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

      <form @submit.prevent="handleChangePin" class="form-stack">
        <div>
          <label class="field-label">Current PIN</label>
          <Password
            v-model="currentPin"
            maxlength="4"
            inputmode="numeric"
            placeholder="Enter current PIN"
            :feedback="false"
            toggleMask
            fluid
            :inputClass="errors.current_pin ? 'w-full p-invalid text-center text-2xl tracking-[0.5em]' : 'w-full text-center text-2xl tracking-[0.5em]'"
            @input="onCurrentPinInput"
          />
          <p v-if="errors.current_pin" class="field-error">{{ errors.current_pin }}</p>
        </div>

        <div>
          <label class="field-label">New PIN</label>
          <Password
            v-model="newPin"
            maxlength="4"
            inputmode="numeric"
            placeholder="Enter new 4-digit PIN"
            :feedback="false"
            toggleMask
            fluid
            :inputClass="errors.new_pin ? 'w-full p-invalid text-center text-2xl tracking-[0.5em]' : 'w-full text-center text-2xl tracking-[0.5em]'"
            @input="onNewPinInput"
          />
          <p v-if="errors.new_pin" class="field-error">{{ errors.new_pin }}</p>
        </div>

        <div>
          <label class="field-label">Confirm new PIN</label>
          <Password
            v-model="newPinConfirmation"
            maxlength="4"
            inputmode="numeric"
            placeholder="Re-enter new PIN"
            :feedback="false"
            toggleMask
            fluid
            :inputClass="errors.new_pin_confirmation ? 'w-full p-invalid text-center text-2xl tracking-[0.5em]' : 'w-full text-center text-2xl tracking-[0.5em]'"
            @input="onNewPinConfirmationInput"
          />
          <p v-if="errors.new_pin_confirmation" class="field-error">{{ errors.new_pin_confirmation }}</p>
        </div>

        <div class="space-y-3">
          <Button
            type="submit"
            class="btn-primary w-full"
            :disabled="loading"
            :label="loading ? 'Changing PIN...' : 'Change PIN'"
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

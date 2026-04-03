<template>
  <PageWrapper auth>
    <FormCard
      title="Change password"
      subtitle="Update your account password to keep your profile secure."
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

      <form @submit.prevent="handleChangePassword" class="form-stack">
        <div>
          <label class="field-label">Current password</label>
          <Password
            v-model="form.current_password"
            placeholder="Enter current password"
            :feedback="false"
            toggleMask
            fluid
            :inputClass="errors.current_password ? 'w-full p-invalid' : 'w-full'"
            @input="clearServerMessage"
          />
          <p v-if="errors.current_password" class="field-error">{{ errors.current_password }}</p>
        </div>

        <div>
          <label class="field-label">New password</label>
          <Password
            v-model="form.new_password"
            placeholder="Create a new password"
            :feedback="true"
            toggleMask
            fluid
            :inputClass="errors.new_password ? 'w-full p-invalid' : 'w-full'"
            @input="clearServerMessage"
          />
          <p v-if="errors.new_password" class="field-error">{{ errors.new_password }}</p>
          <p class="field-help">Use at least 8 characters with letters, numbers, and a special character.</p>
        </div>

        <div>
          <label class="field-label">Confirm new password</label>
          <Password
            v-model="form.new_password_confirmation"
            placeholder="Re-enter new password"
            :feedback="false"
            toggleMask
            fluid
            :inputClass="errors.new_password_confirmation ? 'w-full p-invalid' : 'w-full'"
            @input="clearServerMessage"
          />
          <p v-if="errors.new_password_confirmation" class="field-error">{{ errors.new_password_confirmation }}</p>
        </div>

        <Button
          type="submit"
          class="btn-primary w-full"
          :disabled="loading"
          :label="loading ? 'Updating password...' : 'Update password'"
        />
      </form>
    </FormCard>
  </PageWrapper>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import api from '@/utils/api';
import { useAuthStore } from '@/stores/auth';
import PageWrapper from '@/components/ui/PageWrapper.vue';
import FormCard from '@/components/ui/FormCard.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const toast = useToast();

const loading = ref(false);
const errors = ref({});

const form = ref({
  current_password: '',
  new_password: '',
  new_password_confirmation: '',
});

onMounted(async () => {
  if (!authStore.user) {
    try {
      await authStore.fetchDashboard();
    } catch {
      router.push({ name: 'Login' });
    }
  }
});

const clearServerMessage = () => {
  errors.value = {};
};

const validate = () => {
  const nextErrors = {};

  if (!form.value.current_password) {
    nextErrors.current_password = 'Current password is required.';
  }

  if (!form.value.new_password) {
    nextErrors.new_password = 'New password is required.';
  } else if (form.value.new_password.length < 8) {
    nextErrors.new_password = 'Password must be at least 8 characters.';
  }

  if (!form.value.new_password_confirmation) {
    nextErrors.new_password_confirmation = 'Please confirm your new password.';
  } else if (form.value.new_password !== form.value.new_password_confirmation) {
    nextErrors.new_password_confirmation = 'Password confirmation does not match.';
  }

  if (
    form.value.current_password &&
    form.value.new_password &&
    form.value.current_password === form.value.new_password
  ) {
    nextErrors.new_password = 'New password must be different from current password.';
  }

  errors.value = nextErrors;
  return Object.keys(nextErrors).length === 0;
};

const handleChangePassword = async () => {
  if (!validate()) {
    return;
  }

  loading.value = true;

  try {
    const res = await api.put('/change-password', {
      current_password: form.value.current_password,
      new_password: form.value.new_password,
      new_password_confirmation: form.value.new_password_confirmation,
    });

    if (res.data.status === '200') {
      form.value.current_password = '';
      form.value.new_password = '';
      form.value.new_password_confirmation = '';

      toast.add({
        severity: 'success',
        summary: 'Password updated',
        detail: res.data.msg || 'Password changed successfully!',
        life: 2600,
      });

      router.push({
        name: 'Dashboard',
        params: { userId: String(route.params.userId) },
      });
    } else if (res.data.status === '422') {
      const serverErrors = res.data.msg;
      errors.value = {
        current_password: serverErrors.current_password?.[0],
        new_password: serverErrors.new_password?.[0],
        new_password_confirmation: serverErrors.new_password_confirmation?.[0],
      };

      toast.add({
        severity: 'warn',
        summary: 'Validation required',
        detail: 'Please fix the highlighted fields.',
        life: 3000,
      });
    } else {
      toast.add({
        severity: 'error',
        summary: 'Password update failed',
        detail: res.data.msg || 'Unable to change password.',
        life: 3200,
      });
    }
  } catch (err) {
    if (err.response?.status === 422) {
      const serverErrors = err.response?.data?.msg || {};
      errors.value = {
        current_password: serverErrors.current_password?.[0],
        new_password: serverErrors.new_password?.[0],
        new_password_confirmation: serverErrors.new_password_confirmation?.[0],
      };

      toast.add({
        severity: 'warn',
        summary: 'Validation required',
        detail: 'Please fix the highlighted fields.',
        life: 3000,
      });
    } else if (err.response?.status === 401) {
      toast.add({
        severity: 'warn',
        summary: 'Incorrect password',
        detail: err.response?.data?.msg || 'Current password is incorrect.',
        life: 3000,
      });
    } else if (err.code === 'ERR_NETWORK') {
      toast.add({
        severity: 'error',
        summary: 'Connection error',
        detail: 'Unable to connect to the server.',
        life: 3200,
      });
    } else {
      toast.add({
        severity: 'error',
        summary: 'Password update failed',
        detail: err.response?.data?.msg || 'Unable to change password.',
        life: 3200,
      });
    }
  } finally {
    loading.value = false;
  }
};
</script>

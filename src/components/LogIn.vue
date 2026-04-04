<template>
  <PageWrapper auth>
    <FormCard
      title="Welcome back"
      subtitle="Sign in to review balances, move money, and manage your account."
    >
      <form @submit.prevent="handleLogin" class="form-stack">
        <div>
          <label for="email" class="field-label">Email address</label>
          <InputText
            id="email"
            v-model="form.email"
            type="email"
            name="email"
            placeholder="you@mail.com"
            :class="{ 'p-invalid': errors.email }"
            @input="clearFieldError('email')"
          />
          <p v-if="errors.email" class="field-error">{{ errors.email }}</p>
        </div>

        <div>
          <label for="password" class="field-label">Password</label>
          <Password
            id="password"
            v-model="form.password"
            name="password"
            placeholder="Enter your password"
            :feedback="false"
            toggleMask
            fluid
            :inputClass="errors.password ? 'w-full p-invalid' : 'w-full'"
            @input="clearFieldError('password')"
          />
          <p v-if="errors.password" class="field-error">{{ errors.password }}</p>
        </div>

        <div class="space-y-3">
          <Button
            type="submit"
            class="btn-primary w-full"
            :disabled="loading"
            :label="loading ? 'Logging in...' : 'Log in'"
          />
        </div>
      </form>

      <div class="mt-6 border-t border-surface-200 pt-5 text-sm text-surface-500">
        New to Vaultly?
        <RouterLink :to="{ name: 'signup' }" class="font-medium text-brand-600">
          Create an account
        </RouterLink>
      </div>
    </FormCard>
  </PageWrapper>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from "vue-router";
import { useToast } from 'primevue/usetoast';
import api from '@/utils/api';
import { useAuthStore } from '@/stores/auth';
import PageWrapper from '@/components/ui/PageWrapper.vue';
import FormCard from '@/components/ui/FormCard.vue';


const form = ref({
  email: "",
  password: "",
});
const loading = ref(false);
const errors = ref({});
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const toast = useToast();

onMounted(() => {
  if (route.query.sessionExpired === '1') {
    toast.add({
      severity: 'error',
      summary: 'Unauthorized',
      detail: 'Your session has expired. Please log in again.',
      life: 4000,
    });

    const nextQuery = { ...route.query };
    delete nextQuery.sessionExpired;

    router.replace({
      name: 'Login',
      query: nextQuery,
    });
  }

  if (route.query.signupSuccess === '1') {
    toast.add({
      severity: 'success',
      summary: 'Signup successful',
      detail: 'Please log in.',
      life: 2600,
    });

    const nextQuery = { ...route.query };
    delete nextQuery.signupSuccess;

    router.replace({
      name: 'Login',
      query: nextQuery,
    });
  }
});

const clearFieldError = (field) => {
  if (errors.value[field]) {
    delete errors.value[field];
  }
};

const validate = () => {
  const newErrors = {};

  if (!form.value.email) {
    newErrors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    newErrors.email = "Please enter a valid email address.";
  }

  if (!form.value.password) {
    newErrors.password = "Password is required.";
  }

  errors.value = newErrors;
  return Object.keys(newErrors).length === 0;
};

const handleLogin = async () => {
  if (!validate()) return;

  loading.value = true;

  try {
    const res = await api.post("/login", {
      email: form.value.email,
      password: form.value.password,
    });

    if (res.data.status === "200") {
      toast.add({
        severity: 'success',
        summary: 'Welcome back',
        detail: res.data.msg || 'Login successful.',
        life: 2200,
      });

      // Store token and user in Pinia
      authStore.setAuth(res.data.access_token, res.data.user);

      router.push({
        name: "Dashboard",
        params: { userId: String(res.data.user.id) },
        query: { loginSuccess: '1' },
      });
    } else if (res.data.status === "401") {
      toast.add({
        severity: 'error',
        summary: 'Login failed',
        detail: res.data.msg || 'Invalid credentials.',
        life: 3000,
      });
    } else if (res.data.status === "422") {
      // Server-side validation errors
      const serverErrors = res.data.msg;
      if (serverErrors.email) errors.value.email = serverErrors.email[0];
      if (serverErrors.password) errors.value.password = serverErrors.password[0];
      toast.add({
        severity: 'warn',
        summary: 'Validation required',
        detail: 'Please fix the highlighted fields.',
        life: 2800,
      });
    } else {
      toast.add({
        severity: 'error',
        summary: 'Login failed',
        detail: 'Something went wrong. Please try again.',
        life: 3200,
      });
    }
  } catch (err) {
    if (err.code === "ERR_NETWORK") {
      toast.add({
        severity: 'error',
        summary: 'Connection issue',
        detail: 'Unable to connect to the server. Please check your internet connection.',
        life: 3200,
      });
    } else if (err.code === "ECONNABORTED") {
      toast.add({
        severity: 'warn',
        summary: 'Request timed out',
        detail: 'Please try again.',
        life: 3000,
      });
    } else {
      toast.add({
        severity: 'error',
        summary: 'Login failed',
        detail: 'Something went wrong. Please try again.',
        life: 3200,
      });
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style></style>

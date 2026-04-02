<template>
  <PageWrapper auth>
    <FormCard
      title="Welcome back"
      subtitle="Sign in to review balances, move money, and manage your account."
    >
      <div class="mb-6 space-y-3">
        <span class="badge-primary">Vaultly</span>
        <p class="section-subtitle">
          Simple everyday banking with a clean, reliable workflow.
        </p>
      </div>

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

          <div v-if="errorMessage" class="alert-error">{{ errorMessage }}</div>
          <div v-if="successMessage" class="alert-success">{{ successMessage }}</div>
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
const errorMessage = ref("");
const successMessage = ref("");
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

onMounted(() => {
  if (route.query.signupSuccess === '1') {
    successMessage.value = 'Signup successful. Please log in.';

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
  errorMessage.value = "";
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
  errorMessage.value = "";
  successMessage.value = "";

  if (!validate()) return;

  loading.value = true;

  try {
    const res = await api.post("/login", {
      email: form.value.email,
      password: form.value.password,
    });

    if (res.data.status === "200") {
      successMessage.value = res.data.msg;

      // Store token and user in Pinia
      authStore.setAuth(res.data.access_token, res.data.user);

      router.push({
        name: "Dashboard",
        params: { userId: String(res.data.user.id) },
        query: { loginSuccess: '1' },
      });
    } else if (res.data.status === "401") {
      errorMessage.value = res.data.msg;
    } else if (res.data.status === "422") {
      // Server-side validation errors
      const serverErrors = res.data.msg;
      if (serverErrors.email) errors.value.email = serverErrors.email[0];
      if (serverErrors.password) errors.value.password = serverErrors.password[0];
    } else {
      errorMessage.value = "Something went wrong. Please try again.";
    }
  } catch (err) {
    if (err.code === "ERR_NETWORK") {
      errorMessage.value = "Unable to connect to the server. Please check your internet connection.";
    } else if (err.code === "ECONNABORTED") {
      errorMessage.value = "Request timed out. Please try again.";
    } else {
      errorMessage.value = "Something went wrong. Please try again.";
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style></style>

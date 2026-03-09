<template>
  <div class="min-h-screen flex justify-center items-center bg-gray-50">
    <div class="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
      <h2 class="text-2xl font-bold text-center mb-6 text-blue-600">
        Login to Your Account 🔐
      </h2>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label for="email" class="block text-gray-700 font-medium">Email</label>
          <input
            id="email"
            v-model="form.email"
            @input="clearFieldError('email')"
            placeholder="you@mail.com"
            type="email"
            name="email"
            class="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            :class="{ 'border-red-500': errors.email }"
          />
          <p v-if="errors.email" class="text-red-500 text-sm mt-1">{{ errors.email }}</p>
        </div>
        <div>
          <label for="password" class="block text-gray-700 font-medium">Password</label>
          <input
            id="password"
            v-model="form.password"
            @input="clearFieldError('password')"
            placeholder="••••••••"
            type="password"
            name="password"
            class="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            :class="{ 'border-red-500': errors.password }"
          />
          <p v-if="errors.password" class="text-red-500 text-sm mt-1">{{ errors.password }}</p>
        </div>
        <div class="flex items-center">
          <!-- "Remember Me" toggle using Headless UI Switch -->
          <Switch v-model="rememberMe" :class="rememberMe ? 'bg-blue-600' : 'bg-gray-200'" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none hover:cursor-pointer">
            <span class="sr-only">Remember me</span>
            <span :class="rememberMe ? 'translate-x-6' : 'translate-x-1'" class="inline-block h-4 w-4 transform rounded-full bg-white transition" ></span>
          </Switch>
          <label class="ml-2">Remember me</label>
        </div>

        <button
          type="submit"
          class="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="loading"
        >{{ loading ? 'Logging in...' : 'Log in' }}</button>

        <p v-if="errorMessage" class="text-red-600 text-center text-sm mt-3">{{ errorMessage }}</p>
        <p v-if="successMessage" class="text-green-600 text-center text-sm mt-3">{{ successMessage }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from "vue-router";
import { Switch } from '@headlessui/vue';
import axios from 'axios';

const form = ref({
  email: "",
  password: "",
});
const rememberMe = ref(false);
const loading = ref(false);
const errors = ref({});
const errorMessage = ref("");
const successMessage = ref("");
const router = useRouter();

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
    const res = await axios.post("http://127.0.0.1:8000/api/login", {
      email: form.value.email,
      password: form.value.password,
    });

    if (res.data.status === "200") {
      successMessage.value = res.data.msg;

      // Store token
      localStorage.setItem("access_token", res.data.access_token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setTimeout(() => {
        router.push({ name: "Dashboard" });
      }, 1000);
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
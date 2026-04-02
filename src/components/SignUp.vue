<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
      <h2 class="text-2xl font-bold text-center mb-6 text-blue-600">
        Create Bank Account 🏦
      </h2>

      <form @submit.prevent="submitForm" class="space-y-4">

        <!-- Full Name -->
        <div>
          <label class="block text-gray-700 font-medium">Full Name</label>
          <input
            v-model="form.fullname"
            type="text"
            placeholder="John Doe"
            class="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <p v-if="errors.fullname" class="text-red-500 text-sm mt-1">{{ errors.fullname[0] }}</p>
        </div>

        <!-- Email -->
        <div>
          <label class="block text-gray-700 font-medium">Email</label>
          <input
            v-model="form.email"
            type="email"
            placeholder="you@mail.com"
            class="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <p v-if="errors.email" class="text-red-500 text-sm mt-1">{{ errors.email[0] }}</p>
        </div>

        <!-- Password -->
        <div>
          <label class="block text-gray-700 font-medium">Password</label>
          <input
            v-model="form.password"
            type="password"
            placeholder="••••••••"
            class="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <p v-if="errors.password" class="text-red-500 text-sm mt-1">{{ errors.password[0] }}</p>
        </div>

        <!-- Account Type -->
        <div>
          <label class="block text-gray-700 font-medium mb-1">Account Type</label>
          <select
            v-model="form.accountType"
            class="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
          >
            <option value="" disabled>Select account type</option>
            <option
              v-for="type in accountTypes"
              :key="type"
              :value="type"
            >
              {{ type }}
            </option>
          </select>
          <p v-if="errors.accountType" class="text-red-500 text-sm mt-1">{{ errors.accountType[0] }}</p>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          class="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          :disabled="loading"
        >
          {{ loading ? 'Signing Up...' : 'Sign Up' }}
        </button>

        <!-- Success & Error Messages -->
        <p v-if="successMessage" class="text-green-600 text-center mt-3">{{ successMessage }}</p>
        <p v-if="errorMessage" class="text-red-600 text-center mt-3">{{ errorMessage }}</p>

      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import api from "@/utils/api";

const router = useRouter();

const form = ref({
  fullname: "",
  email: "",
  password: "",
  accountType: "",
});

const accountTypes = ["savings", "current", "fixed"];

const errors = ref({});
const loading = ref(false);
const successMessage = ref("");
const errorMessage = ref("");

const submitForm = async () => {
  errors.value = {};
  errorMessage.value = "";
  successMessage.value = "";

  if (!form.value.fullname || !form.value.email || !form.value.password || !form.value.accountType) {
    errorMessage.value = "Please fill in all fields.";
    return;
  }

  loading.value = true;

  try {
    const res = await api.post("/register", {
      fullname: form.value.fullname,
      email: form.value.email,
      password: form.value.password,
      accountType: form.value.accountType,
    });

    if (res.data.status === "200") {
      successMessage.value = "Signup successful.";
      router.push({
        name: "Login",
        query: { signupSuccess: "1" },
      });
    } else if (res.data.status === "422") {
      errors.value = res.data.msg; // Laravel validation errors
    } else {
      errorMessage.value = "Something went wrong.";
    }
  } catch (err) {
    console.error(err);
    errorMessage.value = "Something went wrong. Try again.";
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
</style>
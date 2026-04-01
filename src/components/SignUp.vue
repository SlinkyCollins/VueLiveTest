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

        <!-- Account Type (Headless UI Listbox) -->
        <div>
          <label class="block text-gray-700 font-medium mb-1">Account Type</label>
          <Listbox v-model="form.accountType">
            <div class="relative">
              <ListboxButton class="w-full px-4 py-2 border rounded-lg text-left focus:ring-2 focus:ring-blue-500">
                <span>{{ form.accountType || 'Select account type' }}</span>
                <span class="absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon class="h-5 w-5 text-gray-400" />
                </span>
              </ListboxButton>

              <ListboxOptions class="absolute mt-1 w-full bg-white shadow-lg rounded-md z-10">
                <ListboxOption
                  v-for="type in accountTypes"
                  :key="type"
                  :value="type"
                  class="cursor-pointer px-4 py-2 hover:bg-blue-100"
                >
                  {{ type }}
                </ListboxOption>
              </ListboxOptions>
            </div>
          </Listbox>
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
import { ChevronUpDownIcon } from "@heroicons/vue/24/solid";
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from "@headlessui/vue";

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
/* optional small tweak to prevent text overflow in ListboxButton */
</style>
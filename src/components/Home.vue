<template>
  <div class="min-h-screen flex justify-center items-center bg-gray-50 p-6">
    <div class="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
      <h1 class="text-2xl font-bold text-center mb-3 text-blue-600">Vaultly</h1>
      <p class="text-gray-600 text-center text-sm mb-6">
        A simple way to manage your money.
        Deposit, transfer, and track your transactions in one place.
      </p>

      <div class="space-y-3">
        <button
          type="button"
          class="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          @click="router.push({ name: 'Login' })"
        >
          Login
        </button>

        <button
          type="button"
          class="w-full py-2 px-4 bg-white border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition"
          @click="router.push({ name: 'signup' })"
        >
          Create Account
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<style></style>

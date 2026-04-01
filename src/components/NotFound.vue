<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-6">
    <div class="w-full max-w-lg bg-white rounded-xl shadow p-8 text-center space-y-4">
      <p class="text-sm font-semibold tracking-wide text-gray-500">404</p>
      <h1 class="text-2xl font-bold text-gray-900">Page not found</h1>
      <p class="text-gray-600">
        The page you are trying to access does not exist or may have been moved.
      </p>
      <div class="flex justify-center gap-3 pt-2">
        <button
          @click="router.push({ name: 'home' })"
          class="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 font-medium hover:bg-gray-300 transition"
        >Go Home</button>
        <button
          @click="router.push({ name: 'Login' })"
          class="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
        >Go to Login</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<template>
  <div>
    Hello Home

    <div class="mt-5 card flex justify-center">
      <Slider v-model="value" class="w-56" />
    </div>

    <div class="card flex justify-center">
      <Button label="Submit" />
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue';
import Slider from 'primevue/slider';
import Button from 'primevue/button';

const value = ref(null);
</script>

<style></style>
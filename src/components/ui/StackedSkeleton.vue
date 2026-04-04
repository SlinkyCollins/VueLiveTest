<template>
  <div :class="wrapperClass">
    <div :class="containerClass">
      <div v-if="gridHeights.length" class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Skeleton
          v-for="(height, index) in gridHeights"
          :key="`grid-${index}`"
          :height="height"
          :borderRadius="borderRadius"
        />
      </div>

      <Skeleton
        v-for="(height, index) in rows"
        :key="`row-${index}`"
        :height="height"
        :borderRadius="borderRadius"
      />
    </div>
  </div>
</template>

<script setup>
import Skeleton from 'primevue/skeleton';

defineProps({
  wrapperClass: {
    type: String,
    default: '',
  },
  containerClass: {
    type: String,
    default: 'w-full max-w-4xl space-y-4 pt-2',
  },
  gridHeights: {
    type: Array,
    default: () => [],
  },
  rows: {
    type: Array,
    default: () => [],
  },
  borderRadius: {
    type: String,
    default: '1rem',
  },
});
</script>

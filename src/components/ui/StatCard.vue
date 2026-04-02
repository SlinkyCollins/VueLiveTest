<template>
  <section class="stat-card">
    <div class="flex items-start justify-between gap-4">
      <div class="space-y-1.5">
        <p class="stat-label">{{ label }}</p>
        <p class="stat-value">{{ value }}</p>
        <p v-if="meta" class="stat-meta">{{ meta }}</p>
        <slot name="meta" />
      </div>

      <div v-if="$slots.icon" class="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
        <slot name="icon" />
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  },
  meta: {
    type: String,
    default: ''
  }
})
</script>

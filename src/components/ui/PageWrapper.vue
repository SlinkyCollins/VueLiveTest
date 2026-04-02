<template>
  <div :class="wrapperClass">
    <div :class="containerClass">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  centered: {
    type: Boolean,
    default: false
  },
  narrow: {
    type: Boolean,
    default: false
  },
  auth: {
    type: Boolean,
    default: false
  }
})

const wrapperClass = computed(() =>
  props.centered || props.auth ? 'page-shell page-shell-centered' : 'page-shell'
)

const containerClass = computed(() => {
  if (props.auth) {
    return 'page-container page-container-auth'
  }

  if (props.narrow) {
    return 'page-container page-container-narrow'
  }

  return 'page-container'
})
</script>

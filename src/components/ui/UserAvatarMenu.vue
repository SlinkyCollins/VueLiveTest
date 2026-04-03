<template>
  <div class="relative">
    <button
      type="button"
      class="group flex items-center gap-2 rounded-full border border-surface-300 bg-white px-2 py-1.5 transition hover:border-brand-400 hover:shadow-sm focus:outline-none focus:ring-4 focus:ring-brand-100"
      :aria-expanded="menuOpen"
      aria-haspopup="menu"
      aria-label="Open user menu"
      @click="toggleMenu"
    >
      <img
        :src="avatarUrl"
        alt="User avatar"
        class="h-9 w-9 rounded-full border border-surface-200 object-cover transition group-hover:border-brand-300"
        @error="handleImageError"
      />
      <span class="hidden max-w-24 truncate text-sm font-medium text-surface-700 sm:inline">
        {{ displayName }}
      </span>
      <span class="pi pi-angle-down text-xs text-surface-500" />
    </button>

    <Menu
      ref="menuRef"
      :model="menuItems"
      popup
      appendTo="body"
      class="w-48"
      @show="menuOpen = true"
      @hide="menuOpen = false"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import Menu from 'primevue/menu';

const props = defineProps({
  user: {
    type: Object,
    default: null,
  },
  loggingOut: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['profile', 'settings', 'logout']);

const menuRef = ref(null);
const menuOpen = ref(false);
const imageFailed = ref(false);

const fallbackAvatar = computed(() => {
  const name = props.user?.name || 'User';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=E5E7EB&color=374151`;
});

const avatarUrl = computed(() => {
  if (imageFailed.value) {
    return fallbackAvatar.value;
  }

  const raw = props.user?.profile_picture;
  if (!raw || typeof raw !== 'string') {
    return fallbackAvatar.value;
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  // Keep compatibility with relative API image paths.
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
  try {
    const origin = new URL(baseUrl).origin;
    return new URL(raw, origin).toString();
  } catch {
    return fallbackAvatar.value;
  }
});

const displayName = computed(() => props.user?.name || 'Account');

const toggleMenu = (event) => {
  menuRef.value?.toggle(event);
};

const emitAction = (action) => {
  emit(action);
};

const handleImageError = () => {
  imageFailed.value = true;
};

const menuItems = computed(() => [
  {
    label: 'Profile',
    icon: 'pi pi-user',
    command: () => emitAction('profile'),
  },
  {
    label: 'Settings',
    icon: 'pi pi-cog',
    command: () => emitAction('settings'),
  },
  {
    label: props.loggingOut ? 'Logging out...' : 'Logout',
    icon: 'pi pi-sign-out',
    disabled: props.loggingOut,
    command: () => emitAction('logout'),
  },
]);
</script>

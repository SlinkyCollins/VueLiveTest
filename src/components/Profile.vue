<template>
  <PageWrapper>
    <div class="page-stack">
      <SectionHeader
        title="Profile"
        subtitle="Manage your account details, profile picture, and next of kin information."
        eyebrow="Account"
      >
        <template #actions>
          <button
            class="btn-secondary"
            @click="router.push({ name: 'Dashboard', params: { userId: String(route.params.userId) } })"
          >
            <span class="pi pi-arrow-left text-sm" />
            Back to dashboard
          </button>
        </template>
      </SectionHeader>

      <div v-if="loading" class="empty-state min-h-64">
        <div class="w-full max-w-4xl space-y-4 pt-2">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Skeleton height="8.5rem" borderRadius="1rem" />
            <Skeleton height="8.5rem" borderRadius="1rem" />
            <Skeleton height="8.5rem" borderRadius="1rem" />
          </div>
          <Skeleton height="10.5rem" borderRadius="1rem" />
        </div>
      </div>

      <div v-else class="page-stack">
        <section class="content-card section-stack">
          <div class="space-y-1">
            <h2 class="section-title">Profile picture</h2>
            <p class="section-subtitle">
              Upload or remove your account avatar.
            </p>
          </div>

          <div class="flex flex-col gap-5 sm:flex-row sm:items-center">
            <img
              :src="imagePreview || fallbackAvatar"
              alt="Profile preview"
              @error="handleImageLoadError"
              class="h-24 w-24 rounded-full border border-surface-200 object-cover"
            />

            <div class="flex flex-wrap gap-3">
              <label class="btn-primary cursor-pointer">
                <span>{{ uploadingImage ? 'Uploading...' : 'Upload image' }}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  class="hidden"
                  @change="handleImageSelected"
                  :disabled="uploadingImage"
                />
              </label>
              <button
                @click="removeProfileImage"
                :disabled="removingImage || !user?.profile_picture"
                class="btn-danger"
              >
                {{ removingImage ? 'Removing...' : 'Remove image' }}
              </button>
            </div>
          </div>

        </section>

        <form @submit.prevent="saveProfile" class="page-stack">
          <section class="content-card section-stack">
            <div class="space-y-1">
              <h2 class="section-title">Profile info</h2>
              <p class="section-subtitle">
                Update the personal details shown on your account.
              </p>
            </div>

            <div class="form-grid">
              <div>
                <label for="name" class="field-label">Full name</label>
                <InputText
                  id="name"
                  v-model.trim="form.name"
                  type="text"
                  placeholder="First Last"
                  :class="{ 'p-invalid': formErrors.name }"
                />
                <p v-if="formErrors.name" class="field-error">{{ formErrors.name }}</p>
              </div>

              <div>
                <label class="field-label">Email address</label>
                <div class="surface-muted">
                  <p class="text-sm font-medium text-surface-900">{{ user?.email || 'N/A' }}</p>
                </div>
              </div>
            </div>
          </section>

          <section class="content-card section-stack">
            <div class="space-y-1">
              <h2 class="section-title">Next of kin</h2>
              <p class="section-subtitle">
                Keep your emergency contact information current.
              </p>
            </div>

            <div class="form-grid">
              <div>
                <label for="next_of_kin_name" class="field-label">Next of kin name</label>
                <InputText
                  id="next_of_kin_name"
                  v-model.trim="form.next_of_kin_name"
                  type="text"
                  placeholder="Optional"
                  :class="{ 'p-invalid': formErrors.next_of_kin_name }"
                />
                <p v-if="formErrors.next_of_kin_name" class="field-error">{{ formErrors.next_of_kin_name }}</p>
              </div>

              <div>
                <label for="next_of_kin_phone" class="field-label">Next of kin phone</label>
                <InputText
                  id="next_of_kin_phone"
                  v-model.trim="form.next_of_kin_phone"
                  type="text"
                  placeholder="Optional"
                  :class="{ 'p-invalid': formErrors.next_of_kin_phone }"
                />
                <p v-if="formErrors.next_of_kin_phone" class="field-error">{{ formErrors.next_of_kin_phone }}</p>
              </div>
            </div>
          </section>

          <section class="content-card section-stack">
            <div class="space-y-1">
              <h2 class="section-title">Account details</h2>
              <p class="section-subtitle">
                Review the account information tied to your profile.
              </p>
            </div>

            <div class="key-value-grid">
              <div>
                <p class="key-value-label">Account number</p>
                <p class="key-value-value">{{ user?.account_number || 'N/A' }}</p>
              </div>
              <div>
                <p class="key-value-label">Member since</p>
                <p class="key-value-value">{{ formattedCreatedAt }}</p>
              </div>
            </div>

            <div v-if="allowAccountTypeEdit">
              <label for="account_type" class="field-label">Account type</label>
              <Select
                id="account_type"
                v-model="form.account_type"
                :options="accountTypeOptions"
                optionLabel="label"
                optionValue="value"
                :class="{ 'p-invalid': formErrors.account_type }"
              />
              <p v-if="formErrors.account_type" class="field-error">{{ formErrors.account_type }}</p>
            </div>

            <div v-else class="surface-muted">
              <p class="key-value-label">Current account type</p>
              <p class="key-value-value capitalize">{{ user?.account_type || 'N/A' }}</p>
              <p class="field-help">Account type changes are not enabled after signup.</p>
            </div>
          </section>

          <div class="flex">
            <Button
              type="submit"
              :disabled="saving"
              class="btn-primary"
              :label="saving ? 'Saving...' : 'Save changes'"
            />
          </div>
        </form>
      </div>
    </div>
  </PageWrapper>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Skeleton from 'primevue/skeleton';
import { useToast } from 'primevue/usetoast';
import api from '@/utils/api';
import { useAuthStore } from '@/stores/auth';
import PageWrapper from '@/components/ui/PageWrapper.vue';
import SectionHeader from '@/components/ui/SectionHeader.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const toast = useToast();

const loading = ref(true);
const saving = ref(false);
const uploadingImage = ref(false);
const removingImage = ref(false);
const imagePreview = ref('');
const formErrors = ref({});
const accountTypeOptions = [
  { label: 'Savings', value: 'savings' },
  { label: 'Current', value: 'current' },
  { label: 'Fixed', value: 'fixed' },
];

// Flip this only when product/business allows account type changes post-signup.
const allowAccountTypeEdit = false;
const user = computed(() => authStore.user);

const fallbackAvatar = computed(() => {
  return `https://ui-avatars.com/api/?name=${user.value?.name || "User"}&background=random`;
});

const formattedCreatedAt = computed(() => {
  if (!user.value?.created_at) return 'N/A';
  return new Date(user.value.created_at).toLocaleDateString();
});

const form = ref({
  name: '',
  next_of_kin_name: '',
  next_of_kin_phone: '',
  account_type: 'savings',
});

const normalizeProfileImageUrl = (value) => {
  if (!value || typeof value !== 'string') {
    return '';
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const apiOrigin = new URL(api.defaults.baseURL).origin;
  return new URL(value, apiOrigin).toString();
};

const withCacheBust = (value) => {
  if (!value) {
    return '';
  }

  const parsedUrl = new URL(value);
  parsedUrl.searchParams.set('t', String(Date.now()));
  return parsedUrl.toString();
};

const handleImageLoadError = () => {
  toast.add({
    severity: 'warn',
    summary: 'Image preview unavailable',
    detail: 'Failed to load profile image. Showing fallback avatar.',
    life: 2800,
  });
  imagePreview.value = '';
};

const hydrateForm = (userData) => {
  form.value = {
    name: userData?.name || '',
    next_of_kin_name: userData?.next_of_kin_name || '',
    next_of_kin_phone: userData?.next_of_kin_phone || '',
    account_type: userData?.account_type || 'savings',
  };

  imagePreview.value = normalizeProfileImageUrl(userData?.profile_picture);
};

const normalizeProfileValidation = (msg) => {
  const normalized = {};

  if (!msg || typeof msg !== 'object') {
    return normalized;
  }

  Object.entries(msg).forEach(([field, messages]) => {
    normalized[field] = Array.isArray(messages) ? messages[0] : String(messages);
  });

  return normalized;
};

const fetchProfile = async () => {
  loading.value = true;
  formErrors.value = {};

  try {
    const res = await api.get('/profile');
    authStore.setUser(res.data.user);
    hydrateForm(res.data.user);
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Failed to load profile',
      detail: 'Please try again.',
      life: 3200,
    });
  } finally {
    loading.value = false;
  }
};

const saveProfile = async () => {
  saving.value = true;
  formErrors.value = {};

  const payload = {
    name: form.value.name,
    next_of_kin_name: form.value.next_of_kin_name || null,
    next_of_kin_phone: form.value.next_of_kin_phone || null,
  };

  if (allowAccountTypeEdit) {
    payload.account_type = form.value.account_type;
  }

  try {
    const res = await api.put('/profile', payload);
    authStore.setUser(res.data.user);
    hydrateForm(res.data.user);
    toast.add({
      severity: 'success',
      summary: 'Profile updated',
      detail: res.data.msg || 'Profile updated successfully!',
      life: 2600,
    });
  } catch (err) {
    if (err.response?.status === 422) {
      formErrors.value = normalizeProfileValidation(err.response?.data?.msg);
      toast.add({
        severity: 'warn',
        summary: 'Validation required',
        detail: 'Please fix the highlighted fields.',
        life: 3000,
      });
    } else {
      toast.add({
        severity: 'error',
        summary: 'Profile update failed',
        detail: err.response?.data?.msg || 'Profile update failed.',
        life: 3200,
      });
    }
  } finally {
    saving.value = false;
  }
};

const handleImageSelected = async (event) => {
  const file = event.target.files?.[0];

  if (!file) {
    toast.add({
      severity: 'info',
      summary: 'No file selected',
      detail: 'Select an image to upload.',
      life: 2200,
    });
    return;
  }

  const formData = new FormData();
  formData.append('profile_picture', file);

  uploadingImage.value = true;

  try {
    const res = await api.post('/profile/picture', formData);

    authStore.setUser(res.data.user);
    imagePreview.value = withCacheBust(normalizeProfileImageUrl(res.data.user?.profile_picture));
    toast.add({
      severity: 'success',
      summary: 'Profile image updated',
      detail: 'Your profile picture has been uploaded.',
      life: 2500,
    });
  } catch (err) {
    if (err.response?.status === 422) {
      const normalizedErrors = normalizeProfileValidation(err.response?.data?.msg);
      toast.add({
        severity: 'warn',
        summary: 'Invalid image',
        detail: normalizedErrors.profile_picture || 'Invalid image selected.',
        life: 3200,
      });
    } else {
      toast.add({
        severity: 'error',
        summary: 'Upload failed',
        detail: err.response?.data?.msg || 'Failed to upload image.',
        life: 3200,
      });
    }
  } finally {
    uploadingImage.value = false;
    event.target.value = '';
  }
};

const removeProfileImage = async () => {
  removingImage.value = true;

  try {
    const res = await api.delete('/profile/picture');
    authStore.setUser(res.data.user);
    imagePreview.value = '';
    toast.add({
      severity: 'success',
      summary: 'Profile image removed',
      detail: 'Your profile picture has been removed.',
      life: 2500,
    });
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Remove failed',
      detail: err.response?.data?.msg || 'Failed to remove image.',
      life: 3200,
    });
  } finally {
    removingImage.value = false;
  }
};

onMounted(async () => {
  if (!authStore.token) {
    toast.add({
      severity: 'info',
      summary: 'Session expired',
      detail: 'Token expired. Please log in again.',
      life: 2500,
    });
    router.push({ name: 'Login' });
    return;
  }

  await fetchProfile();
});
</script>

<style></style>

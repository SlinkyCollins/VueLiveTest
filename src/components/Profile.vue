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
        <span class="pi pi-spin pi-spinner text-2xl text-brand-600" />
        <p>Loading profile...</p>
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

          <div v-if="imageError" class="alert-error">{{ imageError }}</div>
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

          <div v-if="formMessage" :class="formMessageType === 'success' ? 'alert-success' : 'alert-error'">
            {{ formMessage }}
          </div>

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
import api from '@/utils/api';
import { useAuthStore } from '@/stores/auth';
import PageWrapper from '@/components/ui/PageWrapper.vue';
import SectionHeader from '@/components/ui/SectionHeader.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const loading = ref(true);
const saving = ref(false);
const uploadingImage = ref(false);
const removingImage = ref(false);
const imagePreview = ref('');
const imageError = ref('');
const formMessage = ref('');
const formMessageType = ref('success');
const formErrors = ref({});
const accountTypeOptions = [
  { label: 'Savings', value: 'savings' },
  { label: 'Current', value: 'current' },
  { label: 'Fixed', value: 'fixed' },
];

// Flip this only when product/business allows account type changes post-signup.
const allowAccountTypeEdit = false;

const fallbackAvatar = 'https://ui-avatars.com/api/?name=Vaultly+User&background=E5E7EB&color=374151';

const user = computed(() => authStore.user);
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
  imageError.value = 'Failed to load profile image. Showing fallback avatar.';
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
  formMessage.value = '';
  formErrors.value = {};

  try {
    const res = await api.get('/profile');
    authStore.setUser(res.data.user);
    hydrateForm(res.data.user);
  } catch (err) {
    formMessageType.value = 'error';
    formMessage.value = 'Failed to load profile.';
  } finally {
    loading.value = false;
  }
};

const saveProfile = async () => {
  saving.value = true;
  formMessage.value = '';
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
    formMessageType.value = 'success';
    formMessage.value = res.data.msg || 'Profile updated successfully!';
  } catch (err) {
    if (err.response?.status === 422) {
      formErrors.value = normalizeProfileValidation(err.response?.data?.msg);
      formMessageType.value = 'error';
      formMessage.value = 'Please fix the highlighted fields.';
    } else {
      formMessageType.value = 'error';
      formMessage.value = err.response?.data?.msg || 'Profile update failed.';
    }
  } finally {
    saving.value = false;
  }
};

const handleImageSelected = async (event) => {
  const file = event.target.files?.[0];
  imageError.value = '';

  if (!file) {
    return;
  }

  const formData = new FormData();
  formData.append('profile_picture', file);

  uploadingImage.value = true;

  try {
    const res = await api.post('/profile/picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    authStore.setUser(res.data.user);
    imagePreview.value = withCacheBust(normalizeProfileImageUrl(res.data.user?.profile_picture));
  } catch (err) {
    if (err.response?.status === 422) {
      const normalizedErrors = normalizeProfileValidation(err.response?.data?.msg);
      imageError.value = normalizedErrors.profile_picture || 'Invalid image selected.';
    } else {
      imageError.value = err.response?.data?.msg || 'Failed to upload image.';
    }
  } finally {
    uploadingImage.value = false;
    event.target.value = '';
  }
};

const removeProfileImage = async () => {
  imageError.value = '';
  removingImage.value = true;

  try {
    const res = await api.delete('/profile/picture');
    authStore.setUser(res.data.user);
    imagePreview.value = '';
  } catch (err) {
    imageError.value = err.response?.data?.msg || 'Failed to remove image.';
  } finally {
    removingImage.value = false;
  }
};

onMounted(async () => {
  if (!authStore.token) {
    router.push({ name: 'Login' });
    return;
  }

  await fetchProfile();
});
</script>

<style></style>

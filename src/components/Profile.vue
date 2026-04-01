<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-4xl mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-800">Profile</h1>
        <button
          @click="router.push({ name: 'Dashboard', params: { userId: String(route.params.userId) } })"
          class="px-4 py-2 bg-gray-700 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition"
        >Back to Dashboard</button>
      </div>

      <div v-if="loading" class="bg-white rounded-xl shadow p-6 text-gray-500">Loading profile...</div>

      <div v-else class="space-y-6">
        <div class="bg-white rounded-xl shadow p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">Profile Image</h2>
          <div class="flex flex-col sm:flex-row gap-4 sm:items-center">
            <img
              :src="imagePreview || fallbackAvatar"
              alt="Profile preview"
              @error="handleImageLoadError"
              class="w-24 h-24 rounded-full object-cover border border-gray-200"
            />

            <div class="flex flex-wrap gap-3">
              <label class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition cursor-pointer">
                <span>{{ uploadingImage ? 'Uploading...' : 'Upload Image' }}</span>
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
                class="px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >{{ removingImage ? 'Removing...' : 'Remove Image' }}</button>
            </div>
          </div>
          <p v-if="imageError" class="text-sm text-red-600 mt-3">{{ imageError }}</p>
        </div>

        <div class="bg-white rounded-xl shadow p-6">
          <h2 class="text-lg font-semibold text-gray-800 mb-4">View Profile</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-gray-500">Email</p>
              <p class="text-gray-800">{{ user?.email }}</p>
            </div>
            <div>
              <p class="text-gray-500">Account Number</p>
              <p class="text-gray-800">{{ user?.account_number }}</p>
            </div>
            <div>
              <p class="text-gray-500">Member Since</p>
              <p class="text-gray-800">{{ formattedCreatedAt }}</p>
            </div>
            <div>
              <p class="text-gray-500">Current Account Type</p>
              <p class="text-gray-800 capitalize">{{ user?.account_type || 'N/A' }}</p>
            </div>
          </div>
        </div>

        <form @submit.prevent="saveProfile" class="bg-white rounded-xl shadow p-6 space-y-4">
          <h2 class="text-lg font-semibold text-gray-800">Edit Profile</h2>

          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              id="name"
              v-model.trim="form.name"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="First Last"
            />
            <p v-if="formErrors.name" class="text-sm text-red-600 mt-1">{{ formErrors.name }}</p>
          </div>

          <div>
            <label for="next_of_kin_name" class="block text-sm font-medium text-gray-700 mb-1">Next of Kin Name</label>
            <input
              id="next_of_kin_name"
              v-model.trim="form.next_of_kin_name"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional"
            />
            <p v-if="formErrors.next_of_kin_name" class="text-sm text-red-600 mt-1">{{ formErrors.next_of_kin_name }}</p>
          </div>

          <div>
            <label for="next_of_kin_phone" class="block text-sm font-medium text-gray-700 mb-1">Next of Kin Phone</label>
            <input
              id="next_of_kin_phone"
              v-model.trim="form.next_of_kin_phone"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional"
            />
            <p v-if="formErrors.next_of_kin_phone" class="text-sm text-red-600 mt-1">{{ formErrors.next_of_kin_phone }}</p>
          </div>

          <div v-if="allowAccountTypeEdit">
            <label for="account_type" class="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
            <select
              id="account_type"
              v-model="form.account_type"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="savings">Savings</option>
              <option value="current">Current</option>
              <option value="fixed">Fixed</option>
            </select>
            <p v-if="formErrors.account_type" class="text-sm text-red-600 mt-1">{{ formErrors.account_type }}</p>
          </div>

          <p v-else class="text-sm text-gray-500">Account type changes are not enabled after signup.</p>

          <p v-if="formMessage" class="text-sm" :class="formMessageType === 'success' ? 'text-green-600' : 'text-red-600'">
            {{ formMessage }}
          </p>

          <div>
            <button
              type="submit"
              :disabled="saving"
              class="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >{{ saving ? 'Saving...' : 'Save Changes' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/utils/api';
import { useAuthStore } from '@/stores/auth';

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

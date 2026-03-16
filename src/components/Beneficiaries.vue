<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-5xl mx-auto space-y-6">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-800">Beneficiaries</h1>
        <button
          @click="router.push({ name: 'Dashboard' })"
          class="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition"
        >
          Back to Dashboard
        </button>
      </div>

      <form @submit.prevent="handleAdd" class="bg-white rounded-xl shadow p-6 space-y-4">
        <h2 class="text-lg font-semibold text-gray-800">Add Beneficiary</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-gray-700 font-medium">Account Number</label>
            <input
              v-model="form.account_number"
              @input="onAccountNumberInput"
              type="text"
              maxlength="12"
              inputmode="numeric"
              pattern="[0-9]{12}"
              class="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              :class="{ 'border-red-500': errors.account_number }"
              placeholder="12-digit account number"
            />
            <p v-if="errors.account_number" class="text-red-500 text-sm mt-1">{{ errors.account_number }}</p>
          </div>

          <div>
            <label class="block text-gray-700 font-medium">Bank Name</label>
            <input
              v-model="form.bank_name"
              type="text"
              disabled
              class="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              :class="{ 'border-red-500': errors.bank_name }"
              placeholder="Vaultly Bank"
            />
            <p v-if="errors.bank_name" class="text-red-500 text-sm mt-1">{{ errors.bank_name }}</p>
          </div>
        </div>

        <div class="flex gap-3">
          <button
            type="submit"
            :disabled="submitting"
            class="px-5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >{{ submitting ? 'Saving...' : 'Save Beneficiary' }}</button>

          <button
            v-if="editingId"
            type="button"
            @click="cancelEdit"
            class="px-5 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
          >Cancel Edit</button>
        </div>

        <p v-if="successMessage" class="text-green-600 text-sm">{{ successMessage }}</p>
        <p v-if="errorMessage" class="text-red-600 text-sm">{{ errorMessage }}</p>
      </form>

      <div class="bg-white rounded-xl shadow p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-gray-800">Saved Beneficiaries</h2>
          <button @click="fetchBeneficiaries" class="text-sm text-blue-600 hover:underline">Refresh</button>
        </div>

        <div v-if="loading" class="py-8 text-center text-gray-500">Loading beneficiaries...</div>
        <div v-else-if="beneficiaries.length === 0" class="py-8 text-center text-gray-500">No beneficiaries saved yet.</div>

        <div v-else class="space-y-3">
          <div
            v-for="beneficiary in beneficiaries"
            :key="beneficiary.id"
            class="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
          >
            <div>
              <p class="font-semibold text-gray-800">{{ beneficiary.account_name }}</p>
              <p class="text-sm text-gray-500">{{ beneficiary.account_number }} | {{ beneficiary.bank_name }} ({{ beneficiary.bank_code || 'N/A' }})</p>
            </div>
            <div class="flex gap-2">
              <button
                @click="useForTransfer(beneficiary)"
                class="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
              >Transfer</button>
              <button
                @click="startEdit(beneficiary)"
                class="px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition"
              >Edit</button>
              <button
                @click="handleDelete(beneficiary.id)"
                class="px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition"
              >Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/utils/api';
import { useAuthStore } from '@/stores/auth';
import { useInputNormalization } from '@/composables/useInputNormalization';

const router = useRouter();
const authStore = useAuthStore();
const { normalizeFieldDigits } = useInputNormalization();

const loading = ref(true);
const submitting = ref(false);
const editingId = ref(null);
const beneficiaries = ref([]);
const errors = ref({});
const errorMessage = ref('');
const successMessage = ref('');

const form = ref({
  account_number: '',
  bank_name: 'Vaultly Bank',
});

const clearMessages = () => {
  errorMessage.value = '';
  successMessage.value = '';
};

const clearErrors = () => {
  errors.value = {};
  clearMessages();
};

const onAccountNumberInput = () => {
  normalizeFieldDigits(form, 'account_number', 12);
  clearErrors();
};

const resetForm = () => {
  form.value = {
    account_number: '',
    bank_name: 'Vaultly Bank',
  };
};

const validate = () => {
  const newErrors = {};

  if (!/^\d{12}$/.test(form.value.account_number)) {
    newErrors.account_number = 'Account number must be 12 digits.';
  }

  if (!form.value.bank_name.trim()) {
    newErrors.bank_name = 'Bank name is required.';
  }

  errors.value = newErrors;
  return Object.keys(newErrors).length === 0;
};

const fetchBeneficiaries = async () => {
  loading.value = true;

  try {
    const res = await api.get('/beneficiaries');
    beneficiaries.value = res.data.beneficiaries || [];
  } catch (err) {
    errorMessage.value = err.code === 'ERR_NETWORK'
      ? 'Unable to connect to the server.'
      : 'Failed to fetch beneficiaries.';
  } finally {
    loading.value = false;
  }
};

const handleAdd = async () => {
  clearMessages();
  if (!validate()) return;

  submitting.value = true;

  try {
    const endpoint = editingId.value ? `/beneficiaries/${editingId.value}` : '/beneficiaries';
    const method = editingId.value ? 'put' : 'post';
    const res = await api[method](endpoint, form.value);

    if (res.data.status === '200') {
      successMessage.value = res.data.msg;
      editingId.value = null;
      resetForm();
      fetchBeneficiaries();
    } else if (res.data.status === '422') {
      const serverErrors = res.data.msg;
      errors.value = {
        account_number: serverErrors.account_number?.[0],
        bank_name: serverErrors.bank_name?.[0],
      };
    } else {
      errorMessage.value = res.data.msg || 'Unable to save beneficiary.';
    }
  } catch (err) {
    errorMessage.value = err.code === 'ERR_NETWORK'
      ? 'Unable to connect to the server.'
      : err.response?.data?.msg || 'Unable to save beneficiary.';
  } finally {
    submitting.value = false;
  }
};

const startEdit = (beneficiary) => {
  clearErrors();
  editingId.value = beneficiary.id;
  form.value = {
    account_number: beneficiary.account_number,
    bank_name: beneficiary.bank_name,
  };
};

const cancelEdit = () => {
  editingId.value = null;
  clearErrors();
  resetForm();
};

const handleDelete = async (id) => {
  clearMessages();

  if (!confirm('Delete this beneficiary?')) {
    return;
  }

  try {
    const res = await api.delete(`/beneficiaries/${id}`);
    if (res.data.status === '200') {
      successMessage.value = res.data.msg;
      beneficiaries.value = beneficiaries.value.filter((item) => item.id !== id);
    } else {
      errorMessage.value = res.data.msg || 'Unable to delete beneficiary.';
    }
  } catch (err) {
    errorMessage.value = err.code === 'ERR_NETWORK'
      ? 'Unable to connect to the server.'
      : err.response?.data?.msg || 'Unable to delete beneficiary.';
  }
};

const useForTransfer = (beneficiary) => {
  router.push({
    name: 'Transfer',
    query: {
      beneficiaryId: String(beneficiary.id),
      accountNumber: beneficiary.account_number,
      bankName: beneficiary.bank_name,
    },
  });
};

onMounted(async () => {
  if (!authStore.user) {
    try {
      await authStore.fetchDashboard();
    } catch (err) {
      if (err?.response?.status === 401) {
        router.push({ name: 'Login' });
        return;
      }
      errorMessage.value = 'Unable to load your account details. Please try again.';
      return;
    }
  }

  fetchBeneficiaries();
});
</script>

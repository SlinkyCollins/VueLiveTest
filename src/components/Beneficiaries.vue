<template>
  <PageWrapper>
    <div class="page-stack">
      <SectionHeader
        title="Beneficiaries"
        subtitle="Save trusted recipients so transfers stay quick and consistent."
        eyebrow="Recipients"
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

      <FormCard
        :title="editingId ? 'Edit beneficiary' : 'Add beneficiary'"
        subtitle="Store a Vaultly recipient once, then reuse the details during transfers."
      >
        <form @submit.prevent="handleAdd" class="form-stack">
          <div class="form-grid">
            <div>
              <label class="field-label">Account number</label>
              <InputText
                v-model="form.account_number"
                @input="onAccountNumberInput"
                type="text"
                maxlength="12"
                inputmode="numeric"
                placeholder="12-digit account number"
                :class="{ 'p-invalid': errors.account_number }"
              />
              <p v-if="errors.account_number" class="field-error">{{ errors.account_number }}</p>
            </div>

            <div>
              <label class="field-label">Bank name</label>
              <InputText
                v-model="form.bank_name"
                type="text"
                disabled
                placeholder="Vaultly Bank"
                :class="{ 'p-invalid': errors.bank_name }"
              />
              <p v-if="errors.bank_name" class="field-error">{{ errors.bank_name }}</p>
            </div>
          </div>

          <div v-if="successMessage" class="alert-success">{{ successMessage }}</div>
          <div v-if="errorMessage" class="alert-error">{{ errorMessage }}</div>

          <div class="flex flex-col gap-3 sm:flex-row">
            <Button
              type="submit"
              :disabled="submitting"
              class="btn-primary"
              :label="submitting ? 'Saving...' : (editingId ? 'Update beneficiary' : 'Save beneficiary')"
            />

            <button
              v-if="editingId"
              type="button"
              @click="cancelEdit"
              class="btn-secondary"
            >
              Cancel edit
            </button>
          </div>
        </form>
      </FormCard>

      <section class="content-card section-stack">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div class="space-y-1">
            <h2 class="section-title">Saved beneficiaries</h2>
            <p class="section-subtitle">
              Reuse stored recipients for faster transfers and fewer manual steps.
            </p>
          </div>
          <button class="btn-secondary" @click="fetchBeneficiaries">
            <span class="pi pi-refresh text-sm" />
            Refresh
          </button>
        </div>

        <div v-if="loading" class="empty-state min-h-56">
          <span class="pi pi-spin pi-spinner text-2xl text-brand-600" />
          <p>Loading beneficiaries...</p>
        </div>

        <div v-else-if="beneficiaries.length === 0" class="empty-state min-h-56">
          <span class="pi pi-users text-2xl text-surface-400" />
          <p>No beneficiaries saved yet.</p>
        </div>

        <div v-else class="table-list">
          <article
            v-for="beneficiary in beneficiaries"
            :key="beneficiary.id"
            class="table-row"
          >
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div class="space-y-1.5">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="text-sm font-semibold text-surface-900">{{ beneficiary.account_name }}</p>
                  <span class="badge-primary">Vaultly</span>
                </div>
                <p class="text-sm text-surface-500">
                  {{ beneficiary.account_number }} | {{ beneficiary.bank_name }} ({{ beneficiary.bank_code || 'N/A' }})
                </p>
              </div>

              <div class="flex flex-col gap-2 sm:flex-row">
                <button
                  @click="useForTransfer(beneficiary)"
                  class="btn-primary"
                >
                  Transfer
                </button>
                <button
                  @click="startEdit(beneficiary)"
                  class="btn-secondary"
                >
                  Edit
                </button>
                <button
                  @click="handleDelete(beneficiary.id)"
                  class="btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  </PageWrapper>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/utils/api';
import { useAuthStore } from '@/stores/auth';
import { useInputNormalization } from '@/composables/useInputNormalization';
import PageWrapper from '@/components/ui/PageWrapper.vue';
import SectionHeader from '@/components/ui/SectionHeader.vue';
import FormCard from '@/components/ui/FormCard.vue';

const router = useRouter();
const route = useRoute();
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
    params: { userId: String(route.params.userId) },
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

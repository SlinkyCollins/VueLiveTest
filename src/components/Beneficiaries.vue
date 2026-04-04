<template>
  <PageWrapper>
    <div class="page-stack">
      <SectionHeader title="Beneficiaries" subtitle="Save trusted recipients so transfers stay quick and consistent."
        eyebrow="Recipients">
        <template #actions>
          <button class="btn-secondary"
            @click="router.push({ name: 'Dashboard', params: { userId: String(route.params.userId) } })">
            <span class="pi pi-arrow-left text-sm" />
            Back to dashboard
          </button>
        </template>
      </SectionHeader>

      <FormCard :title="editingId ? 'Edit beneficiary' : 'Add beneficiary'"
        subtitle="Store a Vaultly recipient once, then reuse the details during transfers.">
        <form @submit.prevent="handleAdd" class="form-stack">
          <div class="form-grid">
            <div>
              <label class="field-label">Account number</label>
              <InputText v-model="form.account_number" @input="onAccountNumberInput" type="text" maxlength="12"
                inputmode="numeric" placeholder="12-digit account number"
                :class="{ 'p-invalid': errors.account_number }" />
              <p v-if="errors.account_number" class="field-error">{{ errors.account_number }}</p>
            </div>

            <div>
              <label class="field-label">Bank name</label>
              <InputText v-model="form.bank_name" type="text" disabled placeholder="Vaultly Bank"
                :class="{ 'p-invalid': errors.bank_name }" />
              <p v-if="errors.bank_name" class="field-error">{{ errors.bank_name }}</p>
            </div>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" :disabled="submitting" class="btn-primary"
              :label="submitting ? 'Saving...' : (editingId ? 'Update beneficiary' : 'Save beneficiary')" />

            <button v-if="editingId" type="button" @click="cancelEdit" class="btn-secondary">
              Cancel edit
            </button>
          </div>
        </form>
      </FormCard>

      <section class="content-card section-stack overflow-visible">
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

        <StackedSkeleton
          v-if="loading"
          wrapperClass="min-h-56"
          containerClass="w-full space-y-3 pt-1"
          :rows="['2.75rem', '4.75rem', '4.75rem', '4.75rem']"
        />

        <div v-else-if="beneficiaries.length === 0" class="empty-state min-h-56">
          <span class="pi pi-users text-2xl text-surface-400" />
          <p>No beneficiaries saved yet.</p>
        </div>

        <div v-else class="w-full overflow-visible">
          <Menu ref="actionMenu" :model="actionItems" popup appendTo="body" />

          <div class="overflow-visible rounded-2xl border border-surface-200 bg-white">
            <!-- Desktop table header -->
            <div
              class="hidden md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,2.2fr)_auto_auto] md:items-center gap-4 border-b border-surface-200 bg-surface-50 px-5 py-3">
              <span class="text-xs font-semibold uppercase tracking-wide text-surface-500">
                Account name
              </span>
              <span class="text-xs font-semibold uppercase tracking-wide text-surface-500">
                Bank details
              </span>
              <span class="text-xs font-semibold uppercase tracking-wide text-surface-500 text-right">
                Transfer
              </span>
              <span class="text-xs font-semibold uppercase tracking-wide text-surface-500 text-right">
                More
              </span>
            </div>

            <!-- Rows -->
            <article v-for="beneficiary in beneficiaries" :key="beneficiary.id"
              class="border-b border-surface-200 last:border-b-0">
              <!-- Mobile card -->
              <div class="flex flex-col gap-4 px-4 py-4 md:hidden">
                <div class="space-y-2 min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="text-sm font-semibold text-surface-900 wrap-break-word">
                      {{ beneficiary.account_name }}
                    </p>
                  </div>

                  <p class="text-sm text-surface-500 wrap-break-word">
                    {{ beneficiary.account_number }} | {{ beneficiary.bank_name }}
                    ({{ beneficiary.bank_code || 'N/A' }})
                  </p>
                </div>

                <div class="flex items-center justify-between gap-3">
                  <button @click="useForTransfer(beneficiary)" class="btn-primary">
                    Transfer
                  </button>

                  <button type="button" class="btn-secondary px-3!" @click="openActionMenu($event, beneficiary)"
                    aria-label="Open beneficiary actions">
                    <span class="pi pi-ellipsis-v" />
                  </button>
                </div>
              </div>

              <!-- Desktop row -->
              <div
                class="hidden md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,2.2fr)_auto_auto] md:items-center gap-4 px-5 py-4">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="truncate text-sm font-semibold text-surface-900">
                      {{ beneficiary.account_name }}
                    </p>
                  </div>
                </div>

                <div class="min-w-0">
                  <p class="truncate text-sm text-surface-500">
                    {{ beneficiary.account_number }} | {{ beneficiary.bank_name }}
                    ({{ beneficiary.bank_code || 'N/A' }})
                  </p>
                </div>

                <div class="flex justify-end">
                  <button @click="useForTransfer(beneficiary)" class="btn-primary">
                    Transfer
                  </button>
                </div>

                <div class="flex justify-end overflow-visible">
                  <button type="button" class="btn-secondary px-3!" @click="openActionMenu($event, beneficiary)"
                    aria-label="Open beneficiary actions">
                    <span class="pi pi-ellipsis-v" />
                  </button>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <ConfirmDialog />
    </div>
  </PageWrapper>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import api from '@/utils/api';
import { useAuthStore } from '@/stores/auth';
import { useInputNormalization } from '@/composables/useInputNormalization';
import PageWrapper from '@/components/ui/PageWrapper.vue';
import SectionHeader from '@/components/ui/SectionHeader.vue';
import FormCard from '@/components/ui/FormCard.vue';
import Menu from 'primevue/menu';
import StackedSkeleton from '@/components/ui/StackedSkeleton.vue';

const router = useRouter();
const route = useRoute();
const toast = useToast();
const confirm = useConfirm();
const authStore = useAuthStore();
const { normalizeFieldDigits } = useInputNormalization();

const loading = ref(true);
const submitting = ref(false);
const editingId = ref(null);
const beneficiaries = ref([]);
const errors = ref({});
const editSnapshot = ref(null);

const actionMenu = ref();
const selectedBeneficiary = ref(null);

const form = ref({
  account_number: '',
  bank_name: 'Vaultly Bank',
});

const actionItems = ref([
  {
    label: 'Edit',
    icon: 'pi pi-pencil',
    command: () => {
      if (selectedBeneficiary.value) {
        startEdit(selectedBeneficiary.value);
      }
    },
  },
  {
    label: 'Delete',
    icon: 'pi pi-trash',
    command: () => {
      if (selectedBeneficiary.value) {
        handleDelete(selectedBeneficiary.value.id);
      }
    },
  },
]);

const openActionMenu = (event, beneficiary) => {
  selectedBeneficiary.value = beneficiary;
  actionMenu.value?.toggle(event);
};

const clearErrors = () => {
  errors.value = {};
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
    toast.add({
      severity: 'error',
      summary: 'Unable to load beneficiaries',
      detail: err.code === 'ERR_NETWORK' ? 'Unable to connect to the server.' : 'Failed to fetch beneficiaries.',
      life: 3500,
    });
  } finally {
    loading.value = false;
  }
};

const handleAdd = async () => {
  if (editingId.value && editSnapshot.value) {
    const unchangedAccount = String(form.value.account_number).trim() === String(editSnapshot.value.account_number).trim();
    const unchangedBank = String(form.value.bank_name).trim() === String(editSnapshot.value.bank_name).trim();

    if (unchangedAccount && unchangedBank) {
      toast.add({
        severity: 'info',
        summary: 'No changes made',
        detail: 'Beneficiary details are unchanged.',
        life: 2500,
      });
      return;
    }
  }

  if (!validate()) return;

  submitting.value = true;

  try {
    const endpoint = editingId.value ? `/beneficiaries/${editingId.value}` : '/beneficiaries';
    const method = editingId.value ? 'put' : 'post';
    const res = await api[method](endpoint, form.value);

    if (res.data.status === '200') {
      toast.add({
        severity: 'success',
        summary: editingId.value ? 'Beneficiary updated' : 'Beneficiary saved',
        detail: res.data.msg || 'Beneficiary saved successfully.',
        life: 3000,
      });
      editingId.value = null;
      editSnapshot.value = null;
      resetForm();
      fetchBeneficiaries();
    } else if (res.data.status === '422') {
      const serverErrors = res.data.msg;
      errors.value = {
        account_number: serverErrors.account_number?.[0],
        bank_name: serverErrors.bank_name?.[0],
      };
    } else {
      toast.add({
        severity: 'error',
        summary: 'Unable to save beneficiary',
        detail: res.data.msg || 'Unable to save beneficiary.',
        life: 3500,
      });
    }
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Unable to save beneficiary',
      detail: err.code === 'ERR_NETWORK'
        ? 'Unable to connect to the server.'
        : err.response?.data?.msg || 'Unable to save beneficiary.',
      life: 3500,
    });
  } finally {
    submitting.value = false;
  }
};

const startEdit = (beneficiary) => {
  clearErrors();
  editingId.value = beneficiary.id;
  editSnapshot.value = {
    account_number: beneficiary.account_number,
    bank_name: beneficiary.bank_name,
  };
  form.value = {
    account_number: beneficiary.account_number,
    bank_name: beneficiary.bank_name,
  };
};

const cancelEdit = () => {
  editingId.value = null;
  editSnapshot.value = null;
  clearErrors();
  resetForm();
};

const handleDelete = async (id) => {
  confirm.require({
    header: 'Delete beneficiary',
    message: 'Are you sure you want to delete this beneficiary?',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Delete',
    rejectLabel: 'Cancel',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        const res = await api.delete(`/beneficiaries/${id}`);
        if (res.data.status === '200') {
          toast.add({
            severity: 'success',
            summary: 'Beneficiary deleted',
            detail: res.data.msg || 'Beneficiary deleted successfully.',
            life: 3000,
          });
          beneficiaries.value = beneficiaries.value.filter((item) => item.id !== id);
        } else {
          toast.add({
            severity: 'error',
            summary: 'Unable to delete beneficiary',
            detail: res.data.msg || 'Unable to delete beneficiary.',
            life: 3500,
          });
        }
      } catch (err) {
        toast.add({
          severity: 'error',
          summary: 'Unable to delete beneficiary',
          detail: err.code === 'ERR_NETWORK'
            ? 'Unable to connect to the server.'
            : err.response?.data?.msg || 'Unable to delete beneficiary.',
          life: 3500,
        });
      }
    },
    reject: () => {
      toast.add({
        severity: 'info',
        summary: 'Cancelled',
        detail: 'Delete action was cancelled.',
        life: 2000,
      });
    },
  });
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
      toast.add({
        severity: 'error',
        summary: 'Unable to load account',
        detail: 'Please try again.',
        life: 3500,
      });
      return;
    }
  }

  fetchBeneficiaries();
});
</script>
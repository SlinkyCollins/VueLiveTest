<template>
  <PageWrapper narrow>
    <div class="page-stack">
      <SectionHeader
        title="Transfer"
        subtitle="Send money to another Vaultly account with a verified recipient."
        eyebrow="Payments"
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
        v-if="step === 1"
        title="Transfer details"
        subtitle="Enter the recipient account number, amount, and optional beneficiary preference."
      >
        <form @submit.prevent="handleVerify" class="form-stack">
          <div class="surface-muted text-center">
            <p class="stat-label">Available balance</p>
            <p class="mt-2 text-3xl font-semibold tracking-tight text-brand-700">
              {{ formatCurrency(authStore.user?.balance) }}
            </p>
          </div>

          <div class="section-card section-stack">
            <div class="flex items-center justify-between gap-4">
              <div class="space-y-1">
                <h3 class="section-title">Saved beneficiary</h3>
                <p class="section-subtitle">Optional. Choose an existing recipient to prefill the transfer.</p>
              </div>
              <span v-if="loadingBeneficiaries" class="badge-muted">Loading...</span>
            </div>

            <Select
              v-model="selectedBeneficiaryId"
              :options="beneficiaryOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select a saved beneficiary"
              class="w-full"
              :loading="loadingBeneficiaries"
              showClear
            />

            <div v-if="selectedBeneficiaryId" class="alert-info">
              Saved beneficiary selected. Recipient details are filled automatically.
            </div>
            <p v-if="beneficiariesError" class="field-error">{{ beneficiariesError }}</p>
          </div>

          <div>
            <label class="field-label">Recipient account number</label>
            <InputText
              v-model="form.account_number"
              type="text"
              maxlength="12"
              inputmode="numeric"
              placeholder="Enter 12-digit account number"
              :disabled="!!selectedBeneficiaryId"
              :class="{ 'p-invalid': errors.account_number }"
              @input="onAccountNumberInput"
            />
            <p v-if="errors.account_number" class="field-error">{{ errors.account_number }}</p>
          </div>

          <div>
            <label class="field-label">Amount (₦)</label>
            <InputText
              v-model="form.amount"
              type="number"
              min="100"
              step="0.01"
              placeholder="Enter amount (minimum ₦100)"
              :class="{ 'p-invalid': errors.amount }"
              @input="clearErrors"
            />
            <p v-if="errors.amount" class="field-error">{{ errors.amount }}</p>
          </div>

          <div v-if="!selectedBeneficiaryId" class="section-card section-stack">
            <label class="flex items-center gap-3 text-sm text-surface-700">
              <input
                v-model="saveBeneficiary"
                type="checkbox"
                class="h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-100"
              />
              Save this recipient after a successful transfer
            </label>

            <div v-if="saveBeneficiary">
              <label class="field-label">Bank name</label>
              <InputText
                v-model="form.bank_name"
                type="text"
                disabled
                placeholder="Vaultly Bank"
              />
            </div>
          </div>

          <div v-if="errorMessage" class="alert-error">{{ errorMessage }}</div>

          <Button
            type="submit"
            class="btn-primary w-full"
            :disabled="verifying || (loadingBeneficiaries && !!selectedBeneficiaryId)"
            :label="verifying ? 'Verifying...' : (selectedBeneficiaryId ? 'Confirm transfer' : 'Verify account')"
          />
        </form>
      </FormCard>

      <FormCard
        v-else-if="step === 2"
        title="Confirm transfer"
        subtitle="Review the recipient details and enter your transaction PIN to complete the transfer."
      >
        <div class="form-stack">
          <div class="surface-muted space-y-3">
            <div class="summary-row">
              <span class="summary-label">Recipient</span>
              <span class="summary-value">{{ verifiedName }}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Account number</span>
              <span class="summary-value">{{ form.account_number }}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Amount</span>
              <span class="summary-value text-brand-700">{{ formatCurrency(form.amount) }}</span>
            </div>
          </div>

          <div>
            <label class="field-label">Transaction PIN</label>
            <Password
              v-model="pin"
              maxlength="4"
              inputmode="numeric"
              placeholder="Enter your 4-digit PIN"
              :feedback="false"
              toggleMask
              fluid
              :inputClass="errors.pin ? 'w-full p-invalid text-center tracking-[0.4em]' : 'w-full text-center tracking-[0.4em]'"
              @input="onPinInput"
            />
            <p v-if="errors.pin" class="field-error">{{ errors.pin }}</p>
          </div>

          <div v-if="!hasTransactionPin" class="alert-warning">
            <p>You need to set a transaction PIN before sending money.</p>
            <button
              class="btn-primary mt-3"
              @click="router.push({ name: 'SetPin', params: { userId: String(route.params.userId) } })"
            >
              Set PIN
            </button>
          </div>

          <div v-if="errorMessage" class="alert-error">{{ errorMessage }}</div>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button class="btn-secondary w-full" @click="step = 1">Cancel</button>
            <Button
              class="btn-primary w-full"
              :disabled="transferring || !isPinValid || !hasTransactionPin"
              :label="transferring ? 'Sending...' : 'Send money'"
              @click="handleTransfer"
            />
          </div>
        </div>
      </FormCard>

      <FormCard
        v-else-if="step === 3"
        title="Transfer complete"
        subtitle="The transfer was processed successfully and your account balance has been updated."
      >
        <div class="space-y-5 text-center">
          <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <span class="pi pi-check text-2xl" />
          </div>
          <div class="space-y-2">
            <h3 class="section-title">Money sent successfully</h3>
            <p class="section-subtitle">
              {{ formatCurrency(form.amount) }} sent to {{ verifiedName }}.
            </p>
            <p class="text-sm text-surface-500">
              New balance: {{ formatCurrency(authStore.user?.balance) }}
            </p>
          </div>
          <div v-if="successMessage" class="alert-success text-left">{{ successMessage }}</div>
          <button
            class="btn-primary w-full"
            @click="router.push({ name: 'Dashboard', params: { userId: String(route.params.userId) } })"
          >
            Back to dashboard
          </button>
        </div>
      </FormCard>
    </div>
  </PageWrapper>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue';
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
const { normalizeFieldDigits, normalizeRefDigits } = useInputNormalization();

const step = ref(1);
const form = ref({
  account_number: '',
  amount: '',
  bank_name: 'Vaultly Bank',
});
const pin = ref('');
const verifiedName = ref('');
const verifying = ref(false);
const transferring = ref(false);
const errors = ref({});
const errorMessage = ref('');
const successMessage = ref('');
const beneficiaries = ref([]);
const beneficiariesError = ref('');
const loadingBeneficiaries = ref(false);
const selectedBeneficiaryId = ref('');
const saveBeneficiary = ref(false);
const isPinValid = computed(() => /^\d{4}$/.test(pin.value));
const hasTransactionPin = computed(() => !!authStore.user?.has_pin);
const beneficiaryOptions = computed(() =>
  beneficiaries.value.map((item) => ({
    label: `${item.account_name} - ${item.account_number}`,
    value: String(item.id)
  }))
);
const formatCurrency = (value) => `₦${Number(value || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

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

  try {
    await authStore.fetchBalance();
  } catch (err) {
    if (err?.response?.status === 401) {
      router.push({ name: 'Login' });
      return;
    }
    errorMessage.value = 'Unable to refresh your balance right now.';
  }

  if (route.query.beneficiaryId) {
    selectedBeneficiaryId.value = String(route.query.beneficiaryId);
    form.value.account_number = String(route.query.accountNumber || '');
    form.value.bank_name = String(route.query.bankName || 'Vaultly Bank');
  }

  fetchBeneficiaries();
});

const fetchBeneficiaries = async () => {
  loadingBeneficiaries.value = true;
  beneficiariesError.value = '';

  try {
    const res = await api.get('/beneficiaries');
    beneficiaries.value = res.data.beneficiaries || [];
    syncSelectedBeneficiary();
  } catch (err) {
    beneficiaries.value = [];
    if (err.code === 'ERR_NETWORK') {
      beneficiariesError.value = 'Unable to load saved beneficiaries. Please check your connection.';
    } else {
      beneficiariesError.value = 'Unable to load saved beneficiaries. Please try again later.';
    }
  } finally {
    loadingBeneficiaries.value = false;
  }
};

const syncSelectedBeneficiary = () => {
  if (!selectedBeneficiaryId.value) {
    return null;
  }

  const selected = beneficiaries.value.find((item) => item.id === Number(selectedBeneficiaryId.value));

  if (!selected) {
    return null;
  }

  form.value.account_number = selected.account_number;
  form.value.bank_name = selected.bank_name;
  saveBeneficiary.value = false;

  return selected;
};

watch(selectedBeneficiaryId, (value) => {
  if (!value) {
    form.value.account_number = '';
    form.value.bank_name = 'Vaultly Bank';
  }

  const selected = syncSelectedBeneficiary();
  if (selected) {
    clearErrors();
  }
});

const clearErrors = () => {
  errors.value = {};
  errorMessage.value = '';
  successMessage.value = '';
};

const onAccountNumberInput = () => {
  normalizeFieldDigits(form, 'account_number', 12);
  clearErrors();
};

const onPinInput = () => {
  normalizeRefDigits(pin, 4);
  errors.value.pin = '';
  errorMessage.value = '';
};

const validateStep1 = () => {
  const newErrors = {};

  // Only require manual account number when no saved beneficiary is selected.
  if (!selectedBeneficiaryId.value) {
    if (!form.value.account_number) {
      newErrors.account_number = 'Account number is required.';
    } else if (!/^\d{12}$/.test(form.value.account_number)) {
      newErrors.account_number = 'Account number must be exactly 12 digits.';
    }
  }

  const amount = Number(form.value.amount);
  if (!form.value.amount) {
    newErrors.amount = 'Amount is required.';
  } else if (isNaN(amount) || amount <= 0) {
    newErrors.amount = 'Enter a valid amount.';
  } else if (amount < 100) {
    newErrors.amount = 'Minimum transfer is ₦100.';
  } else if (amount > 10000000) {
    newErrors.amount = 'Maximum transfer is ₦10,000,000.';
  } else if (authStore.user && amount > Number(authStore.user.balance)) {
    newErrors.amount = 'Insufficient balance.';
  }

  errors.value = newErrors;
  return Object.keys(newErrors).length === 0;
};

const handleVerify = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  if (selectedBeneficiaryId.value) {
    if (loadingBeneficiaries.value) {
      errorMessage.value = 'Loading selected beneficiary. Please wait a moment.';
      return;
    }

    const selected = syncSelectedBeneficiary();

    if (!selected) {
      errorMessage.value = 'Saved beneficiary not found. Please select again.';
      return;
    }

    // Still validate amount (and any other relevant fields) before confirmation.
    if (!validateStep1()) return;

    verifiedName.value = selected.account_name;
    step.value = 2;
    return;
  }

  if (!validateStep1()) return;

  verifying.value = true;

  try {
    const res = await api.post('/verify-account', {
      account_number: form.value.account_number,
    });

    if (res.data.status === '200') {
      verifiedName.value = res.data.account_name;
      step.value = 2;
    } else if (res.data.status === '422') {
      const serverErrors = res.data.msg;
      if (serverErrors.account_number) errors.value.account_number = serverErrors.account_number[0];
    } else {
      errorMessage.value = res.data.msg;
    }
  } catch (err) {
    if (err.code === 'ERR_NETWORK') {
      errorMessage.value = 'Unable to connect to the server.';
    } else {
      errorMessage.value = 'Verification failed. Please try again.';
    }
  } finally {
    verifying.value = false;
  }
};

const handleTransfer = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  if (!hasTransactionPin.value) {
    errorMessage.value = 'Please set your transaction PIN before making transfers.';
    return;
  }

  if (!pin.value || !/^\d{4}$/.test(pin.value)) {
    errors.value.pin = 'Please enter your 4-digit PIN.';
    return;
  }

  transferring.value = true;

  try {
    const res = await api.post('/transfer', {
      beneficiary_id: selectedBeneficiaryId.value ? Number(selectedBeneficiaryId.value) : null,
      account_number: form.value.account_number,
      amount: Number(form.value.amount),
      pin: pin.value,
      save_beneficiary: !selectedBeneficiaryId.value && saveBeneficiary.value,
      bank_name: form.value.bank_name,
    });

    if (res.data.status === '200') {
      authStore.updateBalance(res.data.new_balance);
      if (res.data.beneficiary_saved) {
        successMessage.value = 'Transfer successful and beneficiary saved.';
        fetchBeneficiaries();
      }
      step.value = 3;
    } else if (res.data.status === '401') {
      errors.value.pin = res.data.msg;
    } else if (res.data.status === '403') {
      errorMessage.value = res.data.msg;
    } else {
      errorMessage.value = res.data.msg;
    }
  } catch (err) {
    if (err.code === 'ERR_NETWORK') {
      errorMessage.value = 'Unable to connect to the server.';
    } else {
      errorMessage.value = 'Transfer failed. Please try again.';
    }
  } finally {
    transferring.value = false;
  }
};
</script>

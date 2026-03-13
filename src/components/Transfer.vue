<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-6">
    <div class="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
      <button
        @click="router.push({ name: 'Dashboard' })"
        class="text-blue-600 text-sm font-medium hover:underline mb-4 inline-block"
      >&larr; Back to Dashboard</button>

      <h2 class="text-2xl font-bold text-center mb-6 text-blue-600">Transfer Money 💸</h2>

      <!-- Step 1: Account Verification -->
      <form v-if="step === 1" @submit.prevent="handleVerify" class="space-y-4">
        <div class="bg-gray-50 rounded-lg p-4 text-center">
          <p class="text-sm text-gray-500">Available Balance</p>
          <p class="text-2xl font-bold text-blue-600">
            ₦{{ authStore.user ? Number(authStore.user.balance).toLocaleString('en-NG', { minimumFractionDigits: 2 }) : '0.00' }}
          </p>
        </div>

        <div class="bg-white border rounded-lg p-4 space-y-3">
          <div class="flex justify-between items-center">
            <p class="text-sm font-medium text-gray-700">Use Saved Beneficiary (Optional)</p>
            <span v-if="loadingBeneficiaries" class="text-xs text-gray-500">Loading...</span>
          </div>

          <div class="flex gap-2">
            <select
              v-model="selectedBeneficiaryId"
              class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Select a saved beneficiary</option>
              <option v-for="item in beneficiaries" :key="item.id" :value="String(item.id)">
                {{ item.account_name }} - {{ item.account_number }}
              </option>
            </select>
            <button
              type="button"
              @click="useSavedBeneficiary"
              class="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >Use</button>
          </div>
        </div>

        <div>
          <label class="block text-gray-700 font-medium">Recipient Account Number</label>
          <input
            v-model="form.account_number"
            @input="clearErrors"
            type="text"
            maxlength="12"
            placeholder="Enter 12-digit account number"
            class="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            :class="{ 'border-red-500': errors.account_number }"
          />
          <p v-if="errors.account_number" class="text-red-500 text-sm mt-1">{{ errors.account_number }}</p>
        </div>

        <div>
          <label class="block text-gray-700 font-medium">Amount (₦)</label>
          <input
            v-model="form.amount"
            @input="clearErrors"
            type="number"
            min="100"
            step="0.01"
            placeholder="Enter amount (min ₦100)"
            class="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            :class="{ 'border-red-500': errors.amount }"
          />
          <p v-if="errors.amount" class="text-red-500 text-sm mt-1">{{ errors.amount }}</p>
        </div>

        <div v-if="!selectedBeneficiaryId" class="space-y-3 border rounded-lg p-4">
          <label class="flex items-center gap-2 text-sm text-gray-700">
            <input v-model="saveBeneficiary" type="checkbox" class="rounded" />
            Save this recipient after successful transfer
          </label>

          <div v-if="saveBeneficiary" class="grid grid-cols-1 gap-3">
            <div>
              <label class="block text-gray-700 font-medium">Bank Name</label>
              <input
                v-model="form.bank_name"
                type="text"
                disabled
                class="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Vaultly Bank"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          class="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="verifying"
        >{{ verifying ? 'Verifying...' : 'Verify Account' }}</button>

        <p v-if="errorMessage" class="text-red-600 text-center text-sm mt-3">{{ errorMessage }}</p>
      </form>

      <!-- Step 2: Confirmation -->
      <div v-else-if="step === 2" class="space-y-4">
        <div class="bg-blue-50 rounded-lg p-5 space-y-3">
          <h3 class="text-lg font-semibold text-gray-800 text-center">Confirm Transfer</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">Recipient</span>
              <span class="font-medium text-gray-800">{{ verifiedName }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Account Number</span>
              <span class="font-medium text-gray-800">{{ form.account_number }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Amount</span>
              <span class="font-bold text-blue-600">₦{{ Number(form.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 }) }}</span>
            </div>
          </div>
        </div>

        <div class="flex gap-3">
          <button
            @click="step = 1"
            class="w-1/2 py-2 px-4 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
          >Cancel</button>
          <button
            @click="handleTransfer"
            :disabled="transferring"
            class="w-1/2 py-2 px-4 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >{{ transferring ? 'Sending...' : 'Send Money' }}</button>
        </div>

        <!-- Transaction PIN -->
        <div>
          <label class="block text-gray-700 font-medium text-sm">Transaction PIN</label>
          <input
            v-model="pin"
            type="password"
            maxlength="4"
            inputmode="numeric"
            placeholder="Enter 4-digit PIN"
            class="mt-1 w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-center text-xl tracking-[0.5em]"
            :class="{ 'border-red-500': errors.pin }"
          />
          <p v-if="errors.pin" class="text-red-500 text-sm mt-1">{{ errors.pin }}</p>
        </div>

        <p v-if="errorMessage" class="text-red-600 text-center text-sm mt-3">{{ errorMessage }}</p>
      </div>

      <!-- Step 3: Success -->
      <div v-else-if="step === 3" class="text-center space-y-4">
        <div class="text-green-500 text-5xl">✓</div>
        <h3 class="text-xl font-bold text-gray-800">Transfer Successful!</h3>
        <p class="text-gray-500">₦{{ Number(form.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 }) }} sent to {{ verifiedName }}</p>
        <p class="text-sm text-gray-400">New balance: ₦{{ Number(authStore.user.balance).toLocaleString('en-NG', { minimumFractionDigits: 2 }) }}</p>
        <p v-if="successMessage" class="text-green-600 text-sm">{{ successMessage }}</p>
        <button
          @click="router.push({ name: 'Dashboard' })"
          class="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
        >Back to Dashboard</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/utils/api';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

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
const loadingBeneficiaries = ref(false);
const selectedBeneficiaryId = ref('');
const saveBeneficiary = ref(false);

onMounted(async () => {
  if (!authStore.user) {
    try {
      await authStore.fetchDashboard();
    } catch {
      router.push({ name: 'Login' });
      return;
    }
  }
  // Refresh balance from lightweight endpoint
  try {
    await authStore.fetchBalance();
  } catch {
    // Dashboard data is still usable if balance fetch fails
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

  try {
    const res = await api.get('/beneficiaries');
    beneficiaries.value = res.data.beneficiaries || [];
  } catch {
    beneficiaries.value = [];
  } finally {
    loadingBeneficiaries.value = false;
  }
};

const useSavedBeneficiary = () => {
  const id = Number(selectedBeneficiaryId.value);
  const selected = beneficiaries.value.find((item) => item.id === id);

  if (!selected) {
    return;
  }

  form.value.account_number = selected.account_number;
  form.value.bank_name = selected.bank_name;
  saveBeneficiary.value = false;
  clearErrors();
};

const clearErrors = () => {
  errors.value = {};
  errorMessage.value = '';
  successMessage.value = '';
};

const validateStep1 = () => {
  const newErrors = {};

  if (!form.value.account_number) {
    newErrors.account_number = 'Account number is required.';
  } else if (form.value.account_number.length !== 12) {
    newErrors.account_number = 'Account number must be 12 digits.';
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

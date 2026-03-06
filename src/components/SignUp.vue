<template>
  <div class="bg-light">
    <div class="card shadow-lg p-4" style="width: 100%; max-width: 420px; border-radius: 1rem;">
      <h3 class="text-center mb-4 text-primary fw-bold">Create Bank Account 🏦</h3>

      <div class="mb-3">
        <label class="form-label">Full Name</label>
        <input type="text" class="form-control" v-model.trim="fullname" placeholder="Enter full name" />
        <small class="text-danger" v-if="errors.fullname">{{ errors.fullname[0] }}</small>
      </div>

      <div class="mb-3">
        <label class="form-label">Email</label>
        <input type="email" class="form-control" v-model.trim="email" placeholder="Enter email" />
        <small class="text-danger" v-if="errors.email">{{ errors.email[0] }}</small>
      </div>

      <div class="mb-3">
        <label class="form-label">Password</label>
        <input type="password" class="form-control" v-model.trim="password" placeholder="Enter password" />
        <small class="text-danger" v-if="errors.password">{{ errors.password[0] }}</small>
      </div>

      <div class="mb-4">
        <label class="form-label">Account Type</label>
        <select class="form-select" v-model="accountType">
          <option disabled value="">Select account type</option>
          <option value="savings">Savings</option>
          <option value="current">Current</option>
          <option value="fixed">Fixed</option>
        </select>
        <small class="text-danger" v-if="errors.accountType">{{ errors.accountType[0] }}</small>
      </div>

      <button class="btn btn-primary w-100" @click="submitForm" :disabled="loading">
        {{ loading ? 'Signing Up...' : 'Sign Up' }}
      </button>
      <div class="text-success mt-3 text-center" v-if="successMessage">{{ successMessage }}</div>
      <div class="text-danger mt-3 text-center" v-if="errorMessage">{{ errorMessage }}</div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      fullname: '',
      email: '',
      password: '',
      accountType: '',
      errors: {},
      errorMessage: '',
      successMessage: '',
      loading: false,
    };
  },
  methods: {
    async submitForm() {
      this.errors = {};
      this.errorMessage = '';
      this.successMessage = '';

      // Client-side validation
      if (!this.fullname || !this.email || !this.password || !this.accountType) {
        this.errorMessage = 'Please fill in all fields.';
        return;
      }

      this.loading = true;

      try {
        const res = await axios.post('http://127.0.0.1:8000/api/register', {
          fullname: this.fullname,
          email: this.email,
          password: this.password,
          accountType: this.accountType,
        });

        if (res.data.status === '200') {
          this.successMessage = res.data.msg;
          setTimeout(() => {
            this.$router.push('/login');
          }, 1500);
        } else if (res.data.status === '422') {
          // Validation errors from Laravel
          this.errors = res.data.msg;
        } else {
          this.errorMessage = 'Something went wrong.';
        }
      } catch (err) {
        console.error(err);
        this.errorMessage = 'Something went wrong. Try again.';
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<template>
  <div class="bg-light">
    <div class="card shadow-lg p-4" style="width: 100%; max-width: 420px; border-radius: 1rem;">
      <h3 class="text-center mb-4 text-primary fw-bold">Create Bank Account 🏦</h3>

      <div class="mb-3">
        <label class="form-label">Full Name</label>
        <input type="text" class="form-control" v-model.trim="fullname" placeholder="Enter full name" />
      </div>

      <div class="mb-3">
        <label class="form-label">Username</label>
        <input type="text" class="form-control" v-model.trim="username" placeholder="Enter username" />
      </div>

      <div class="mb-3">
        <label class="form-label">Email</label>
        <input type="email" class="form-control" v-model.trim="email" placeholder="Enter email" />
      </div>

      <div class="mb-3">
        <label class="form-label">Password</label>
        <input type="password" class="form-control" v-model.trim="password" placeholder="Enter password" />
      </div>

      <div class="mb-4">
        <label class="form-label">Account Type</label>
        <select class="form-select" v-model="accountType">
          <option disabled value="">Select account type</option>
          <option value="savings">Savings</option>
          <option value="current">Current</option>
          <option value="fixed">Fixed</option>
        </select>
      </div>

      <button class="btn btn-primary w-100" @click="submitForm">Sign Up</button>
      <div class="text-danger mt-3 text-center">{{ errorMessage }}</div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      fullname: '',
      username: '',
      email: '',
      password: '',
      accountType: '',
      errorMessage: '',
    };
  },
  methods: {
    async submitForm() {
      this.errorMessage = '';

      if (!this.fullname || !this.username || !this.email || !this.password || !this.accountType) {
        this.errorMessage = 'Please fill in all fields.';
        return;
      }

      try {
        const res = await axios.post('http://127.0.0.1:8000/api/register', {
          fullname: this.fullname,
          username: this.username,
          email: this.email,
          password: this.password,
          accountType: this.accountType,
        });

        if (res.data.status === '200') {
          this.errorMessage = res.data.msg;
          this.$router.push('/login');
        } else {
          this.errorMessage = res.data.msg;
        }
      } catch (err) {
        console.error(err);
        this.errorMessage = 'Something went wrong. Try again.';
      }
    },
  },
};
</script>

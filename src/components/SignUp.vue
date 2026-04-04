<template>
  <PageWrapper auth>
    <FormCard
      title="Create your account"
      subtitle="Open your Vaultly account and get started with simple everyday banking."
    >
      <form @submit.prevent="submitForm" class="form-stack">
        <div>
          <label class="field-label">Full name</label>
          <InputText
            v-model="form.fullname"
            type="text"
            placeholder="John Doe"
            :class="{ 'p-invalid': errors.fullname }"
          />
          <p v-if="errors.fullname" class="field-error">{{ errors.fullname[0] }}</p>
        </div>

        <div>
          <label class="field-label">Email address</label>
          <InputText
            v-model="form.email"
            type="email"
            placeholder="you@mail.com"
            :class="{ 'p-invalid': errors.email }"
          />
          <p v-if="errors.email" class="field-error">{{ errors.email[0] }}</p>
        </div>

        <div>
          <label class="field-label">Password</label>
          <Password
            v-model="form.password"
            placeholder="Create a password"
            :feedback="false"
            toggleMask
            fluid
            :inputClass="errors.password ? 'w-full p-invalid' : 'w-full'"
          />
          <p v-if="errors.password" class="field-error">{{ errors.password[0] }}</p>
        </div>

        <div>
          <label class="field-label">Account type</label>
          <Select
            v-model="form.accountType"
            :options="accountTypeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select account type"
            :class="{ 'p-invalid': errors.accountType }"
          />
          <p v-if="errors.accountType" class="field-error">{{ errors.accountType[0] }}</p>
        </div>

        <div class="space-y-3">
          <Button
            type="submit"
            class="btn-primary w-full"
            :disabled="loading"
            :label="loading ? 'Signing up...' : 'Sign up'"
          />
        </div>
      </form>

      <div class="mt-6 border-t border-surface-200 pt-5 text-sm text-surface-500">
        Already have an account?
        <RouterLink :to="{ name: 'Login' }" class="font-medium text-brand-600">
          Log in
        </RouterLink>
      </div>
    </FormCard>
  </PageWrapper>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useToast } from 'primevue/usetoast';
import api from "@/utils/api";
import PageWrapper from "@/components/ui/PageWrapper.vue";
import FormCard from "@/components/ui/FormCard.vue";

const router = useRouter();
const toast = useToast();

const form = ref({
  fullname: "",
  email: "",
  password: "",
  accountType: "",
});

const accountTypes = ["savings", "current", "fixed"];

const accountTypeOptions = accountTypes.map((type) => ({
  label: type.charAt(0).toUpperCase() + type.slice(1),
  value: type,
}));

const errors = ref({});
const loading = ref(false);

const submitForm = async () => {
  errors.value = {};

  if (!form.value.fullname || !form.value.email || !form.value.password || !form.value.accountType) {
    toast.add({
      severity: 'warn',
      summary: 'Missing details',
      detail: 'Please fill in all fields.',
      life: 2800,
    });
    return;
  }

  loading.value = true;

  try {
    const res = await api.post("/register", {
      fullname: form.value.fullname,
      email: form.value.email,
      password: form.value.password,
      accountType: form.value.accountType,
    });

    if (res.data.status === "200") {
      toast.add({
        severity: 'success',
        summary: 'Signup successful',
        detail: 'Your account has been created.',
        life: 2200,
      });
      router.push({
        name: "Login",
        query: { signupSuccess: "1" },
      });
    } else if (res.data.status === "422") {
      errors.value = res.data.msg; // Laravel validation errors
    } else {
      toast.add({
        severity: 'error',
        summary: 'Signup failed',
        detail: res.data.msg || 'Something went wrong.',
        life: 3200,
      });
    }
  } catch (err) {
    console.error(err);
    toast.add({
      severity: 'error',
      summary: 'Signup failed',
      detail: err.code === 'ERR_NETWORK'
        ? 'Unable to connect to the server.'
        : 'Something went wrong. Try again.',
      life: 3200,
    });
  } finally {
    loading.value = false;
  }
};
</script>

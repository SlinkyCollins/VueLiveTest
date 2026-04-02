<template>
  <PageWrapper auth>
    <FormCard
      title="Create your account"
      subtitle="Open your Vaultly account and get started with simple everyday banking."
    >
      <div class="mb-6 space-y-3">
        <span class="badge-primary">Vaultly</span>
        <p class="section-subtitle">
          Set up your profile details once, then continue straight into your account.
        </p>
      </div>

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
            :options="accountTypes"
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

          <div v-if="successMessage" class="alert-success">{{ successMessage }}</div>
          <div v-if="errorMessage" class="alert-error">{{ errorMessage }}</div>
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
import api from "@/utils/api";
import PageWrapper from "@/components/ui/PageWrapper.vue";
import FormCard from "@/components/ui/FormCard.vue";

const router = useRouter();

const form = ref({
  fullname: "",
  email: "",
  password: "",
  accountType: "",
});

const accountTypes = ["savings", "current", "fixed"];

const errors = ref({});
const loading = ref(false);
const successMessage = ref("");
const errorMessage = ref("");

const submitForm = async () => {
  errors.value = {};
  errorMessage.value = "";
  successMessage.value = "";

  if (!form.value.fullname || !form.value.email || !form.value.password || !form.value.accountType) {
    errorMessage.value = "Please fill in all fields.";
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
      successMessage.value = "Signup successful.";
      router.push({
        name: "Login",
        query: { signupSuccess: "1" },
      });
    } else if (res.data.status === "422") {
      errors.value = res.data.msg; // Laravel validation errors
    } else {
      errorMessage.value = "Something went wrong.";
    }
  } catch (err) {
    console.error(err);
    errorMessage.value = "Something went wrong. Try again.";
  } finally {
    loading.value = false;
  }
};
</script>

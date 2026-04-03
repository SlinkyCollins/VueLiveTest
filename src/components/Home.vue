<template>
  <PageWrapper auth>
    <FormCard
    >
      <div class="mb-6 space-y-3">
        <span class="badge-primary">Vaultly</span>
        <p class="section-subtitle">
          Move money, review balances, and track transactions without a noisy interface or inconsistent flows.
        </p>
      </div>

      <div class="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div class="surface-muted text-left space-y-2">
          <span class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
            <i class="pi pi-plus-circle text-sm"></i>
          </span>
          <p class="text-sm font-semibold text-surface-900">Deposits</p>
          <p class="text-sm leading-6 text-surface-600">Fund your account in a few steps.</p>
        </div>

        <div class="surface-muted text-left space-y-2">
          <span class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
            <i class="pi pi-arrow-right-arrow-left text-sm"></i>
          </span>
          <p class="text-sm font-semibold text-surface-900">Transfers</p>
          <p class="text-sm leading-6 text-surface-600">Send money with PIN protection.</p>
        </div>

        <div class="surface-muted text-left space-y-2">
          <span class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
            <i class="pi pi-history text-sm"></i>
          </span>
          <p class="text-sm font-semibold text-surface-900">History</p>
          <p class="text-sm leading-6 text-surface-600">Review account activity clearly.</p>
        </div>
      </div>

      <div class="space-y-3">
        <Button
          type="button"
          class="btn-primary w-full"
          label="Log in"
          @click="router.push({ name: 'Login' })"
        />

        <Button
          type="button"
          class="btn-secondary w-full"
          label="Create account"
          @click="router.push({ name: 'signup' })"
        />
      </div>
    </FormCard>
  </PageWrapper>
</template>

<script setup>
import { useRouter } from 'vue-router';
import PageWrapper from '@/components/ui/PageWrapper.vue';
import FormCard from '@/components/ui/FormCard.vue';

const router = useRouter();
</script>

<style></style>

<!-- src/views/auth/ForgotPassword.vue -->
<script setup>
import { ref } from 'vue';
import PactButton from '../../components/ui/PactButton.vue';
import PactInput from '../../components/ui/PactInput.vue';
import PactCard from '../../components/ui/PactCard.vue';
import { ShieldCheck, Mail, ArrowLeft, CheckCircle2 } from '@lucide/vue';

const email = ref('');
const submitted = ref(false);
const loading = ref(false);

const handleReset = async () => {
  if (!email.value) return;
  
  loading.value = true;
  // Simulate delay
  await new Promise(r => setTimeout(r, 800));
  loading.value = false;
  submitted.value = true;
};
</script>

<template>
  <div class="w-full max-w-[440px] px-4 py-8">
    <!-- Header -->
    <div class="text-center mb-8">
      <div class="inline-flex items-center justify-center h-12 w-12 bg-brand-100 border border-brand-200 rounded-2xl text-brand-500 mb-4">
        <ShieldCheck class="w-7 h-7 stroke-[2.5]" />
      </div>
      <h2 class="text-2xl font-bold tracking-tight text-slate-900">Reset your password</h2>
      <p class="text-sm text-slate-500 mt-1">We will send a simulation reset link to your email</p>
    </div>

    <!-- Card -->
    <PactCard padding="p-8">
      <!-- Normal Form -->
      <form v-if="!submitted" @submit.prevent="handleReset" class="space-y-5">
        <PactInput
          v-model="email"
          label="Email Address"
          type="email"
          placeholder="you@company.com"
          required
        >
          <template #prefix>
            <Mail class="w-4.5 h-4.5" />
          </template>
        </PactInput>

        <PactButton
          type="submit"
          class="w-full"
          :loading="loading"
        >
          Send Reset Link
        </PactButton>
      </form>

      <!-- Success State -->
      <div v-else class="text-center py-4 space-y-4">
        <div class="inline-flex items-center justify-center h-12 w-12 bg-emerald-50 rounded-full text-emerald-600 mb-2">
          <CheckCircle2 class="w-7 h-7" />
        </div>
        <h3 class="text-lg font-bold text-slate-900">Check your inbox</h3>
        <p class="text-sm text-slate-500 leading-relaxed">
          We have simulated sending a password reset email to <span class="font-semibold text-slate-800">{{ email }}</span>. In a real system, you would receive a secure token link.
        </p>
        <div class="pt-2">
          <PactButton variant="secondary" class="w-full" @click="submitted = false">
            Try another email
          </PactButton>
        </div>
      </div>
    </PactCard>

    <!-- Back Link -->
    <p class="text-center text-xs text-slate-500 mt-6">
      <router-link to="/auth/login" class="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-700">
        <ArrowLeft class="w-3.5 h-3.5" />
        Back to sign in
      </router-link>
    </p>
  </div>
</template>

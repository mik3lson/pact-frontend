<!-- src/views/auth/Register.vue -->
<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import PactButton from '../../components/ui/PactButton.vue';
import PactInput from '../../components/ui/PactInput.vue';
import PactCard from '../../components/ui/PactCard.vue';
import { ShieldCheck, Mail, Lock, User } from '@lucide/vue';

const authStore = useAuthStore();
const router = useRouter();

const name = ref('');
const email = ref('');
const password = ref('');
const role = ref('freelancer'); // Default
const localError = ref('');
const loading = ref(false);

const handleRegister = async () => {
  if (!name.value || !email.value || !password.value) {
    localError.value = 'All fields are required.';
    return;
  }
  
  loading.value = true;
  localError.value = '';
  
  try {
    await authStore.register(name.value, email.value, role.value, password.value);
    router.push('/dashboard');
  } catch (err) {
    localError.value = err.response?.data?.message || 'Registration failed. Try again.';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="w-full max-w-[460px] px-4 py-8">
    <!-- Header -->
    <div class="text-center mb-8">
      <img src="/src/assets/images/pactlogo2.png" alt="Pact Logo" class="h-16 w-auto mx-auto mb-4" />
      <h2 class="text-2xl font-bold tracking-tight text-slate-900">Create your Pact account</h2>
      <p class="text-sm text-slate-500 mt-1">Start working and transacting safely today</p>
    </div>

    <!-- Card -->
    <PactCard padding="p-8">
      <!-- Error Alert -->
      <div v-if="localError" class="mb-4 p-3.5 bg-red-50 border border-red-100 rounded-xl text-xs font-semibold text-red-600">
        {{ localError }}
      </div>

      <form @submit.prevent="handleRegister" class="space-y-4">

        <!-- Name Input -->
        <PactInput
          v-model="name"
          label="Full Name"
          required
        >
          <template #prefix>
            <User class="w-4.5 h-4.5" />
          </template>
        </PactInput>

        <!-- Email Input -->
        <PactInput
          v-model="email"
          label="Email Address"
          type="email"
          required
        >
          <template #prefix>
            <Mail class="w-4.5 h-4.5" />
          </template>
        </PactInput>

        <!-- Password Input -->
        <PactInput
          v-model="password"
          label="Password"
          type="password"
          required
        >

      
          <template #prefix>
            <Lock class="w-4.5 h-4.5" />
          </template>
        </PactInput>

        <PactInput
          v-model="confirmPassword"
          label="Confirm Password"
          type="password"
          required
        >
          <template #prefix>
            <Lock class="w-4.5 h-4.5" />
          </template>
        </PactInput>

        <!-- Submit Button -->
        <PactButton
          type="submit"
          class="w-full mt-2"
          :loading="loading"
        >
          Create Account
        </PactButton>
      </form>
    </PactCard>

    <!-- Redirect link -->
    <p class="text-center text-xs text-slate-500 mt-6">
      Already have an account?
      <router-link to="/auth/login" class="font-semibold text-brand-600 hover:text-brand-700">
        Sign in
      </router-link>
    </p>
  </div>
</template>

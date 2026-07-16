<!-- src/views/auth/Login.vue -->
<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import PactButton from '../../components/ui/PactButton.vue';
import PactInput from '../../components/ui/PactInput.vue';
import PactCard from '../../components/ui/PactCard.vue';
import { Mail, Lock } from '@lucide/vue';

const authStore = useAuthStore();
const router = useRouter();

const email = ref('');
const password = ref('');
const localError = ref('');
const loading = ref(false);

const handleLogin = async () => {
  if (!email.value || !password.value) {
    localError.value = 'Please enter both email and password.';
    return;
  }
  
  loading.value = true;
  localError.value = '';
  
  try {
    await authStore.login(email.value, password.value);
    router.push('/dashboard');
  } catch (err) {
    localError.value = err.response?.data?.message || 'Login failed. Please check your credentials.';
  } finally {
    loading.value = false;
  }
};

const fillDemo = () => {
  email.value = 'demo@pact.com';
  password.value = 'password';
  handleLogin();
};
</script>

<template>
  <div class="w-full max-w-[440px] px-4 py-8">
    <!-- Header -->
    <div class="text-center mb-8">
      <img src="/src/assets/images/pactlogogo.png" alt="Pact Logo" class="h-16 w-auto mx-auto mb-4" />
      <h2 class="text-2xl font-bold tracking-tight text-slate-900">Sign in to Pact</h2>
      <p class="text-sm text-slate-500 mt-1">Escrow & invoicing for premium clients & creators</p>
    </div>

    <!-- Card Container -->
    <PactCard padding="p-8">
      <!-- Error messages -->
      <div v-if="localError" class="mb-4 p-3.5 bg-red-50 border border-red-100 rounded-xl text-xs font-semibold text-red-600">
        {{ localError }}
      </div>

      <form @submit.prevent="handleLogin" class="space-y-5">
        <!-- Email Input -->
        <PactInput
          v-model="email"
          label="Work Email Address"
          type="email"
          placeholder="you@company.com"
          required
        >
          <template #prefix>
            <Mail class="w-4.5 h-4.5" />
          </template>
        </PactInput>

        <!-- Password Input -->
        <div class="space-y-1">
          <div class="flex justify-between items-center">
            <label class="block text-xs font-semibold text-slate-700 tracking-wide uppercase">Password</label>
            <router-link to="/auth/forgot-password" class="text-xs font-semibold text-brand-600 hover:text-brand-700">
              Forgot?
            </router-link>
          </div>
          <PactInput
            v-model="password"
            type="password"
            placeholder="••••••••"
            required
          >
            <template #prefix>
              <Lock class="w-4.5 h-4.5" />
            </template>
          </PactInput>
        </div>

        <!-- Submit Button -->
        <PactButton
          type="submit"
          class="w-full"
          :loading="loading"
        >
          Sign In
        </PactButton>
      </form>

  
    </PactCard>

    <!-- Sign up redirect -->
    <p class="text-center text-xs text-slate-500 mt-6">
      New to Pact?
      <router-link to="/auth/register" class="font-semibold text-brand-600 hover:text-brand-700">
        Create a free account
      </router-link>
    </p>
  </div>
</template>

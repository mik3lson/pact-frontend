// src/stores/auth.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../services/api';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const token = ref(localStorage.getItem('pact_token') || null);
  const loading = ref(false);
  const error = ref(null);

  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const isFreelancer = computed(() => user.value?.role === 'freelancer');
  const isClient = computed(() => user.value?.role === 'client');

  async function login(email, password) {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.post('/auth/login', { email, password });
      user.value = res.data.user;
      token.value = res.data.token;
      localStorage.setItem('pact_token', res.data.token);
      return res.data.user;
    } catch (err) {
      error.value = err.response?.data?.message || 'Login failed';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function register(name, username, email, role, password) {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.post('/auth/register', { name, username, email, role, password });
      user.value = res.data.user;
      token.value = res.data.token;
      localStorage.setItem('pact_token', res.data.token);
      return res.data.user;
    } catch (err) {
      error.value = err.response?.data?.message || 'Registration failed';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function checkMe() {
    if (!token.value) return null;
    loading.value = true;
    try {
      const res = await api.get('/auth/me');
      user.value = res.data.user;
      return res.data.user;
    } catch (err) {
      logout();
      return null;
    } finally {
      loading.value = false;
    }
  }

  function logout() {
    user.value = null;
    token.value = null;
    localStorage.removeItem('pact_token');
    // Call mockDb clear if completely resetting or just standard log out
    localStorage.removeItem('pact_current_user');
  }

  async function updateProfile(profileData) {
    loading.value = true;
    try {
      const res = await api.put('/auth/profile', profileData);
      user.value = res.data.user;
      return res.data.user;
    } catch (err) {
      error.value = err.response?.data?.message || 'Profile update failed';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function addBankAccount(bankData) {
    loading.value = true;
    try {
      const res = await api.post('/auth/bank-accounts', bankData);
      user.value.bankAccounts = res.data.bankAccounts;
      return res.data.bankAccounts;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to add bank account';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteBankAccount(id) {
    loading.value = true;
    try {
      const res = await api.delete(`/auth/bank-accounts/${id}`);
      user.value.bankAccounts = res.data.bankAccounts;
      return res.data.bankAccounts;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to delete bank account';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function depositFunds(amount, bankId) {
    loading.value = true;
    try {
      const res = await api.post('/wallet/deposit', { amount, bankId });
      // Reload user me to refresh any profile states, or update wallet
      return res.data.wallet;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to deposit funds';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    isFreelancer,
    isClient,
    login,
    register,
    checkMe,
    logout,
    updateProfile,
    addBankAccount,
    deleteBankAccount,
    depositFunds
  };
});

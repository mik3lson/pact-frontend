// src/stores/wallet.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../services/api';

export const useWalletStore = defineStore('wallet', () => {
  const wallet = ref({
    available: 0,
    escrow: 0,
    pending: 0,
    lifetimeEarnings: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    activeEscrows: 0,
    completedEscrows: 0,
    totalRevenue: 0,
    totalSettlements: 0
  });
  const transactions = ref([]);
  const settlements = ref([]);
  const escrowMovements = ref([]);
  const paymentMethods = ref([]);
  const bankAccount = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // Computed
  const totalBalance = computed(() => {
    return wallet.value.available + wallet.value.escrow + wallet.value.pending;
  });

  const recentActivity = computed(() => {
    return [...transactions.value]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 20);
  });

  // Fetch all wallet data
  async function fetchWallet() {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.get('/wallet');
      wallet.value = { ...wallet.value, ...res.data.wallet };
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch wallet';
    } finally {
      loading.value = false;
    }
  }

  async function fetchTransactions() {
    try {
      const res = await api.get('/wallet/transactions');
      transactions.value = res.data.transactions || [];
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    }
  }

  async function fetchSettlements() {
    try {
      const res = await api.get('/wallet/settlements');
      settlements.value = res.data.settlements || [];
    } catch (err) {
      console.error('Failed to fetch settlements', err);
    }
  }

  async function fetchEscrowMovements() {
    try {
      const res = await api.get('/wallet/escrow-movements');
      escrowMovements.value = res.data.movements || [];
    } catch (err) {
      console.error('Failed to fetch escrow movements', err);
    }
  }

  async function fetchPaymentMethods() {
    try {
      const res = await api.get('/wallet/payment-methods');
      paymentMethods.value = res.data.methods || [];
    } catch (err) {
      console.error('Failed to fetch payment methods', err);
    }
  }

  async function fetchBankAccount() {
    try {
      const res = await api.get('/wallet/bank-account');
      bankAccount.value = res.data.account || null;
    } catch (err) {
      console.error('Failed to fetch bank account', err);
    }
  }

  async function depositFunds(amount, bankId) {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.post('/wallet/deposit', { amount, bankId });
      wallet.value = { ...wallet.value, ...res.data.wallet };
      await fetchTransactions();
      return res.data.wallet;
    } catch (err) {
      error.value = err.response?.data?.message || 'Deposit failed';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function withdrawFunds(amount, bankAccountId, bankName, accountNumber) {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.post('/wallet/withdraw', { amount, bankAccountId, bankName, accountNumber });
      wallet.value = { ...wallet.value, ...res.data.wallet };
      await fetchTransactions();
      return res.data.wallet;
    } catch (err) {
      error.value = err.response?.data?.message || 'Withdrawal failed';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchAll() {
    await Promise.all([
      fetchWallet(),
      fetchTransactions(),
      fetchSettlements(),
      fetchEscrowMovements(),
      fetchPaymentMethods(),
      fetchBankAccount()
    ]);
  }

  return {
    wallet,
    transactions,
    settlements,
    escrowMovements,
    paymentMethods,
    bankAccount,
    loading,
    error,
    totalBalance,
    recentActivity,
    fetchWallet,
    fetchTransactions,
    fetchSettlements,
    fetchEscrowMovements,
    fetchPaymentMethods,
    fetchBankAccount,
    depositFunds,
    withdrawFunds,
    fetchAll
  };
});

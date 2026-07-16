// src/stores/contracts.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../services/api';

export const useContractsStore = defineStore('contracts', () => {
  const contracts = ref([]);
  const currentContract = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // Wallet and transactions
  const wallet = ref({ available: 0, escrow: 0, withdrawable: 0 });
  const transactions = ref([]);

  async function fetchContracts() {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.get('/contracts');
      contracts.value = res.data.contracts;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch contracts';
    } finally {
      loading.value = false;
    }
  }

  async function fetchContractById(id) {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.get(`/contracts/${id}`);
      currentContract.value = res.data.contract;
      return res.data.contract;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch contract';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createContract(contractData) {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.post('/contracts', contractData);
      contracts.value.push(res.data.contract);
      await fetchWallet(); // Update wallet details in real-time
      return res.data.contract;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to create contract';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fundContract(id) {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.post(`/contracts/${id}/fund`);
      currentContract.value = res.data.contract;
      
      // Update in local contracts list
      const idx = contracts.value.findIndex(c => c.id === id);
      if (idx !== -1) {
        contracts.value[idx] = res.data.contract;
      }
      
      await fetchWallet();
      await fetchTransactions();
      return res.data.contract;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fund contract';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function submitMilestone(contractId, milestoneId) {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.post(`/contracts/${contractId}/milestones/${milestoneId}/submit`);
      currentContract.value = res.data.contract;
      
      const idx = contracts.value.findIndex(c => c.id === contractId);
      if (idx !== -1) {
        contracts.value[idx] = res.data.contract;
      }
      return res.data.contract;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to submit milestone';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function approveMilestone(contractId, milestoneId) {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.post(`/contracts/${contractId}/milestones/${milestoneId}/approve`);
      currentContract.value = res.data.contract;
      
      const idx = contracts.value.findIndex(c => c.id === contractId);
      if (idx !== -1) {
        contracts.value[idx] = res.data.contract;
      }
      
      await fetchWallet();
      await fetchTransactions();
      return res.data.contract;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to approve milestone';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function openDispute(contractId) {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.post(`/contracts/${contractId}/dispute`);
      currentContract.value = res.data.contract;
      
      const idx = contracts.value.findIndex(c => c.id === contractId);
      if (idx !== -1) {
        contracts.value[idx] = res.data.contract;
      }
      return res.data.contract;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to open dispute';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function sendMessage(contractId, content, attachment = null) {
    error.value = null;
    try {
      const res = await api.post(`/contracts/${contractId}/messages`, { content, attachment });
      if (currentContract.value && currentContract.value.id === contractId) {
        currentContract.value.messages = res.data.messages;
      }
      return res.data.messages;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to send message';
      throw err;
    }
  }

  async function fetchWallet() {
    try {
      const res = await api.get('/wallet');
      wallet.value = res.data.wallet;
    } catch (err) {
      console.error('Failed to fetch wallet balance', err);
    }
  }

  async function fetchTransactions() {
    try {
      const res = await api.get('/wallet/transactions');
      transactions.value = res.data.transactions;
    } catch (err) {
      console.error('Failed to fetch transactions log', err);
    }
  }

  async function withdrawFunds(amount, bankAccountId, bankName, accountNumber) {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.post('/wallet/withdraw', { amount, bankAccountId, bankName, accountNumber });
      wallet.value = res.data.wallet;
      transactions.value.unshift(res.data.transaction);
      return res.data.wallet;
    } catch (err) {
      error.value = err.response?.data?.message || 'Withdrawal failed';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    contracts,
    currentContract,
    loading,
    error,
    wallet,
    transactions,
    fetchContracts,
    fetchContractById,
    createContract,
    fundContract,
    submitMilestone,
    approveMilestone,
    openDispute,
    sendMessage,
    fetchWallet,
    fetchTransactions,
    withdrawFunds
  };
});

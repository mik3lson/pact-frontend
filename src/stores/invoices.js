// src/stores/invoices.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../services/api';
import { useContractsStore } from './contracts';

export const useInvoicesStore = defineStore('invoices', () => {
  const invoices = ref([]);
  const loading = ref(false);
  const error = ref(null);

  async function fetchInvoices() {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.get('/invoices');
      invoices.value = res.data.invoices;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch invoices';
    } finally {
      loading.value = false;
    }
  }

  async function createInvoice(invoiceData) {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.post('/invoices', invoiceData);
      invoices.value.push(res.data.invoice);
      return res.data.invoice;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to create invoice';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function payInvoice(id) {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.post(`/invoices/${id}/pay`);
      
      // Update in local invoices list
      const idx = invoices.value.findIndex(inv => inv.id === id);
      if (idx !== -1) {
        invoices.value[idx] = res.data.invoice;
      }
      
      // Refresh wallet & transactions on contracts store to sync balances
      const contractsStore = useContractsStore();
      await contractsStore.fetchWallet();
      await contractsStore.fetchTransactions();
      
      return res.data.invoice;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to pay invoice';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function cancelInvoice(id) {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.post(`/invoices/${id}/cancel`);
      
      const idx = invoices.value.findIndex(inv => inv.id === id);
      if (idx !== -1) {
        invoices.value[idx] = res.data.invoice;
      }
      return res.data.invoice;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to cancel invoice';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    invoices,
    loading,
    error,
    fetchInvoices,
    createInvoice,
    payInvoice,
    cancelInvoice
  };
});

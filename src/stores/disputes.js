// src/stores/disputes.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../services/api';

export const useDisputesStore = defineStore('disputes', () => {
  const disputes = ref([]);
  const currentDispute = ref(null);
  const loading = ref(false);
  const error = ref(null);

  async function fetchDisputes() {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.get('/disputes');
      disputes.value = res.data.disputes;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch disputes';
    } finally {
      loading.value = false;
    }
  }

  async function fetchDisputeById(id) {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.get(`/disputes/${id}`);
      currentDispute.value = res.data.dispute;
      return res.data.dispute;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch dispute';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createDispute(disputeData) {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.post('/disputes', disputeData);
      disputes.value.unshift(res.data.dispute);
      return res.data.dispute;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to create dispute';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchEligibleEscrows() {
    try {
      const res = await api.get('/disputes/eligible-escrows');
      return res.data.escrows;
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch eligible escrows';
      throw err;
    }
  }

  return {
    disputes,
    currentDispute,
    loading,
    error,
    fetchDisputes,
    fetchDisputeById,
    createDispute,
    fetchEligibleEscrows
  };
});

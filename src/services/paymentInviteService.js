// src/services/paymentInviteService.js
// Service layer for Payment Invite API calls
// Placeholder methods - swap with real API calls when backend is ready

import api from './api';

export const paymentInviteService = {
  /**
   * Create a new payment invite
   * @param {Object} payload - The payment invite data
   * @returns {Promise<Object>} The created payment invite
   */
  async create(payload) {
    // TODO: Replace with actual API call
    // return api.post('/payment-invites', payload);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: 'pi_' + Math.random().toString(36).substr(2, 9),
          ...payload,
          status: 'pending',
          createdAt: new Date().toISOString()
        });
      }, 500);
    });
  },

  /**
   * Get a payment invite by ID
   * @param {string} id - The payment invite ID
   * @returns {Promise<Object>} The payment invite
   */
  async getById(id) {
    // TODO: Replace with actual API call
    // return api.get(`/payment-invites/${id}`);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id,
          role: 'seller',
          transaction_name: 'Sample Transaction',
          escrow_fee_by: 'buyer',
          max_buyers: 1,
          buyer: { email: '', message: '', send_immediately: true },
          items: [],
          status: 'pending',
          createdAt: new Date().toISOString()
        });
      }, 500);
    });
  },

  /**
   * Update a payment invite
   * @param {string} id - The payment invite ID
   * @param {Object} payload - The fields to update
   * @returns {Promise<Object>} The updated payment invite
   */
  async update(id, payload) {
    // TODO: Replace with actual API call
    // return api.patch(`/payment-invites/${id}`, payload);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id,
          ...payload,
          updatedAt: new Date().toISOString()
        });
      }, 500);
    });
  }
};

export default paymentInviteService;

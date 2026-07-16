// src/composables/usePaymentInvite.js
import { ref, computed, reactive } from 'vue';

/**
 * Composable for managing Payment Invite wizard state
 */
export function usePaymentInvite() {
  const currentStep = ref(1);
  const totalSteps = 5;

  // Form state
  const form = reactive({
    role: null, // 'seller' | 'freelancer'
    transactionName: '',
    escrowFeeBy: 'buyer', // 'buyer' | 'seller' | 'split'
    maxBuyers: 1,
    items: [],
    buyerEmail: '',
    buyerMessage: '',
    sendImmediately: true,
  });

  // Add a default empty item
  const addItem = () => {
    form.items.push({
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
    });
  };

  // Remove an item by id
  const removeItem = (id) => {
    if (form.items.length > 1) {
      form.items = form.items.filter(item => item.id !== id);
    }
  };

  // Initialize with one empty item
  addItem();

  // Computed subtotal
  const subtotal = computed(() => {
    return form.items.reduce((acc, item) => {
      return acc + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
    }, 0);
  });

  // Grand total (same as subtotal for now, no tax/fees in this flow)
  const grandTotal = computed(() => subtotal.value);

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(value || 0);
  };

  // Completion percentage
  const completionPercentage = computed(() => {
    let completed = 0;

    // Step 1: Role selected
    if (form.role) completed++;

    // Step 2: Transaction name filled
    if (form.transactionName.trim()) completed++;

    // Step 3: At least one item with name and price
    const hasValidItems = form.items.some(item => item.name.trim() && Number(item.unitPrice) > 0);
    if (hasValidItems) completed++;

    // Step 4: Optional - always counts if we got here
    completed++;

    // Step 5: Review - always counts
    completed++;

    return Math.round((completed / totalSteps) * 100);
  });

  // Validation per step
  const validateStep = (step) => {
    const errors = [];

    switch (step) {
      case 1:
        if (!form.role) errors.push('Please select a role to continue.');
        break;
      case 2:
        if (!form.transactionName.trim()) errors.push('Transaction name is required.');
        if (form.maxBuyers < 1) errors.push('Minimum of 1 buyer required.');
        break;
      case 3:
        if (form.items.length === 0) errors.push('Add at least one item.');
        form.items.forEach((item, index) => {
          if (!item.name.trim()) errors.push(`Item ${index + 1}: Name is required.`);
          if (Number(item.unitPrice) <= 0) errors.push(`Item ${index + 1}: Unit price must be greater than 0.`);
          if (Number(item.quantity) < 1) errors.push(`Item ${index + 1}: Quantity must be at least 1.`);
        });
        break;
      case 4:
        // Optional step - no validation required
        break;
      case 5:
        // Review - no validation needed
        break;
    }

    return errors;
  };

  // Navigation
  const goToStep = (step) => {
    if (step >= 1 && step <= totalSteps) {
      currentStep.value = step;
    }
  };

  const nextStep = () => {
    if (currentStep.value < totalSteps) {
      currentStep.value++;
    }
  };

  const prevStep = () => {
    if (currentStep.value > 1) {
      currentStep.value--;
    }
  };

  // Build API payload
  const buildPayload = () => {
    return {
      role: form.role,
      transaction_name: form.transactionName,
      escrow_fee_by: form.escrowFeeBy,
      max_buyers: form.maxBuyers,
      buyer: {
        email: form.buyerEmail,
        message: form.buyerMessage,
        send_immediately: form.sendImmediately,
      },
      items: form.items.map(item => ({
        name: item.name,
        description: item.description,
        quantity: Number(item.quantity),
        unit_price: Number(item.unitPrice),
      })),
    };
  };

  // Reset form
  const resetForm = () => {
    currentStep.value = 1;
    form.role = null;
    form.transactionName = '';
    form.escrowFeeBy = 'buyer';
    form.maxBuyers = 1;
    form.items = [];
    form.buyerEmail = '';
    form.buyerMessage = '';
    form.sendImmediately = true;
    addItem();
  };

  return {
    currentStep,
    totalSteps,
    form,
    subtotal,
    grandTotal,
    formatCurrency,
    completionPercentage,
    addItem,
    removeItem,
    validateStep,
    goToStep,
    nextStep,
    prevStep,
    buildPayload,
    resetForm,
  };
}

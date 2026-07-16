<!-- src/views/payment-invite/PaymentInvitePage.vue -->
<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { usePaymentInvite } from '../../composables/usePaymentInvite';
import { paymentInviteService } from '../../services/paymentInviteService';
import PaymentInviteStepper from '../../components/payment-invite/PaymentInviteStepper.vue';
import RoleSelector from '../../components/payment-invite/RoleSelector.vue';
import DealDetailsForm from '../../components/payment-invite/DealDetailsForm.vue';
import ItemsForm from '../../components/payment-invite/ItemsForm.vue';
import BuyerInviteForm from '../../components/payment-invite/BuyerInviteForm.vue';
import ReviewSummary from '../../components/payment-invite/ReviewSummary.vue';
import { CheckCircle, XCircle } from '@lucide/vue';

const router = useRouter();
const {
  currentStep,
  totalSteps,
  form,
  subtotal,
  grandTotal,
  formatCurrency,
  addItem,
  removeItem,
  validateStep,
  nextStep,
  prevStep,
  buildPayload,
  resetForm,
} = usePaymentInvite();

const errors = ref([]);
const submitting = ref(false);
const submitted = ref(false);
const submitError = ref('');

const handleContinue = () => {
  errors.value = validateStep(currentStep.value);
  if (errors.value.length === 0) {
    nextStep();
  }
};

const handleBack = () => {
  errors.value = [];
  prevStep();
};

const handleSubmit = async () => {
  submitting.value = true;
  submitError.value = '';
  
  try {
    const payload = buildPayload();
    await paymentInviteService.create(payload);
    submitted.value = true;
  } catch (err) {
    submitError.value = err.response?.data?.message || 'Failed to create payment invite. Please try again.';
  } finally {
    submitting.value = false;
  }
};

const handleCreateAnother = () => {
  resetForm();
  submitted.value = false;
  errors.value = [];
  submitError.value = '';
};
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <!-- Success State -->
    <div v-if="submitted" class="text-center py-12">
      <div class="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
        <CheckCircle class="w-8 h-8 text-emerald-600" />
      </div>
      <h2 class="text-2xl font-bold text-slate-900 mb-2">Payment Invite Created!</h2>
      <p class="text-slate-500 mb-8">Your payment invite has been created successfully.</p>
      <div class="flex items-center justify-center gap-4">
        <button
          @click="handleCreateAnother"
          class="px-6 py-2.5 border border-slate-200 bg-white text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all duration-200 cursor-pointer"
        >
          Create Another
        </button>
        <button
          @click="router.push('/payment-invites')"
          class="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 cursor-pointer"
        >
          View All Invites
        </button>
      </div>
    </div>

    <!-- Wizard -->
    <div v-else>
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-slate-900">Create Payment Invite</h1>
        <p class="text-sm text-slate-500 mt-1">Select your role for this escrow transaction.</p>
      </div>

      <!-- Main Card -->
      <div class="bg-white rounded-[20px] shadow-sm border border-slate-100 p-8">
        <!-- Stepper -->
        <div class="mb-10">
          <PaymentInviteStepper :current-step="currentStep" :total-steps="totalSteps" />
        </div>

        <!-- Step Content with Transition -->
        <div class="min-h-[400px]">
          <!-- Step 1: Role -->
          <div v-show="currentStep === 1">
            <div class="mb-6">
              <h2 class="text-lg font-bold text-slate-900">Select Your Role</h2>
              <p class="text-sm text-slate-500 mt-1">Choose how you want to participate in this escrow transaction.</p>
            </div>
            <RoleSelector v-model="form.role" />
            
            <!-- Error -->
            <div v-if="errors.length > 0" class="mt-4 p-3.5 bg-red-50 border border-red-100 rounded-xl">
              <p v-for="(err, i) in errors" :key="i" class="text-xs font-semibold text-red-600">{{ err }}</p>
            </div>

            <!-- Continue Button -->
            <div class="flex justify-end mt-8 pt-6 border-t border-slate-100">
              <button
                @click="handleContinue"
                :disabled="!form.role"
                class="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Step 2: Deal Details -->
          <div v-show="currentStep === 2">
            <div class="mb-6">
              <h2 class="text-lg font-bold text-slate-900">Deal Details</h2>
              <p class="text-sm text-slate-500 mt-1">Enter the basic information about this transaction.</p>
            </div>
            <DealDetailsForm
              :transaction-name="form.transactionName"
              :escrow-fee-by="form.escrowFeeBy"
              :max-buyers="form.maxBuyers"
              :errors="errors"
              @update:transactionName="form.transactionName = $event"
              @update:escrowFeeBy="form.escrowFeeBy = $event"
              @update:maxBuyers="form.maxBuyers = $event"
              @back="handleBack"
              @continue="handleContinue"
            />
          </div>

          <!-- Step 3: Items -->
          <div v-show="currentStep === 3">
            <div class="mb-6">
              <h2 class="text-lg font-bold text-slate-900">Items</h2>
              <p class="text-sm text-slate-500 mt-1">Add the items or services included in this transaction.</p>
            </div>
            <ItemsForm
              :items="form.items"
              :errors="errors"
              :format-currency="formatCurrency"
              @update:items="form.items = $event"
              @back="handleBack"
              @continue="handleContinue"
            />
          </div>

          <!-- Step 4: Invite Buyer -->
          <div v-show="currentStep === 4">
            <div class="mb-6">
              <h2 class="text-lg font-bold text-slate-900">Invite Buyer</h2>
              <p class="text-sm text-slate-500 mt-1">Optionally invite a buyer to this transaction.</p>
            </div>
            <BuyerInviteForm
              :buyer-email="form.buyerEmail"
              :buyer-message="form.buyerMessage"
              :send-immediately="form.sendImmediately"
              @update:buyerEmail="form.buyerEmail = $event"
              @update:buyerMessage="form.buyerMessage = $event"
              @update:sendImmediately="form.sendImmediately = $event"
              @back="handleBack"
              @continue="handleContinue"
            />
          </div>

          <!-- Step 5: Review -->
          <div v-show="currentStep === 5">
            <div class="mb-6">
              <h2 class="text-lg font-bold text-slate-900">Review & Submit</h2>
              <p class="text-sm text-slate-500 mt-1">Review all the details before creating the payment invite.</p>
            </div>
            
            <!-- Error Banner -->
            <div v-if="submitError" class="mb-4 p-3.5 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2">
              <XCircle class="w-4 h-4 text-red-500 shrink-0" />
              <p class="text-xs font-semibold text-red-600">{{ submitError }}</p>
            </div>

            <ReviewSummary
              :form="form"
              :subtotal="subtotal"
              :grand-total="grandTotal"
              :format-currency="formatCurrency"
              :submitting="submitting"
              @back="handleBack"
              @submit="handleSubmit"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

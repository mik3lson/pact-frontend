<!-- src/components/payment-invite/DealDetailsForm.vue -->
<script setup>
import { computed } from 'vue';
import { ArrowLeft, ArrowRight } from '@lucide/vue';

const props = defineProps({
  transactionName: { type: String, default: '' },
  escrowFeeBy: { type: String, default: 'buyer' },
  maxBuyers: { type: Number, default: 1 },
  errors: { type: Array, default: () => [] },
});

const emit = defineEmits([
  'update:transactionName',
  'update:escrowFeeBy',
  'update:maxBuyers',
  'back',
  'continue',
]);

const feeOptions = [
  { value: 'buyer', label: 'Buyer' },
  { value: 'seller', label: 'Seller' },
  { value: 'split', label: 'Split equally' },
];

const errorMap = computed(() => {
  const map = {};
  props.errors.forEach(err => {
    if (err.toLowerCase().includes('transaction name')) map.transactionName = err;
    if (err.toLowerCase().includes('buyer')) map.maxBuyers = err;
  });
  return map;
});
</script>

<template>
  <div class="space-y-6">
    <!-- Transaction Name -->
    <div class="space-y-1.5">
      <label class="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
        Transaction Name <span class="text-red-500">*</span>
      </label>
      <input
        :value="transactionName"
        @input="emit('update:transactionName', $event.target.value)"
        type="text"
        placeholder="e.g. Website Development Project"
        class="block w-full rounded-xl border px-4 py-3 text-sm transition-all duration-200 outline-none bg-slate-50/50 hover:bg-slate-50 focus:bg-white"
        :class="errorMap.transactionName ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'"
      />
      <p v-if="errorMap.transactionName" class="text-xs text-red-500 font-medium">{{ errorMap.transactionName }}</p>
    </div>

    <!-- Escrow Fee Paid By -->
    <div class="space-y-1.5">
      <label class="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
        Escrow Fee Paid By
      </label>
      <div class="relative">
        <select
          :value="escrowFeeBy"
          @change="emit('update:escrowFeeBy', $event.target.value)"
          class="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all duration-200 outline-none bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 appearance-none cursor-pointer"
        >
          <option v-for="opt in feeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <div class="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Maximum Buyers -->
    <div class="space-y-1.5">
      <label class="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
        Maximum Buyers
      </label>
      <input
        :value="maxBuyers"
        @input="emit('update:maxBuyers', Number($event.target.value) || 1)"
        type="number"
        min="1"
        class="block w-full rounded-xl border px-4 py-3 text-sm transition-all duration-200 outline-none bg-slate-50/50 hover:bg-slate-50 focus:bg-white"
        :class="errorMap.maxBuyers ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'"
      />
      <p v-if="errorMap.maxBuyers" class="text-xs text-red-500 font-medium">{{ errorMap.maxBuyers }}</p>
    </div>

    <!-- Navigation Buttons -->
    <div class="flex items-center justify-between pt-4 border-t border-slate-100">
      <button
        @click="emit('back')"
        class="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-200 bg-white text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all duration-200 cursor-pointer"
      >
        <ArrowLeft class="w-4 h-4" />
        Back
      </button>
      <button
        @click="emit('continue')"
        class="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 active:scale-[0.98] cursor-pointer"
      >
        Continue
        <ArrowRight class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

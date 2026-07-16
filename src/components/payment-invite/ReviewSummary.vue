<!-- src/components/payment-invite/ReviewSummary.vue -->
<script setup>
import { computed } from 'vue';
import { ArrowLeft, Store, Handshake, CheckCircle, Loader2 } from '@lucide/vue';

const props = defineProps({
  form: { type: Object, required: true },
  subtotal: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  formatCurrency: { type: Function, default: (v) => `₦${v}` },
  submitting: { type: Boolean, default: false },
});

const emit = defineEmits(['back', 'submit']);

const roleLabel = computed(() => {
  return props.form.role === 'seller' ? 'Seller' : 'Broker';
});

const feeLabel = computed(() => {
  const map = { buyer: 'Buyer', seller: 'Seller', split: 'Split equally' };
  return map[props.form.escrowFeeBy] || 'Buyer';
});
</script>

<template>
  <div class="space-y-6">
    <!-- Summary Sections -->
    <div class="space-y-4">
      <!-- Role -->
      <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center">
            <component :is="form.role === 'seller' ? Store : Handshake" class="w-5 h-5" />
          </div>
          <div>
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</p>
            <p class="text-sm font-bold text-slate-800">{{ roleLabel }}</p>
          </div>
        </div>
      </div>

      <!-- Deal Details -->
      <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100">
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Deal Details</p>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p class="text-[10px] font-semibold text-slate-400 uppercase">Transaction Name</p>
            <p class="text-sm font-semibold text-slate-800 mt-0.5">{{ form.transactionName || '—' }}</p>
          </div>
          <div>
            <p class="text-[10px] font-semibold text-slate-400 uppercase">Escrow Fee</p>
            <p class="text-sm font-semibold text-slate-800 mt-0.5">{{ feeLabel }}</p>
          </div>
          <div>
            <p class="text-[10px] font-semibold text-slate-400 uppercase">Max Buyers</p>
            <p class="text-sm font-semibold text-slate-800 mt-0.5">{{ form.maxBuyers }}</p>
          </div>
        </div>
      </div>

      <!-- Buyer Info -->
      <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100">
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Buyer</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p class="text-[10px] font-semibold text-slate-400 uppercase">Email</p>
            <p class="text-sm font-semibold text-slate-800 mt-0.5">{{ form.buyerEmail || 'Not provided' }}</p>
          </div>
          <div>
            <p class="text-[10px] font-semibold text-slate-400 uppercase">Send Immediately</p>
            <p class="text-sm font-semibold text-slate-800 mt-0.5">{{ form.sendImmediately ? 'Yes' : 'No' }}</p>
          </div>
        </div>
        <div v-if="form.buyerMessage" class="mt-3">
          <p class="text-[10px] font-semibold text-slate-400 uppercase">Message</p>
          <p class="text-sm text-slate-600 mt-0.5">{{ form.buyerMessage }}</p>
        </div>
      </div>

      <!-- Items Table -->
      <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100">
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Items</p>
        
        <!-- Table Header -->
        <div class="hidden sm:grid grid-cols-12 gap-3 pb-2 border-b border-slate-200 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          <div class="col-span-4">Item</div>
          <div class="col-span-2 text-center">Qty</div>
          <div class="col-span-3 text-right">Unit Price</div>
          <div class="col-span-3 text-right">Total</div>
        </div>

        <!-- Table Rows -->
        <div
          v-for="(item, index) in form.items"
          :key="item.id"
          class="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 py-3 border-b border-slate-100 last:border-0"
        >
          <div class="sm:col-span-4">
            <span class="sm:hidden text-[10px] font-semibold text-slate-400 uppercase block mb-0.5">Item</span>
            <p class="text-sm font-semibold text-slate-800">{{ item.name || '—' }}</p>
            <p v-if="item.description" class="text-xs text-slate-500">{{ item.description }}</p>
          </div>
          <div class="sm:col-span-2 sm:text-center">
            <span class="sm:hidden text-[10px] font-semibold text-slate-400 uppercase block mb-0.5">Qty</span>
            <p class="text-sm text-slate-700">{{ item.quantity }}</p>
          </div>
          <div class="sm:col-span-3 sm:text-right">
            <span class="sm:hidden text-[10px] font-semibold text-slate-400 uppercase block mb-0.5">Unit Price</span>
            <p class="text-sm text-slate-700">{{ formatCurrency(item.unitPrice) }}</p>
          </div>
          <div class="sm:col-span-3 sm:text-right">
            <span class="sm:hidden text-[10px] font-semibold text-slate-400 uppercase block mb-0.5">Total</span>
            <p class="text-sm font-bold text-slate-800">{{ formatCurrency((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)) }}</p>
          </div>
        </div>

        <!-- Grand Total -->
        <div class="flex justify-end pt-3 mt-2 border-t border-slate-200">
          <div class="text-right">
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Grand Total</p>
            <p class="text-xl font-bold text-slate-900">{{ formatCurrency(grandTotal) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Buttons -->
    <div class="flex items-center justify-between pt-2 border-t border-slate-100">
      <button
        @click="emit('back')"
        :disabled="submitting"
        class="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-200 bg-white text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all duration-200 cursor-pointer disabled:opacity-50"
      >
        <ArrowLeft class="w-4 h-4" />
        Back
      </button>
      <button
        @click="emit('submit')"
        :disabled="submitting"
        class="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-50"
      >
        <Loader2 v-if="submitting" class="w-4 h-4 animate-spin" />
        <CheckCircle v-else class="w-4 h-4" />
        {{ submitting ? 'Creating...' : 'Create Payment Invite' }}
      </button>
    </div>
  </div>
</template>

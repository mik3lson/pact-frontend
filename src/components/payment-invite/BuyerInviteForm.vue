<!-- src/components/payment-invite/BuyerInviteForm.vue -->
<script setup>
import { ArrowLeft, ArrowRight, Mail, MessageSquare } from '@lucide/vue';

const props = defineProps({
  buyerEmail: { type: String, default: '' },
  buyerMessage: { type: String, default: '' },
  sendImmediately: { type: Boolean, default: true },
});

const emit = defineEmits([
  'update:buyerEmail',
  'update:buyerMessage',
  'update:sendImmediately',
  'back',
  'continue',
]);
</script>

<template>
  <div class="space-y-6">
    <!-- Info Text -->
    <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100">
      <p class="text-sm text-slate-600">
        This step is optional. You can send an invite to a buyer now, or create the invite without sending an email.
      </p>
    </div>

    <!-- Buyer Email -->
    <div class="space-y-1.5">
      <label class="block text-xs font-semibold text-slate-700 tracking-wide uppercase">Buyer Email</label>
      <div class="relative">
        <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Mail class="w-4 h-4" />
        </div>
        <input
          :value="buyerEmail"
          @input="emit('update:buyerEmail', $event.target.value)"
          type="email"
          placeholder="buyer@example.com"
          class="block w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3 text-sm transition-all duration-200 outline-none bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
      </div>
    </div>

    <!-- Message -->
    <div class="space-y-1.5">
      <label class="block text-xs font-semibold text-slate-700 tracking-wide uppercase">Message</label>
      <div class="relative">
        <div class="absolute top-3 left-3.5 pointer-events-none text-slate-400">
          <MessageSquare class="w-4 h-4" />
        </div>
        <textarea
          :value="buyerMessage"
          @input="emit('update:buyerMessage', $event.target.value)"
          rows="4"
          placeholder="Add a personal message to the buyer..."
          class="block w-full rounded-xl border border-slate-200 pl-10 pr-4 py-3 text-sm transition-all duration-200 outline-none bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none"
        ></textarea>
      </div>
    </div>

    <!-- Send Immediately Checkbox -->
    <label class="flex items-center gap-3 cursor-pointer group">
      <div
        @click="emit('update:sendImmediately', !sendImmediately)"
        class="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200"
        :class="{
          'bg-brand-500 border-brand-500': sendImmediately,
          'border-slate-300 bg-white group-hover:border-slate-400': !sendImmediately,
        }"
      >
        <svg v-if="sendImmediately" class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <span class="text-sm font-medium text-slate-700">Send invite immediately</span>
        <p class="text-xs text-slate-500">If unchecked, the invite will be created without sending an email.</p>
      </div>
    </label>

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

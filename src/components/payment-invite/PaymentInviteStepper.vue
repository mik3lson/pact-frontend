<!-- src/components/payment-invite/PaymentInviteStepper.vue -->
<script setup>
import { computed } from 'vue';
import { Check } from '@lucide/vue';

const props = defineProps({
  currentStep: { type: Number, required: true },
  totalSteps: { type: Number, default: 5 },
});

const steps = [
  { number: 1, title: 'Role', subtitle: 'Select your role' },
  { number: 2, title: 'Deal Details', subtitle: 'Transaction info' },
  { number: 3, title: 'Items', subtitle: 'Add items' },
  { number: 4, title: 'Invite Buyer', subtitle: 'Optional' },
  { number: 5, title: 'Review', subtitle: 'Confirm & submit' },
];

const getStepState = (step) => {
  if (step.number < props.currentStep) return 'completed';
  if (step.number === props.currentStep) return 'active';
  return 'upcoming';
};
</script>

<template>
  <div class="w-full">
    <div class="flex items-center justify-between">
      <div
        v-for="(step, index) in steps"
        :key="step.number"
        class="flex items-center"
        :class="{ 'flex-1': index < steps.length - 1 }"
      >
        <!-- Step Indicator -->
        <div class="flex flex-col items-center">
          <!-- Circle -->
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300"
            :class="{
              'bg-brand-500 text-white shadow-sm shadow-brand-200': getStepState(step) === 'active',
              'bg-emerald-50 text-emerald-600 border border-emerald-200': getStepState(step) === 'completed',
              'bg-slate-50 text-slate-400 border border-slate-200': getStepState(step) === 'upcoming',
            }"
          >
            <Check v-if="getStepState(step) === 'completed'" class="w-5 h-5" />
            <span v-else>{{ step.number }}</span>
          </div>
          <!-- Label -->
          <div class="mt-2 text-center">
            <p
              class="text-xs font-semibold transition-colors duration-200"
              :class="{
                'text-brand-600': getStepState(step) === 'active',
                'text-emerald-600': getStepState(step) === 'completed',
                'text-slate-400': getStepState(step) === 'upcoming',
              }"
            >
              {{ step.title }}
            </p>
            <p class="text-[10px] text-slate-400 mt-0.5 hidden sm:block">{{ step.subtitle }}</p>
          </div>
        </div>

        <!-- Connector Line -->
        <div
          v-if="index < steps.length - 1"
          class="flex-1 mx-4 mb-6"
        >
          <div
            class="h-0.5 rounded-full transition-all duration-500"
            :class="{
              'bg-emerald-400': getStepState(step) === 'completed',
              'bg-slate-200': getStepState(step) !== 'completed',
            }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

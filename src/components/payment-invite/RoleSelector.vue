<!-- src/components/payment-invite/RoleSelector.vue -->
<script setup>
import { Store, Briefcase } from '@lucide/vue';

const props = defineProps({
  modelValue: { type: String, default: null },
});

const emit = defineEmits(['update:modelValue']);

const roles = [
  {
    id: 'seller',
    icon: Store,
    title: 'As Seller',
    description: 'Create an escrow to sell your own product or service.',
  },
  {
    id: 'freelancer',
    icon: Briefcase,
    title: 'As Freelancer',
    description: 'Create an escrow for your freelance work or services.',
  },
];

const selectRole = (roleId) => {
  emit('update:modelValue', roleId);
};
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
    <div
      v-for="role in roles"
      :key="role.id"
      @click="selectRole(role.id)"
      class="relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md"
      :class="{
        'border-brand-500 bg-brand-50/40 shadow-sm': modelValue === role.id,
        'border-slate-200 bg-white hover:border-slate-300': modelValue !== role.id,
      }"
    >
      <!-- Selected indicator -->
      <div
        v-if="modelValue === role.id"
        class="absolute top-3 right-3 w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center"
      >
        <svg class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <!-- Icon -->
      <div
        class="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        :class="{
          'bg-brand-100 text-brand-600': modelValue === role.id,
          'bg-slate-50 text-slate-400': modelValue !== role.id,
        }"
      >
        <component :is="role.icon" class="w-6 h-6" />
      </div>

      <!-- Text -->
      <h3
        class="text-base font-bold mb-1"
        :class="{
          'text-brand-700': modelValue === role.id,
          'text-slate-800': modelValue !== role.id,
        }"
      >
        {{ role.title }}
      </h3>
      <p class="text-sm text-slate-500 leading-relaxed">{{ role.description }}</p>
    </div>
  </div>
</template>

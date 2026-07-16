<!-- src/components/ui/PactBadge.vue -->
<script setup>
import { computed } from 'vue';

const props = defineProps({
  status: {
    type: String,
    required: true,
  }
});

const statusMap = computed(() => {
  const norm = props.status.toLowerCase();
  
  switch (norm) {
    // Success statuses
    case 'funded':
    case 'approved':
    case 'released':
    case 'paid':
    case 'verified':
    case 'completed':
    case 'success':
      return {
        bg: 'bg-emerald-50 border border-emerald-100',
        text: 'text-emerald-700',
      };
      
    // Warning/Neutral pending statuses
    case 'pending':
    case 'sent':
    case 'draft':
    case 'warning':
      return {
        bg: 'bg-amber-50 border border-amber-100',
        text: 'text-amber-700',
      };
      
    // Danger / Conflict statuses
    case 'disputed':
    case 'overdue':
    case 'cancelled':
    case 'failed':
    case 'danger':
      return {
        bg: 'bg-red-50 border border-red-100',
        text: 'text-red-700',
      };
      
    // Active / Ongoing / Info statuses
    case 'active':
    case 'submitted':
    case 'pending verification':
    case 'info':
    default:
      return {
        bg: 'bg-indigo-50 border border-indigo-100',
        text: 'text-indigo-700',
      };
  }
});
</script>

<template>
  <span
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
    :class="[statusMap.bg, statusMap.text]"
  >
    <slot>{{ status }}</slot>
  </span>
</template>

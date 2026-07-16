<!-- src/components/ui/PactCard.vue -->
<script setup>
defineProps({
  hoverable: {
    type: Boolean,
    default: false,
  },
  padding: {
    type: String,
    default: 'p-6',
  }
});
</script>

<template>
  <div
    class="max-w-md bg-white rounded-2xl border border-slate-100 shadow-premium transition-all duration-200"
    :class="[
      padding,
      hoverable ? 'hover:shadow-premium-lg hover:border-slate-200/80 hover:-translate-y-0.5' : ''
    ]"
  >
    <div v-if="$slots.header" class="border-b border-slate-50 pb-4 mb-4">
      <slot name="header" />
    </div>
    
    <div>
      <slot />
    </div>

    <div v-if="$slots.footer" class="border-t border-slate-50 pt-4 mt-4 flex items-center justify-end">
      <slot name="footer" />
    </div>
  </div>
</template>

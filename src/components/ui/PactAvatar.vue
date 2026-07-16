<!-- src/components/ui/PactAvatar.vue -->
<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  src: {
    type: String,
    default: '',
  },
  name: {
    type: String,
    default: 'User',
  },
  size: {
    type: String,
    default: 'md', // 'sm' | 'md' | 'lg' | 'xl'
  }
});

const imageError = ref(false);

const initials = computed(() => {
  if (!props.name) return 'U';
  const parts = props.name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return props.name[0].toUpperCase();
});

const sizes = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base font-semibold',
  xl: 'h-20 w-20 text-xl font-bold',
};

const bgColors = [
  'bg-emerald-500 text-white',
  'bg-indigo-500 text-white',
  'bg-blue-500 text-white',
  'bg-amber-500 text-white',
  'bg-red-500 text-white',
  'bg-purple-500 text-white'
];

const fallbackBg = computed(() => {
  // Semi-random deterministic color based on name
  let hash = 0;
  for (let i = 0; i < props.name.length; i++) {
    hash = props.name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % bgColors.length;
  return bgColors[index];
});
</script>

<template>
  <div
    class="relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 select-none border border-slate-100 bg-slate-50"
    :class="[sizes[size]]"
  >
    <img
      v-if="src && !imageError"
      :src="src"
      :alt="name"
      class="h-full w-full object-cover"
      @error="imageError = true"
    />
    
    <span
      v-else
      class="flex h-full w-full items-center justify-center tracking-wider"
      :class="[fallbackBg]"
    >
      {{ initials }}
    </span>
  </div>
</template>

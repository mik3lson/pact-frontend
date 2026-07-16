<!-- src/components/ui/PactModal.vue -->
<script setup>
import { onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
  maxWidth: {
    type: String,
    default: 'max-w-md', // 'max-w-sm' | 'max-w-md' | 'max-w-lg' | 'max-w-2xl'
  }
});

const emit = defineEmits(['close']);

const close = () => {
  emit('close');
};

const handleEscape = (e) => {
  if (e.key === 'Escape' && props.show) {
    close();
  }
};

watch(() => props.show, (newVal) => {
  if (newVal) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

onMounted(() => {
  document.addEventListener('keydown', handleEscape);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape);
  document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop overlay -->
    <Transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity"
        @click="close"
      ></div>
    </Transition>

    <!-- Modal dialogue box -->
    <Transition name="slide-fade">
      <div
        v-if="show"
        class="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          class="bg-white rounded-2xl shadow-premium-lg border border-slate-100 w-full pointer-events-auto transform overflow-hidden transition-all duration-300"
          :class="[maxWidth]"
        >
          <!-- Modal Header -->
          <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 class="text-base font-semibold text-slate-900 tracking-tight">
              {{ title }}
            </h3>
            <button
              @click="close"
              class="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-slate-100 transition-all duration-200 cursor-pointer"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="px-6 py-5 overflow-y-auto max-h-[75vh]">
            <slot />
          </div>

          <!-- Modal Footer -->
          <div v-if="$slots.footer" class="px-6 py-4 border-t border-slate-50 bg-slate-50/20 flex items-center justify-end gap-3">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<!-- src/components/ui/PactInput.vue -->
<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'text', // 'text' | 'password' | 'email' | 'number' | 'date' | 'textarea'
  },
  placeholder: {
    type: String,
    default: '',
  },
  error: {
    type: String,
    default: '',
  },
  required: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  rows: {
    type: Number,
    default: 3,
  }
});

const emit = defineEmits(['update:modelValue', 'blur', 'focus']);

const inputClasses = computed(() => {
  return [
    'block w-full rounded-xl border px-4 py-3 text-sm transition-all duration-200 outline-none bg-slate-50/50 hover:bg-slate-50 focus:bg-white',
    props.error
      ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500'
      : 'border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500',
    props.disabled ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''
  ].join(' ');
});
</script>

<template>
  <div class="space-y-1.5 w-full">
    <label
      v-if="label"
      class="block text-xs font-semibold text-slate-700 tracking-wide uppercase"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    
    <div class="relative rounded-xl">
      <!-- Slot for Icon Prefix -->
      <div
        v-if="$slots.prefix"
        class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"
      >
        <slot name="prefix" />
      </div>

      <!-- Textarea mode -->
      <textarea
        v-if="type === 'textarea'"
        :value="modelValue"
        @input="emit('update:modelValue', $event.target.value)"
        @blur="emit('blur', $event)"
        @focus="emit('focus', $event)"
        :placeholder="placeholder"
        :disabled="disabled"
        :rows="rows"
        :class="[inputClasses, $slots.prefix ? 'pl-10' : '']"
      ></textarea>

      <!-- Standard inputs -->
      <input
        v-else
        :type="type"
        :value="modelValue"
        @input="emit('update:modelValue', $event.target.value)"
        @blur="emit('blur', $event)"
        @focus="emit('focus', $event)"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="[inputClasses, $slots.prefix ? 'pl-10' : '']"
      />

      <!-- Slot for Icon Suffix -->
      <div
        v-if="$slots.suffix"
        class="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400"
      >
        <slot name="suffix" />
      </div>
    </div>

    <!-- Error message text -->
    <p v-if="error" class="text-xs text-red-500 font-medium">
      {{ error }}
    </p>
  </div>
</template>

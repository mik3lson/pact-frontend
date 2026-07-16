<!-- src/components/payment-invite/ItemsForm.vue -->
<script setup>
import { computed } from 'vue';
import { ArrowLeft, ArrowRight, Plus, Trash2 } from '@lucide/vue';

const props = defineProps({
  items: { type: Array, default: () => [] },
  errors: { type: Array, default: () => [] },
  formatCurrency: { type: Function, default: (v) => `₦${v}` },
});

const emit = defineEmits(['update:items', 'back', 'continue']);

const subtotal = computed(() => {
  return props.items.reduce((acc, item) => {
    return acc + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
  }, 0);
});

const updateItem = (id, field, value) => {
  const updated = props.items.map(item => {
    if (item.id === id) {
      const newItem = { ...item, [field]: value };
      return newItem;
    }
    return item;
  });
  emit('update:items', updated);
};

const addItem = () => {
  const newItem = {
    id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    name: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
  };
  emit('update:items', [...props.items, newItem]);
};

const removeItem = (id) => {
  if (props.items.length > 1) {
    emit('update:items', props.items.filter(item => item.id !== id));
  }
};

const errorMap = computed(() => {
  const map = {};
  props.errors.forEach(err => {
    const match = err.match(/Item (\d+):/);
    if (match) {
      const idx = parseInt(match[1]) - 1;
      if (!map[idx]) map[idx] = [];
      map[idx].push(err.replace(/Item \d+: /, ''));
    }
  });
  return map;
});
</script>

<template>
  <div class="space-y-5">
    <!-- Items List -->
    <div v-for="(item, index) in items" :key="item.id" class="p-5 rounded-2xl border border-slate-200 bg-white space-y-4">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Item {{ index + 1 }}</span>
        <button
          v-if="items.length > 1"
          @click="removeItem(item.id)"
          class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>

      <!-- Item Name -->
      <div class="space-y-1.5">
        <label class="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
          Item Name <span class="text-red-500">*</span>
        </label>
        <input
          :value="item.name"
          @input="updateItem(item.id, 'name', $event.target.value)"
          type="text"
          placeholder="e.g. Logo Design"
          class="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all duration-200 outline-none bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
        <p v-if="errorMap[index]?.some(e => e.toLowerCase().includes('name'))" class="text-xs text-red-500 font-medium">Name is required.</p>
      </div>

      <!-- Description -->
      <div class="space-y-1.5">
        <label class="block text-xs font-semibold text-slate-700 tracking-wide uppercase">Description</label>
        <input
          :value="item.description"
          @input="updateItem(item.id, 'description', $event.target.value)"
          type="text"
          placeholder="Brief description of the item"
          class="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all duration-200 outline-none bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <!-- Quantity & Unit Price Row -->
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-700 tracking-wide uppercase">Quantity <span class="text-red-500">*</span></label>
          <input
            :value="item.quantity"
            @input="updateItem(item.id, 'quantity', Number($event.target.value) || 0)"
            type="number"
            min="1"
            class="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-all duration-200 outline-none bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
          <p v-if="errorMap[index]?.some(e => e.toLowerCase().includes('quantity'))" class="text-xs text-red-500 font-medium">Quantity must be at least 1.</p>
        </div>
        <div class="space-y-1.5">
          <label class="block text-xs font-semibold text-slate-700 tracking-wide uppercase">Unit Price <span class="text-red-500">*</span></label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm font-medium">₦</div>
            <input
              :value="item.unitPrice"
              @input="updateItem(item.id, 'unitPrice', Number($event.target.value) || 0)"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              class="block w-full rounded-xl border border-slate-200 pl-8 pr-4 py-3 text-sm transition-all duration-200 outline-none bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <p v-if="errorMap[index]?.some(e => e.toLowerCase().includes('price'))" class="text-xs text-red-500 font-medium">Unit price must be greater than 0.</p>
        </div>
      </div>

      <!-- Item Total -->
      <div class="flex justify-end pt-2">
        <div class="text-right">
          <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Item Total</p>
          <p class="text-sm font-bold text-slate-800">{{ formatCurrency((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)) }}</p>
        </div>
      </div>
    </div>

    <!-- Add Item Button -->
    <button
      @click="addItem"
      class="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-sm font-semibold text-slate-500 hover:border-brand-300 hover:text-brand-500 hover:bg-brand-50/30 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
    >
      <Plus class="w-4 h-4" />
      Add Item
    </button>

    <!-- Subtotal -->
    <div class="flex justify-end pt-2 pb-4 border-b border-slate-100">
      <div class="text-right">
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Subtotal</p>
        <p class="text-xl font-bold text-slate-900">{{ formatCurrency(subtotal) }}</p>
      </div>
    </div>

    <!-- Navigation Buttons -->
    <div class="flex items-center justify-between pt-2">
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

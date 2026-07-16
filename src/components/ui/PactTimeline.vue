<!-- src/components/ui/PactTimeline.vue -->
<script setup>
import { Check, Clock, AlertTriangle, Send } from 'lucide-vue-next';

defineProps({
  items: {
    type: Array,
    required: true,
    // Expected structure: { id, title, subtitle, date, status, amount }
  }
});
</script>

<template>
  <div class="flow-root">
    <ul role="list" class="-mb-8">
      <li v-for="(item, idx) in items" :key="item.id">
        <div class="relative pb-8">
          <!-- Connector line -->
          <span
            v-if="idx !== items.length - 1"
            class="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200"
            aria-hidden="true"
          ></span>
          
          <div class="relative flex space-x-3">
            <div>
              <!-- Icon bubble depending on status -->
              <span
                class="h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white"
                :class="[
                  item.status === 'Released' || item.status === 'Approved' || item.status === 'completed'
                    ? 'bg-emerald-500 text-white'
                    : item.status === 'Submitted'
                    ? 'bg-indigo-500 text-white'
                    : item.status === 'Disputed' || item.status === 'failed'
                    ? 'bg-red-500 text-white'
                    : 'bg-amber-100 text-amber-600'
                ]"
              >
                <Check v-if="item.status === 'Released' || item.status === 'Approved' || item.status === 'completed'" class="w-4 h-4" />
                <Send v-else-if="item.status === 'Submitted'" class="w-4 h-4" />
                <AlertTriangle v-else-if="item.status === 'Disputed' || item.status === 'failed'" class="w-4 h-4" />
                <Clock v-else class="w-4 h-4" />
              </span>
            </div>
            
            <div class="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
              <div>
                <p class="text-sm font-medium text-slate-800">
                  {{ item.title }}
                </p>
                <p v-if="item.subtitle" class="text-xs text-slate-500 mt-0.5">
                  {{ item.subtitle }}
                </p>
                <div v-if="item.amount" class="mt-1.5">
                  <span class="text-xs font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                    ${{ item.amount.toLocaleString() }}
                  </span>
                </div>
              </div>
              
              <div class="text-right text-xs whitespace-nowrap text-slate-500">
                <time :datetime="item.date">{{ item.date }}</time>
                <div class="mt-1">
                  <slot name="actions" :item="item" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

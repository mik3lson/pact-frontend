<!-- src/views/transactions/Transactions.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useContractsStore } from '../../stores/contracts';
import PactCard from '../../components/ui/PactCard.vue';
import PactBadge from '../../components/ui/PactBadge.vue';
import PactInput from '../../components/ui/PactInput.vue';
import PactButton from '../../components/ui/PactButton.vue';
import { 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Inbox,
  ArrowLeftRight
} from '@lucide/vue';

const contractsStore = useContractsStore();

const searchQuery = ref('');
const activeFilter = ref('All');
const currentPage = ref(1);
const itemsPerPage = 10;
const loading = ref(false);

const filters = ['All', 'Deposit', 'Withdrawal', 'Escrow Release', 'Inflow', 'Outflow'];

onMounted(async () => {
  loading.value = true;
  await contractsStore.fetchTransactions();
  loading.value = false;
});

const filteredTransactions = computed(() => {
  let list = contractsStore.transactions || [];

  if (activeFilter.value !== 'All') {
    list = list.filter(tx => tx.type.toLowerCase() === activeFilter.value.toLowerCase());
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(tx => 
      tx.description.toLowerCase().includes(q) ||
      tx.id.toLowerCase().includes(q) ||
      tx.type.toLowerCase().includes(q)
    );
  }

  return list;
});

const totalPages = computed(() => {
  return Math.ceil(filteredTransactions.value.length / itemsPerPage) || 1;
});

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredTransactions.value.slice(start, start + itemsPerPage);
});

const handlePageChange = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const isOutgoing = (type) => {
  return ['Withdrawal', 'Outflow', 'Escrow Hold'].includes(type);
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-xl font-bold text-slate-900 tracking-tight">Transactions</h2>
      <p class="text-xs text-slate-500 mt-0.5">View all your financial activity — payments you've made and payments you've received</p>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <PactCard padding="p-6">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <ArrowDownLeft class="w-5 h-5" />
          </div>
          <div>
            <p class="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Total Received</p>
            <p class="text-xl font-extrabold text-slate-900">
              ${{ (contractsStore.transactions?.filter(tx => !isOutgoing(tx.type) && tx.status === 'Completed').reduce((sum, tx) => sum + tx.amount, 0) || 0).toLocaleString() }}
            </p>
          </div>
        </div>
      </PactCard>

      <PactCard padding="p-6">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-red-50 text-red-600">
            <ArrowUpRight class="w-5 h-5" />
          </div>
          <div>
            <p class="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Total Sent</p>
            <p class="text-xl font-extrabold text-slate-900">
              ${{ (contractsStore.transactions?.filter(tx => isOutgoing(tx.type) && tx.status === 'Completed').reduce((sum, tx) => sum + tx.amount, 0) || 0).toLocaleString() }}
            </p>
          </div>
        </div>
      </PactCard>

      <PactCard padding="p-6">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <ArrowLeftRight class="w-5 h-5" />
          </div>
          <div>
            <p class="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Total Transactions</p>
            <p class="text-xl font-extrabold text-slate-900">{{ (contractsStore.transactions?.length || 0) }}</p>
          </div>
        </div>
      </PactCard>
    </div>

    <!-- Filters & Search -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-premium">
      <div class="w-full lg:w-72">
        <PactInput
          v-model="searchQuery"
          placeholder="Search transactions..."
          type="text"
        >
          <template #prefix>
            <Search class="w-4 h-4" />
          </template>
        </PactInput>
      </div>

      <div class="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
        <button
          v-for="filter in filters"
          :key="filter"
          @click="activeFilter = filter; currentPage = 1"
          class="px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition duration-150 cursor-pointer"
          :class="[
            activeFilter === filter
              ? 'bg-brand-50 border-brand-200 text-brand-600 font-bold'
              : 'bg-slate-50/50 border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          ]"
        >
          {{ filter }}
        </button>
      </div>
    </div>

    <!-- Transactions Table -->
    <PactCard padding="p-0" class="overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase tracking-wider font-bold text-slate-500">
              <th class="px-6 py-4">Transaction ID</th>
              <th class="px-6 py-4">Description</th>
              <th class="px-6 py-4">Type</th>
              <th class="px-6 py-4">Date</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 text-xs font-medium text-slate-700">
            <tr v-for="tx in paginatedTransactions" :key="tx.id" class="hover:bg-slate-50/30 transition">
              <td class="px-6 py-4.5 font-bold text-slate-900 uppercase">{{ tx.id }}</td>
              <td class="px-6 py-4.5 max-w-[240px] truncate" :title="tx.description">{{ tx.description }}</td>
              <td class="px-6 py-4.5">
                <span
                  class="inline-flex items-center gap-1 text-xs font-semibold"
                  :class="isOutgoing(tx.type) ? 'text-red-600' : 'text-emerald-600'"
                >
                  <ArrowUpRight v-if="isOutgoing(tx.type)" class="w-3.5 h-3.5" />
                  <ArrowDownLeft v-else class="w-3.5 h-3.5" />
                  {{ tx.type }}
                </span>
              </td>
              <td class="px-6 py-4.5 text-slate-500">
                {{ new Date(tx.timestamp).toLocaleString(undefined, {month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'}) }}
              </td>
              <td class="px-6 py-4.5">
                <PactBadge :status="tx.status" />
              </td>
              <td class="px-6 py-4.5 text-right font-bold text-sm"
                :class="isOutgoing(tx.type) ? 'text-red-600' : 'text-emerald-600'"
              >
                {{ isOutgoing(tx.type) ? '-' : '+' }}${{ tx.amount.toLocaleString() }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty state -->
      <div v-if="paginatedTransactions.length === 0" class="py-12 text-center">
        <Inbox class="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p class="text-xs text-slate-400 font-medium">No transactions found.</p>
      </div>

      <!-- Pagination -->
      <div class="px-6 py-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/20 text-xs font-semibold text-slate-500">
        <span>Page {{ currentPage }} of {{ totalPages }}</span>
        <div class="flex items-center gap-1.5">
          <PactButton 
            @click="handlePageChange(currentPage - 1)" 
            variant="secondary" 
            size="sm"
            class="py-1 px-3.5"
            :disabled="currentPage === 1"
          >
            Previous
          </PactButton>
          <PactButton 
            @click="handlePageChange(currentPage + 1)" 
            variant="secondary" 
            size="sm"
            class="py-1 px-3.5"
            :disabled="currentPage === totalPages"
          >
            Next
          </PactButton>
        </div>
      </div>
    </PactCard>
  </div>
</template>

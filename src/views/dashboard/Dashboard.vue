<!-- src/views/dashboard/Dashboard.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { useContractsStore } from '../../stores/contracts';
import { useInvoicesStore } from '../../stores/invoices';
import { 
  Coins, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock,
  Shield,
  Users,
  FileText,
  Inbox,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle
} from '@lucide/vue';

const router = useRouter();
const authStore = useAuthStore();
const contractsStore = useContractsStore();
const invoicesStore = useInvoicesStore();

const loading = ref(true);

onMounted(async () => {
  loading.value = true;
  await Promise.all([
    contractsStore.fetchContracts(),
    contractsStore.fetchWallet(),
    contractsStore.fetchTransactions(),
    invoicesStore.fetchInvoices()
  ]);
  loading.value = false;
});

// Computed Statistics
const escrowBalance = computed(() => contractsStore.wallet?.escrow || 0);
const walletBalance = computed(() => contractsStore.wallet?.available || 0);

const pendingTransactions = computed(() => {
  const txs = contractsStore.transactions || [];
  return txs.filter(tx => tx.status === 'Pending' || tx.status === 'pending').length;
});

const awaitingApproval = computed(() => {
  const list = contractsStore.contracts || [];
  return list.filter(c => c.status === 'Submitted' || c.status === 'Funded').length;
});

// Recent transactions for the table
const recentTransactions = computed(() => {
  const items = [];
  
  (contractsStore.transactions || []).slice(0, 10).forEach(tx => {
    items.push({
      id: tx.id,
      type: tx.type,
      reference: tx.reference || tx.id?.slice(0, 8) || 'N/A',
      parties: tx.parties || tx.description || '—',
      amount: tx.amount,
      status: tx.status || 'Completed',
      initiatedOn: tx.timestamp,
      rawDate: new Date(tx.timestamp)
    });
  });

  return items.sort((a, b) => b.rawDate - a.rawDate).slice(0, 8);
});

const getStatusBadge = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'completed' || s === 'success') return { class: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle };
  if (s === 'pending') return { class: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock };
  if (s === 'failed' || s === 'cancelled') return { class: 'bg-red-50 text-red-700 border-red-200', icon: XCircle };
  return { class: 'bg-slate-50 text-slate-600 border-slate-200', icon: AlertCircle };
};
</script>

<template>
  <div class="space-y-6">
    
    <!-- Loading Skeleton Grid -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      <div v-for="i in 4" :key="i" class="h-28 bg-slate-100 rounded-[16px]"></div>
    </div>

    <!-- Stats Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      
      <!-- Card 1: Amount in Escrow (Green) -->
      <div class="bg-gradient-to-br from-[#0C513F] to-[#0A3D2F] rounded-[16px] p-4 shadow-sm">
        <div class="flex items-center justify-between mb-3">
          <span class="text-[10px] font-semibold text-white/80 uppercase tracking-wider">Amount in Escrow</span>
          <span class="p-1.5 rounded-lg bg-white/20 text-white">
            <Shield class="w-4 h-4" />
          </span>
        </div>
        <h3 class="text-2xl font-bold text-white">₦{{ escrowBalance.toLocaleString() }}</h3>
        <p class="text-[11px] text-white/70 mt-1">Total held securely</p>
      </div>

      <!-- Card 2: Pending Transactions -->
      <div class="bg-white rounded-[16px] p-4 shadow-sm border border-slate-100">
        <div class="flex items-center justify-between mb-3">
          <span class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Pending Transactions</span>
          <span class="p-1.5 rounded-lg bg-amber-50 text-amber-500">
            <Clock class="w-4 h-4" />
          </span>
        </div>
        <h3 class="text-2xl font-bold text-slate-900">{{ pendingTransactions }}</h3>
        <p class="text-[11px] text-slate-500 mt-1">Awaiting action</p>
      </div>

      <!-- Card 3: Awaiting Approval -->
      <div class="bg-white rounded-[16px] p-4 shadow-sm border border-slate-100">
        <div class="flex items-center justify-between mb-3">
          <span class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Awaiting Approval</span>
          <span class="p-1.5 rounded-lg bg-blue-50 text-blue-500">
            <Users class="w-4 h-4" />
          </span>
        </div>
        <h3 class="text-2xl font-bold text-slate-900">{{ awaitingApproval }}</h3>
        <p class="text-[11px] text-slate-500 mt-1">Requires review</p>
      </div>

      <!-- Card 4: Wallet Balance -->
      <div class="bg-white rounded-[16px] p-4 shadow-sm border border-slate-100">
        <div class="flex items-center justify-between mb-3">
          <span class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Wallet Balance</span>
          <span class="p-1.5 rounded-lg bg-purple-50 text-purple-500">
            <Coins class="w-4 h-4" />
          </span>
        </div>
        <h3 class="text-2xl font-bold text-slate-900">₦{{ walletBalance.toLocaleString() }}</h3>
        <p class="text-[11px] text-slate-500 mt-1">Available</p>
      </div>
      
    </div>

    <!-- Recent Transactions Table -->
    <div class="bg-white rounded-[18px] shadow-sm border border-slate-100 overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-5 border-b border-slate-100">
        <div>
          <h3 class="text-base font-bold text-slate-900">Recent Transactions</h3>
          <p class="text-sm text-slate-500 mt-0.5">Latest activity across your account</p>
        </div>
        <button
          @click="router.push('/wallet')"
          class="text-sm font-semibold text-[#0C513F] hover:text-[#0A3D2F] transition-colors cursor-pointer"
        >
          See all →
        </button>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
              <th class="px-6 py-4">Transaction Type</th>
              <th class="px-6 py-4">Number</th>
              <th class="px-6 py-4">Involved Parties</th>
              <th class="px-6 py-4">Amount</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4">Initiated On</th>
              <th class="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="tx in recentTransactions"
              :key="tx.id"
              class="border-b border-slate-50 last:border-0 hover:bg-slate-50/40 transition-colors"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-2.5">
                  <span class="p-1.5 rounded-lg" :class="[
                    tx.type?.toLowerCase().includes('release') || tx.type?.toLowerCase().includes('inflow') ? 'bg-emerald-50 text-emerald-600' :
                    tx.type?.toLowerCase().includes('withdrawal') || tx.type?.toLowerCase().includes('outflow') ? 'bg-red-50 text-red-600' :
                    'bg-blue-50 text-blue-600'
                  ]">
                    <ArrowDownLeft v-if="tx.type?.toLowerCase().includes('release') || tx.type?.toLowerCase().includes('inflow')" class="w-4 h-4" />
                    <ArrowUpRight v-else class="w-4 h-4" />
                  </span>
                  <span class="text-sm font-medium text-slate-800">{{ tx.type }}</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-slate-600 font-mono">{{ tx.reference }}</span>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-slate-600">{{ tx.parties }}</span>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm font-semibold text-slate-900">₦{{ tx.amount.toLocaleString() }}</span>
              </td>
              <td class="px-6 py-4">
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border" :class="getStatusBadge(tx.status).class">
                  <component :is="getStatusBadge(tx.status).icon" class="w-3 h-3" />
                  {{ tx.status }}
                </span>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm text-slate-500">
                  {{ new Date(tx.initiatedOn).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'}) }}
                </span>
              </td>
              <td class="px-6 py-4">
                <button class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer">
                  <MoreHorizontal class="w-4 h-4" />
                </button>
              </td>
            </tr>
            <!-- Empty State -->
            <tr v-if="recentTransactions.length === 0">
              <td colspan="7" class="px-6 py-16 text-center">
                <Inbox class="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p class="text-sm text-slate-500 font-medium">No recent transactions found</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

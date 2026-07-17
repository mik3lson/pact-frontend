<!-- src/views/wallet/Wallet.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useWalletStore } from '../../stores/wallet';
import { useAuthStore } from '../../stores/auth';
import PactCard from '../../components/ui/PactCard.vue';
import PactButton from '../../components/ui/PactButton.vue';
import PactBadge from '../../components/ui/PactBadge.vue';
import PactInput from '../../components/ui/PactInput.vue';
import PactModal from '../../components/ui/PactModal.vue';
import {
  Wallet, Shield, Clock, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownLeft, Search, Download, Plus, Minus,
  ArrowLeftRight, FileText, Building, CheckCircle, XCircle,
  AlertCircle, HelpCircle, Inbox, CreditCard, Landmark,
  ChevronRight, ChevronDown, ExternalLink, Copy, Eye, EyeOff,
  RefreshCw, Filter, Calendar, PieChart, Banknote, Receipt,
  ArrowUpDown, Check, PlusCircle, Settings, Loader, Send,
  BadgeCheck, CircleDollarSign, PiggyBank, BarChart3, Activity,
  Layers, ArrowRight, ArrowLeft, Sparkles, Lock, Unlock,
  Briefcase, DollarSign, Award, CreditCard as CreditCardIcon,
  HandCoins, ScrollText, ListFilter, CalendarDays,
  ChevronLeft, Info, WalletCards, Timer, CircleCheckBig,
  CircleEllipsis, CircleX, TriangleAlert, Ellipsis,
  ArrowRightLeft, ScanLine, BadgePercent,
  ChartNoAxesColumnIncreasing, ChartNoAxesColumnDecreasing,
  ChartNoAxesCombined, ChartPie as ChartPieIcon,
  ChartBarBig, ChartBarStacked,
  ChartColumnBig, ChartColumnStacked, ChartLine as ChartLineIcon,
  ChartArea as ChartAreaIcon, ChartSpline as ChartSplineIcon,
  ChartNetwork as ChartNetworkIcon, ChartGantt
} from '@lucide/vue';

const router = useRouter();
const walletStore = useWalletStore();
const authStore = useAuthStore();

const loading = ref(true);
const showDepositModal = ref(false);
const showWithdrawModal = ref(false);
const showTransferModal = ref(false);
const showStatementModal = ref(false);
const showAddPaymentModal = ref(false);
const showEditBankModal = ref(false);
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');
const balanceAnimated = ref(false);
const activeFilter = ref('All');
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = 8;
const showBalance = ref(true);

const depositAmount = ref('');
const withdrawAmount = ref('');
const selectedBankId = ref('');
const transferAmount = ref('');
const transferDestination = ref('');
const localError = ref('');

const activityFilters = ['All', 'Deposits', 'Withdrawals', 'Escrows', 'Invoices', 'Refunds', 'Settlements'];

const wallet = computed(() => walletStore.wallet);
const transactions = computed(() => walletStore.transactions);
const settlements = computed(() => walletStore.settlements);
const escrowMovements = computed(() => walletStore.escrowMovements);
const paymentMethods = computed(() => walletStore.paymentMethods);
const bankAccount = computed(() => walletStore.bankAccount);

const verifiedBanks = computed(() => {
  return authStore.user?.bankAccounts?.filter(b => b.status === 'Verified') || [];
});

const selectedBankDetails = computed(() => {
  return verifiedBanks.value.find(b => b.id === selectedBankId.value);
});

const filteredActivity = computed(() => {
  let list = [...transactions.value];
  if (activeFilter.value !== 'All') {
    const filterMap = {
      'Deposits': ['Deposit'],
      'Withdrawals': ['Withdrawal'],
      'Escrows': ['Escrow Release', 'Escrow Hold', 'Deposit'],
      'Invoices': ['Inflow', 'Outflow'],
      'Refunds': ['Refund'],
      'Settlements': ['Withdrawal']
    };
    const types = filterMap[activeFilter.value] || [];
    list = list.filter(tx => types.includes(tx.type));
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(tx =>
      tx.description?.toLowerCase().includes(q) ||
      tx.id?.toLowerCase().includes(q) ||
      tx.type?.toLowerCase().includes(q)
    );
  }
  return list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
});

const paginatedActivity = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredActivity.value.slice(start, start + itemsPerPage);
});

const totalPages = computed(() => {
  return Math.ceil(filteredActivity.value.length / itemsPerPage) || 1;
});

const analyticsCards = computed(() => [
  { icon: TrendingUp, label: 'Total Deposits', value: wallet.value.totalDeposits || 0, color: 'text-emerald-600 bg-emerald-50', trend: '+12%' },
  { icon: TrendingDown, label: 'Total Withdrawals', value: wallet.value.totalWithdrawals || 0, color: 'text-red-600 bg-red-50', trend: '-3%' },
  { icon: Shield, label: 'Active Escrows', value: wallet.value.activeEscrows || 0, color: 'text-indigo-600 bg-indigo-50', trend: null },
  { icon: CheckCircle, label: 'Completed Escrows', value: wallet.value.completedEscrows || 0, color: 'text-emerald-600 bg-emerald-50', trend: null },
  { icon: CircleDollarSign, label: 'Total Revenue', value: wallet.value.totalRevenue || 0, color: 'text-brand-600 bg-brand-50', trend: '+8%' },
  { icon: Banknote, label: 'Total Settlements', value: wallet.value.totalSettlements || 0, color: 'text-amber-600 bg-amber-50', trend: null }
]);

const balanceBreakdown = computed(() => [
  { label: 'Available Balance', value: wallet.value.available, color: '#10B981', percentage: 0 },
  { label: 'Escrow Funds', value: wallet.value.escrow, color: '#6366F1', percentage: 0 },
  { label: 'Pending Funds', value: wallet.value.pending, color: '#F59E0B', percentage: 0 }
]);

const totalForBreakdown = computed(() => {
  return wallet.value.available + wallet.value.escrow + wallet.value.pending || 1;
});

const breakdownWithPercentages = computed(() => {
  return balanceBreakdown.value.map(b => ({
    ...b,
    percentage: Math.round((b.value / totalForBreakdown.value) * 100)
  }));
});

onMounted(async () => {
  loading.value = true;
  await walletStore.fetchAll();
  if (verifiedBanks.value.length > 0) {
    selectedBankId.value = verifiedBanks.value[0].id;
  }
  loading.value = false;
  setTimeout(() => { balanceAnimated.value = true; }, 300);
});

const formatCurrency = (value) => {
  return '₦' + (value || 0).toLocaleString();
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  if (isToday) return 'Today • ' + time;
  if (isYesterday) return 'Yesterday • ' + time;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' • ' + time;
};

const getActivityIcon = (type) => {
  const map = {
    'Deposit': ArrowDownLeft, 'Withdrawal': ArrowUpRight,
    'Escrow Release': CheckCircle, 'Escrow Hold': Shield,
    'Inflow': ArrowDownLeft, 'Outflow': ArrowUpRight, 'Refund': RefreshCw
  };
  return map[type] || Activity;
};

const getActivityColor = (type) => {
  const map = {
    'Deposit': 'bg-emerald-50 text-emerald-600', 'Withdrawal': 'bg-red-50 text-red-600',
    'Escrow Release': 'bg-indigo-50 text-indigo-600', 'Escrow Hold': 'bg-amber-50 text-amber-600',
    'Inflow': 'bg-emerald-50 text-emerald-600', 'Outflow': 'bg-red-50 text-red-600',
    'Refund': 'bg-purple-50 text-purple-600'
  };
  return map[type] || 'bg-slate-50 text-slate-500';
};

const getAmountClass = (type) => {
  const inflow = ['Deposit', 'Inflow', 'Escrow Release'];
  return inflow.includes(type) ? 'text-emerald-600' : 'text-slate-900';
};

const getAmountPrefix = (type) => {
  const inflow = ['Deposit', 'Inflow', 'Escrow Release'];
  return inflow.includes(type) ? '+' : '-';
};

const getStatusVariant = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'completed' || s === 'active') return 'success';
  if (s === 'pending' || s === 'processing') return 'warning';
  if (s === 'failed' || s === 'disputed') return 'danger';
  return 'default';
};

const getSettlementStatusVariant = (status) => {
  const s = (status || '').toLowerCase();
  if (s === 'completed') return 'success';
  if (s === 'pending' || s === 'processing') return 'warning';
  if (s === 'failed') return 'danger';
  return 'default';
};

const getEscrowTypeIcon = (type) => {
  const map = {
    'Funded': ArrowDownLeft, 'Released': ArrowUpRight,
    'Refunded': RefreshCw, 'Partial Release': ArrowRight, 'Disputed': AlertCircle
  };
  return map[type] || Activity;
};

const getEscrowTypeColor = (type) => {
  const map = {
    'Funded': 'text-emerald-600 bg-emerald-50', 'Released': 'text-indigo-600 bg-indigo-50',
    'Refunded': 'text-amber-600 bg-amber-50', 'Partial Release': 'text-blue-600 bg-blue-50',
    'Disputed': 'text-red-600 bg-red-50'
  };
  return map[type] || 'text-slate-500 bg-slate-50';
};

const getCardIcon = (type) => {
  const map = { 'visa': CreditCardIcon, 'mastercard': CreditCardIcon, 'bank': Landmark };
  return map[type] || CreditCardIcon;
};

const getCardColor = (type) => {
  const map = {
    'visa': 'from-blue-500 to-blue-600',
    'mastercard': 'from-orange-500 to-red-500',
    'bank': 'from-slate-600 to-slate-700'
  };
  return map[type] || 'from-brand-500 to-brand-600';
};

const openDeposit = () => { depositAmount.value = ''; localError.value = ''; showDepositModal.value = true; };
const openWithdraw = () => { withdrawAmount.value = ''; localError.value = ''; showWithdrawModal.value = true; };
const closeDeposit = () => { showDepositModal.value = false; };
const closeWithdraw = () => { showWithdrawModal.value = false; };

const handleDeposit = async () => {
  localError.value = '';
  const amount = Number(depositAmount.value);
  if (!amount || amount <= 0) { localError.value = 'Please enter a valid deposit amount.'; return; }
  try {
    await walletStore.depositFunds(amount, selectedBankId.value || 'bank_default');
    showToastMessage('Deposit successful! ₦' + amount.toLocaleString() + ' added to your wallet.', 'success');
    closeDeposit();
  } catch (err) {
    localError.value = err.response?.data?.message || 'Deposit failed.';
  }
};

const handleWithdraw = async () => {
  localError.value = '';
  const amount = Number(withdrawAmount.value);
  if (!amount || amount <= 0) { localError.value = 'Please enter a valid withdrawal amount.'; return; }
  if (amount > wallet.value.available) { localError.value = 'Withdrawal amount exceeds your available balance.'; return; }
  if (!selectedBankId.value && !bankAccount.value) { localError.value = 'Please select a payout destination.'; return; }
  try {
    const bank = selectedBankDetails.value || bankAccount.value;
    await walletStore.withdrawFunds(amount, bank.id, bank.bankName, bank.accountNumber);
    showToastMessage('Withdrawal initiated! ₦' + amount.toLocaleString() + ' is being processed.', 'success');
    closeWithdraw();
  } catch (err) {
    localError.value = err.response?.data?.message || 'Withdrawal failed.';
  }
};

const showToastMessage = (message, type = 'success') => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => { showToast.value = false; }, 4000);
};

const handlePageChange = (page) => {
  if (page >= 1 && page <= totalPages.value) currentPage.value = page;
};

const handleExportCSV = () => {
  showToastMessage('Transaction history exported successfully.', 'success');
};

const copyToClipboard = (text) => {
  navigator.clipboard?.writeText(text);
  showToastMessage('Copied to clipboard!', 'success');
};
</script>
<template>
  <div class="space-y-6">
    <Teleport to="body">
      <Transition name="slide-up">
        <div
          v-if="showToast"
          class="fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-premium-lg border"
          :class="toastType === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'"
        >
          <CheckCircle v-if="toastType === 'success'" class="w-5 h-5 text-emerald-500 shrink-0" />
          <AlertCircle v-else class="w-5 h-5 text-red-500 shrink-0" />
          <span class="text-sm font-semibold">{{ toastMessage }}</span>
        </div>
      </Transition>
    </Teleport>

    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-slate-900 tracking-tight">Wallet & Settlements</h2>
        <p class="text-xs text-slate-500 mt-0.5">Manage your balances, escrow funds, payouts, and payment methods.</p>
      </div>
      <div class="flex items-center gap-2">
        <PactButton variant="secondary" size="sm" @click="openWithdraw" class="!bg-[#0C513F] !text-white !border-[#0C513F] hover:!bg-[#0A3D2F]">
          <ArrowUpRight class="w-4 h-4" />
          Withdraw Funds
        </PactButton>
        <PactButton variant="primary" size="sm" @click="openDeposit">
          <Plus class="w-4 h-4" />
          Add Funds
        </PactButton>
      </div>
    </div>

    <template v-if="loading">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div v-for="i in 3" :key="i" class="h-36 bg-slate-100 rounded-2xl animate-pulse"></div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div v-for="i in 6" :key="i" class="h-20 bg-slate-100 rounded-xl animate-pulse"></div>
      </div>
    </template>

    <template v-else>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 shadow-premium-lg">
          <div class="absolute right-0 top-0 w-32 h-32 translate-x-8 -translate-y-8">
            <div class="w-full h-full rounded-full bg-white/10"></div>
          </div>
          <div class="absolute right-4 bottom-4 text-white/10">
            <Wallet class="w-20 h-20 stroke-[1.5]" />
          </div>
          <div class="relative z-10">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="p-1.5 rounded-lg bg-white/20 text-white">
                  <Wallet class="w-4 h-4" />
                </div>
                <span class="text-xs font-semibold text-white/80">Available Balance</span>
                <div class="relative group">
                  <HelpCircle class="w-3 h-3 text-white/50 cursor-help" />
                  <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-[10px] rounded-xl shadow-premium-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48 text-center whitespace-normal z-50">
                    Funds available to spend or withdraw immediately.
                  </div>
                </div>
              </div>
              <button @click="showBalance = !showBalance" class="p-1.5 rounded-lg bg-white/20 text-white/80 hover:bg-white/30 transition-all cursor-pointer">
                <EyeOff v-if="!showBalance" class="w-3.5 h-3.5" />
                <Eye v-else class="w-3.5 h-3.5" />
              </button>
            </div>
            <div class="mt-4">
              <h3 class="text-3xl font-extrabold text-white tracking-tight">
                <Transition name="fade" mode="out-in">
                  <span :key="showBalance ? 'visible' : 'hidden'">
                    {{ showBalance ? formatCurrency(wallet.available) : '₦••••••' }}
                  </span>
                </Transition>
              </h3>
              <p class="text-xs text-white/70 mt-1.5">Available for withdrawals and payments</p>
            </div>
            <div class="mt-4 flex items-center gap-2">
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-white">
                <Sparkles class="w-3 h-3" />
                Withdrawable
              </span>
              <button @click="openDeposit" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-white hover:bg-white/30 transition-all cursor-pointer">
                <Plus class="w-3 h-3" />
                Add Funds
              </button>
            </div>
          </div>
        </div>

        <div class="relative overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-premium p-6 hover:shadow-premium-lg transition-all duration-200">
          <div class="absolute right-4 top-4 text-indigo-100">
            <Shield class="w-16 h-16 stroke-[1.5]" />
          </div>
          <div class="relative z-10">
            <div class="flex items-center gap-2">
              <div class="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <Shield class="w-4 h-4" />
              </div>
              <span class="text-xs font-semibold text-slate-500">Escrow Balance</span>
              <div class="relative group">
                <HelpCircle class="w-3.5 h-3.5 text-slate-300 cursor-help" />
                <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-[10px] rounded-xl shadow-premium-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48 text-center whitespace-normal z-50">
                  Funds securely locked in active escrow agreements. Released upon milestone completion.
                </div>
              </div>
            </div>
            <div class="mt-4">
              <h3 class="text-3xl font-extrabold text-slate-900 tracking-tight">
                {{ showBalance ? formatCurrency(wallet.escrow) : '₦••••••' }}
              </h3>
              <p class="text-xs text-slate-400 mt-1.5">Funds securely held in escrow</p>
            </div>
            <div class="mt-4">
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#0C513F]/10 text-[#0C513F]">
                <Lock class="w-3 h-3" />
                Locked
              </span>
            </div>
          </div>
        </div>

        <div class="relative overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-premium p-6 hover:shadow-premium-lg transition-all duration-200">
          <div class="absolute right-4 top-4 text-amber-100">
            <Clock class="w-16 h-16 stroke-[1.5]" />
          </div>
          <div class="relative z-10">
            <div class="flex items-center gap-2">
              <div class="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <Clock class="w-4 h-4" />
              </div>
              <span class="text-xs font-semibold text-slate-500">Pending Balance</span>
              <div class="relative group">
                <HelpCircle class="w-3.5 h-3.5 text-slate-300 cursor-help" />
                <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-[10px] rounded-xl shadow-premium-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48 text-center whitespace-normal z-50">
                  Payments being processed or awaiting settlement. Usually clears within 1-2 business days.
                </div>
              </div>
            </div>
            <div class="mt-4">
              <h3 class="text-3xl font-extrabold text-slate-900 tracking-tight">
                {{ showBalance ? formatCurrency(wallet.pending) : '₦••••••' }}
              </h3>
              <p class="text-xs text-slate-400 mt-1.5">Money currently processing</p>
            </div>
            <div class="mt-4">
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700">
                <Loader class="w-3 h-3" />
                Processing
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div v-for="card in analyticsCards" :key="card.label" class="bg-white rounded-xl border border-slate-100 shadow-premium p-4 hover:shadow-premium-lg hover:border-slate-200 transition-all duration-200">
          <div class="flex items-center justify-between mb-2">
            <div class="p-1.5 rounded-lg" :class="card.color">
              <component :is="card.icon" class="w-3.5 h-3.5" />
            </div>
            <span v-if="card.trend" class="text-[10px] font-semibold" :class="card.trend.startsWith('+') ? 'text-emerald-600' : 'text-red-600'">{{ card.trend }}</span>
          </div>
          <p class="text-lg font-extrabold text-slate-900">{{ formatCurrency(card.value) }}</p>
          <p class="text-[10px] text-slate-400 mt-0.5 truncate">{{ card.label }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div class="lg:col-span-8 space-y-4">
          <div class="bg-white rounded-2xl border border-slate-100 shadow-premium overflow-hidden">
            <div class="p-5 border-b border-slate-100">
              <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h3 class="text-sm font-bold text-slate-900">Recent Activity</h3>
                  <p class="text-xs text-slate-400 mt-0.5">Latest wallet transactions</p>
                </div>
                <div class="flex items-center gap-2 flex-wrap">
                  <div class="relative w-full lg:w-48">
                    <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input v-model="searchQuery" type="text" placeholder="Search transactions..." class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 transition-all" />
                  </div>
                  <button @click="handleExportCSV" class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#0C513F] border border-[#0C513F] rounded-xl hover:bg-[#0A3D2F] transition-all cursor-pointer">
                    <Download class="w-3.5 h-3.5" />
                    Export CSV
                  </button>
                </div>
              </div>
              <div class="flex items-center gap-1.5 mt-4 overflow-x-auto pb-1">
                <button v-for="filter in activityFilters" :key="filter" @click="activeFilter = filter; currentPage = 1" class="px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all duration-150 whitespace-nowrap cursor-pointer"
                  :class="[activeFilter === filter ? 'bg-brand-50 border-brand-200 text-brand-600 font-bold' : 'bg-slate-50/50 border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-800']">
                  {{ filter }}
                </button>
              </div>
            </div>

            <div class="divide-y divide-slate-50">
              <div v-for="tx in paginatedActivity" :key="tx.id" class="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/30 transition-all duration-150">
                <div class="p-2.5 rounded-xl shrink-0" :class="getActivityColor(tx.type)">
                  <component :is="getActivityIcon(tx.type)" class="w-4 h-4" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-bold text-slate-900">{{ tx.description || tx.type }}</p>
                  <p class="text-xs text-slate-400 mt-0.5">{{ formatDate(tx.timestamp) }}</p>
                </div>
                <div class="text-right shrink-0">
                  <p class="text-sm font-bold" :class="getAmountClass(tx.type)">{{ getAmountPrefix(tx.type) }}₦{{ (tx.amount || 0).toLocaleString() }}</p>
                  <PactBadge :status="tx.status" />
                </div>
              </div>
            </div>

            <div v-if="paginatedActivity.length === 0" class="py-16 text-center">
              <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                <Inbox class="w-8 h-8 text-slate-300" />
              </div>
              <h3 class="text-sm font-bold text-slate-800">No wallet activity yet</h3>
              <p class="text-xs text-slate-400 mt-1 max-w-xs mx-auto">When you make deposits, withdrawals, or receive payments, they'll appear here.</p>
              <PactButton variant="primary" size="sm" class="mt-4" @click="openDeposit">
                <Plus class="w-4 h-4" />
                Make Your First Deposit
              </PactButton>
            </div>

            <div v-if="filteredActivity.length > 0" class="px-5 py-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/20">
              <span class="text-xs font-semibold text-slate-500">Page {{ currentPage }} of {{ totalPages }}</span>
              <div class="flex items-center gap-1.5">
                <PactButton @click="handlePageChange(currentPage - 1)" variant="secondary" size="sm" class="py-1 px-3 !bg-[#0C513F] !text-white !border-[#0C513F] hover:!bg-[#0A3D2F]" :disabled="currentPage === 1">
                  <ArrowLeft class="w-3.5 h-3.5" />
                </PactButton>
                <PactButton @click="handlePageChange(currentPage + 1)" variant="secondary" size="sm" class="py-1 px-3 !bg-[#0C513F] !text-white !border-[#0C513F] hover:!bg-[#0A3D2F]" :disabled="currentPage === totalPages">
                  <ArrowRight class="w-3.5 h-3.5" />
                </PactButton>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-100 shadow-premium overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-100">
              <h3 class="text-sm font-bold text-slate-900">Settlement History</h3>
              <p class="text-xs text-slate-400 mt-0.5">Record of all withdrawals and payouts</p>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase tracking-wider font-bold text-slate-500">
                    <th class="px-5 py-3.5">Date</th>
                    <th class="px-5 py-3.5">Reference</th>
                    <th class="px-5 py-3.5">Destination</th>
                    <th class="px-5 py-3.5 text-right">Amount</th>
                    <th class="px-5 py-3.5">Status</th>
                    <th class="px-5 py-3.5">Processing Time</th>
                    <th class="px-5 py-3.5"></th>
                  </tr>
                </thead>
                <tbody v-if="settlements.length > 0" class="divide-y divide-slate-50 text-xs font-medium text-slate-700">
                  <tr v-for="stl in settlements" :key="stl.id" class="hover:bg-slate-50/30 transition">
                    <td class="px-5 py-3.5 text-slate-500">{{ formatDate(stl.date) }}</td>
                    <td class="px-5 py-3.5 font-mono font-bold text-slate-800">{{ stl.reference }}</td>
                    <td class="px-5 py-3.5 max-w-[160px] truncate">{{ stl.destination }}</td>
                    <td class="px-5 py-3.5 text-right font-bold text-slate-900">₦{{ (stl.amount || 0).toLocaleString() }}</td>
                    <td class="px-5 py-3.5"><PactBadge :status="stl.status" /></td>
                    <td class="px-5 py-3.5 text-slate-400">{{ stl.processingTime }}</td>
                    <td class="px-5 py-3.5">
                      <button class="p-1 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-all cursor-pointer">
                        <ExternalLink class="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-if="settlements.length === 0" class="py-12 text-center">
                <div class="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                  <Banknote class="w-6 h-6 text-slate-300" />
                </div>
                <p class="text-sm font-bold text-slate-700">No settlements yet</p>
                <p class="text-xs text-slate-400 mt-1">When your first payout is processed, it will appear here.</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-100 shadow-premium overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-100">
              <h3 class="text-sm font-bold text-slate-900">Escrow Movement</h3>
              <p class="text-xs text-slate-400 mt-0.5">Funds moving into and out of escrow</p>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase tracking-wider font-bold text-slate-500">
                    <th class="px-5 py-3.5">Escrow ID</th>
                    <th class="px-5 py-3.5">Project</th>
                    <th class="px-5 py-3.5">Counterparty</th>
                    <th class="px-5 py-3.5 text-right">Amount</th>
                    <th class="px-5 py-3.5">Type</th>
                    <th class="px-5 py-3.5">Date</th>
                    <th class="px-5 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody v-if="escrowMovements.length > 0" class="divide-y divide-slate-50 text-xs font-medium text-slate-700">
                  <tr v-for="esc in escrowMovements" :key="esc.id" class="hover:bg-slate-50/30 transition">
                    <td class="px-5 py-3.5 font-mono font-bold text-slate-800">{{ esc.escrowId }}</td>
                    <td class="px-5 py-3.5">{{ esc.project }}</td>
                    <td class="px-5 py-3.5">{{ esc.counterparty }}</td>
                    <td class="px-5 py-3.5 text-right font-bold text-slate-900">₦{{ (esc.amount || 0).toLocaleString() }}</td>
                    <td class="px-5 py-3.5">
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" :class="getEscrowTypeColor(esc.type)">
                        <component :is="getEscrowTypeIcon(esc.type)" class="w-3 h-3" />
                        {{ esc.type }}
                      </span>
                    </td>
                    <td class="px-5 py-3.5 text-slate-400">{{ formatDate(esc.date) }}</td>
                    <td class="px-5 py-3.5"><PactBadge :status="esc.status" /></td>
                  </tr>
                </tbody>
              </table>
              <div v-if="escrowMovements.length === 0" class="py-12 text-center">
                <div class="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                  <Shield class="w-6 h-6 text-slate-300" />
                </div>
                <p class="text-sm font-bold text-slate-700">No escrow movements yet</p>
                <p class="text-xs text-slate-400 mt-1">When funds move into or out of escrow, they'll appear here.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="lg:col-span-4 space-y-4">
          <div class="bg-white rounded-2xl border border-slate-100 shadow-premium p-5">
            <h3 class="text-sm font-bold text-slate-900 mb-4">Quick Actions</h3>
            <div class="space-y-2">
              <button @click="openDeposit" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-50 text-brand-700 font-semibold text-xs hover:bg-brand-100 hover:shadow-sm transition-all cursor-pointer">
                <Plus class="w-4 h-4" />
                Add Funds
              </button>
              <button @click="openWithdraw" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 text-slate-700 font-semibold text-xs hover:bg-slate-100 hover:shadow-sm transition-all cursor-pointer">
                <ArrowUpRight class="w-4 h-4" />
                Withdraw Funds
              </button>
              <button @click="showTransferModal = true" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 text-slate-700 font-semibold text-xs hover:bg-slate-100 hover:shadow-sm transition-all cursor-pointer">
                <ArrowLeftRight class="w-4 h-4" />
                Transfer Between Wallets
              </button>
              <button @click="router.push('/escrows')" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 text-slate-700 font-semibold text-xs hover:bg-slate-100 hover:shadow-sm transition-all cursor-pointer">
                <Shield class="w-4 h-4" />
                View Escrow Balance
              </button>
              <button @click="showStatementModal = true" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 text-slate-700 font-semibold text-xs hover:bg-slate-100 hover:shadow-sm transition-all cursor-pointer">
                <FileText class="w-4 h-4" />
                Generate Account Statement
              </button>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-100 shadow-premium p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-bold text-slate-900">Payment Methods</h3>
              <button @click="showAddPaymentModal = true" class="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-all cursor-pointer">+ Add</button>
            </div>
            <div v-if="paymentMethods.length > 0" class="space-y-2">
              <div v-for="pm in paymentMethods" :key="pm.id" class="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div class="p-2 rounded-lg bg-gradient-to-br" :class="getCardColor(pm.type)">
                  <component :is="getCardIcon(pm.type)" class="w-4 h-4 text-white" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-bold text-slate-800">{{ pm.nickname || pm.type }}</p>
                  <p class="text-[10px] text-slate-400">{{ pm.maskedNumber }}</p>
                </div>
                <span v-if="pm.isDefault" class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#0C513F]/10 text-[#0C513F]">Default</span>
              </div>
            </div>
            <div v-else class="py-6 text-center">
              <CreditCard class="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p class="text-xs text-slate-400">No payment methods saved</p>
              <button @click="showAddPaymentModal = true" class="mt-2 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-all cursor-pointer">Add Payment Method</button>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-100 shadow-premium p-5">
            <h3 class="text-sm font-bold text-slate-900 mb-4">Bank Account</h3>
            <div v-if="bankAccount" class="space-y-3">
              <div class="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div class="flex items-center gap-2 mb-2">
                  <Landmark class="w-4 h-4 text-slate-500" />
                  <span class="text-xs font-bold text-slate-800">{{ bankAccount.bankName }}</span>
                </div>
                <p class="text-xs text-slate-600">{{ bankAccount.accountName }}</p>
                <p class="text-xs font-mono font-bold text-slate-800 mt-1">{{ bankAccount.accountNumber }}</p>
                <div class="mt-2 flex items-center gap-1.5">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold" :class="bankAccount.verified ? 'bg-[#0C513F]/10 text-[#0C513F]' : 'bg-amber-50 text-amber-700'">
                    <CheckCircle v-if="bankAccount.verified" class="w-2.5 h-2.5" />
                    <AlertCircle v-else class="w-2.5 h-2.5" />
                    {{ bankAccount.verified ? 'Verified' : 'Pending' }}
                  </span>
                </div>
              </div>
              <button @click="showEditBankModal = true" class="w-full text-xs font-semibold text-[#0C513F] hover:text-[#0A3D2F] py-2 transition-all cursor-pointer">Edit Bank Details</button>
            </div>
            <div v-else class="py-6 text-center">
              <Building class="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p class="text-xs text-slate-400">No bank account linked</p>
              <button @click="showEditBankModal = true" class="mt-2 text-xs font-semibold text-[#0C513F] hover:text-[#0A3D2F] transition-all cursor-pointer">Link Bank Account</button>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-100 shadow-premium p-5">
            <h3 class="text-sm font-bold text-slate-900 mb-4">Wallet Breakdown</h3>
            <div class="space-y-3">
              <div v-for="item in breakdownWithPercentages" :key="item.label" class="space-y-1">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-semibold text-slate-700">{{ item.label }}</span>
                  <span class="font-bold text-slate-900">{{ formatCurrency(item.value) }}</span>
                </div>
                <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-1000" :style="{ width: item.percentage + '%', backgroundColor: item.color }"></div>
                </div>
                <p class="text-[10px] text-slate-400 text-right">{{ item.percentage }}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.slide-up-enter-active {
  transition: all 0.3s ease-out;
}
.slide-up-leave-active {
  transition: all 0.2s ease-in;
}
.slide-up-enter-from {
  transform: translateY(20px);
  opacity: 0;
}
.slide-up-leave-to {
  transform: translateY(10px);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes count-up {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.balance-animate {
  animation: count-up 0.6s ease-out forwards;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.animate-shimmer {
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

@media (max-width: 768px) {
  .balance-cards-container {
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
  }
  .balance-cards-container > * {
    scroll-snap-align: start;
    min-width: 85vw;
  }
}
</style>

<!-- src/views/transactions/Transactions.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { useWalletStore } from '../../stores/wallet';
import PactCard from '../../components/ui/PactCard.vue';
import PactBadge from '../../components/ui/PactBadge.vue';
import PactButton from '../../components/ui/PactButton.vue';
import PactAvatar from '../../components/ui/PactAvatar.vue';
import {
  Search,
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  Shield,
  Download,
  Plus,
  FileText,
  FileSpreadsheet,
  File,
  AlertTriangle,
  RotateCcw,
  Copy,
  X,
  Clock,
  CheckCircle2,
  User,
  Building,
  Store,
  Briefcase,
  Code,
  Landmark,
  CreditCard,
  Wallet,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Eye,
  MoreHorizontal,
  Calendar,
  ChevronDown,
  HelpCircle,
  ExternalLink,
  MessageCircle

} from '@lucide/vue';

const router = useRouter();
const authStore = useAuthStore();
const walletStore = useWalletStore();

// --- State ---
const loading = ref(true);
const searchQuery = ref('');
const statusFilter = ref('All');
const typeFilter = ref('All');
const dateFilter = ref('All');
const sortField = ref('date');
const sortDirection = ref('desc');
const currentPage = ref(1);
const itemsPerPage = ref(20);
const showDatePicker = ref(false);
const customDateRange = ref({ start: '', end: '' });
const selectedTransaction = ref(null);
const showDrawer = ref(false);
const showExportMenu = ref(false);
const openActionMenuId = ref(null);

const statusFilters = [
  'All', 'Pending', 'Awaiting Funding', 'Funded', 'In Progress',
  'Delivered', 'Released', 'Completed', 'Refunded', 'Cancelled', 'Disputed', 'Failed'
];

const typeFilters = [
  'All', 'Escrow', 'Invoice', 'Deposit', 'Withdrawal', 'Settlement', 'Refund', 'Transfer'
];

const dateFilters = [
  { label: 'All', value: 'All' },
  { label: 'Today', value: 'Today' },
  { label: 'Last 7 Days', value: 'Last 7 Days' },
  { label: 'Last 30 Days', value: 'Last 30 Days' },
  { label: 'Last 90 Days', value: 'Last 90 Days' },
  { label: 'This Year', value: 'This Year' },
  { label: 'Custom Range', value: 'Custom Range' }
];

const sortOptions = [
  { label: 'Newest First', field: 'date', dir: 'desc' },
  { label: 'Oldest First', field: 'date', dir: 'asc' },
  { label: 'Highest Amount', field: 'amount', dir: 'desc' },
  { label: 'Lowest Amount', field: 'amount', dir: 'asc' },
  { label: 'Status', field: 'status', dir: 'asc' }
];

const actionMenuOptions = [
  'View Details',
  'Download Receipt',
  'Download Invoice',
  'Download Escrow Agreement',
  'Raise Dispute',
  'Refund',
  'Duplicate Invoice'
];

const transactions = ref([]);

onMounted(async () => {
  loading.value = true;
  try {
    await walletStore.fetchTransactions();
    transactions.value = (walletStore.transactions || []).map(tx => enrichTransaction(tx));
  } catch (err) {
    console.error('Failed to load transactions', err);
  } finally {
    loading.value = false;
  }
});


function enrichTransaction(tx) {
  const isOutgoing = ['Withdrawal', 'Outflow', 'Escrow Hold'].includes(tx.type);
  const type = mapTransactionType(tx.type);
  return {
    id: tx.id || 'tx_' + Math.random().toString(36).substr(2, 9),
    transactionId: tx.id?.toUpperCase() || 'TXN-' + String(Math.floor(10000 + Math.random() * 90000)),
    escrowId: tx.reference?.startsWith('con_') ? 'ESC-' + tx.reference.split('_').pop().toUpperCase() : null,
    invoiceNumber: tx.reference?.startsWith('INV') ? tx.reference : null,
    projectName: tx.description?.split(':')[0]?.trim() || tx.description || 'Transaction',
    description: tx.description || '',
    type,
    typeLabel: getTypeLabel(type),
    amount: tx.amount || 0,
    isOutgoing,
    counterparty: tx.counterparty || getCounterpartyFromDescription(tx.description, type),
    counterpartyEmail: tx.counterpartyEmail || 'user@pact.com',
    role: tx.role || (isOutgoing ? 'Client' : 'Freelancer'),
    paymentMethod: tx.paymentMethod || getPaymentMethod(type),
    date: tx.timestamp || new Date().toISOString(),
    status: tx.status || 'Completed',
    reference: tx.reference || null,
    notes: tx.notes || '',
    timeline: generateTimeline(type, tx.status, tx.timestamp),
    statusSummary: getStatusSummary(type, tx.status)
  };
}

function mapTransactionType(type) {
  const map = {
    'Deposit': 'Deposit',
    'Withdrawal': 'Withdrawal',
    'Escrow Release': 'Escrow',
    'Inflow': 'Invoice',
    'Outflow': 'Invoice',
    'Escrow Funded': 'Escrow',
    'Escrow': 'Escrow',
    'Invoice': 'Invoice',
    'Settlement': 'Settlement',
    'Refund': 'Refund',
    'Transfer': 'Transfer'
  };
  return map[type] || type;
}

function getTypeLabel(type) {
  const labels = {
    'Escrow': 'Escrow Funded',
    'Invoice': 'Invoice Paid',
    'Deposit': 'Deposit',
    'Withdrawal': 'Withdrawal',
    'Settlement': 'Settlement',
    'Refund': 'Refund',
    'Transfer': 'Transfer'
  };
  return labels[type] || type;
}

function getPaymentMethod(type) {
  const methods = {
    'Escrow': 'Escrow',
    'Invoice': 'Bank Transfer',
    'Deposit': 'Bank Transfer',
    'Withdrawal': 'Bank Transfer',
    'Settlement': 'Bank Transfer',
    'Refund': 'Card',
    'Transfer': 'Wallet'
  };
  return methods[type] || 'Bank Transfer';
}

function getCounterpartyFromDescription(desc, type) {
  if (!desc) return 'Unknown';
  const match = desc.match(/(?:to|from|by)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/);
  return match ? match[1] : (type === 'Deposit' ? 'Bank Transfer' : 'Unknown');
}

function getStatusSummary(type, status) {
  if (status === 'Pending') return 'Awaiting Processing';
  if (status === 'Completed') {
    const summaries = {
      'Escrow': 'Funds Held Securely in Escrow',
      'Invoice': 'Payment Received',
      'Deposit': 'Funds Added to Wallet',
      'Withdrawal': 'Withdrawal Initiated',
      'Settlement': 'Settlement Completed',
      'Refund': 'Refund Completed',
      'Transfer': 'Transfer Completed'
    };
    return summaries[type] || 'Transaction Completed';
  }
  if (status === 'Failed') return 'Transaction Failed';
  if (status === 'Cancelled') return 'Transaction Cancelled';
  if (status === 'Disputed') return 'Dispute Opened';
  return status;
}

function generateTimeline(type, status, date) {
  const baseDate = new Date(date);
  const events = [];
  if (type === 'Escrow') {
    events.push(
      { event: 'Payment Invite Created', date: new Date(baseDate.getTime() - 7 * 86400000).toISOString(), completed: true },
      { event: 'Escrow Funded', date: baseDate.toISOString(), completed: true },
      { event: 'Work Started', date: new Date(baseDate.getTime() + 1 * 86400000).toISOString(), completed: status !== 'Pending' },
      { event: 'Delivered', date: new Date(baseDate.getTime() + 14 * 86400000).toISOString(), completed: status === 'Released' || status === 'Completed' },
      { event: 'Released', date: new Date(baseDate.getTime() + 15 * 86400000).toISOString(), completed: status === 'Released' || status === 'Completed' },
      { event: 'Completed', date: new Date(baseDate.getTime() + 16 * 86400000).toISOString(), completed: status === 'Completed' }
    );
  } else if (type === 'Invoice') {
    events.push(
      { event: 'Invoice Sent', date: new Date(baseDate.getTime() - 3 * 86400000).toISOString(), completed: true },
      { event: 'Invoice Viewed', date: new Date(baseDate.getTime() - 2 * 86400000).toISOString(), completed: true },
      { event: 'Payment Received', date: baseDate.toISOString(), completed: status === 'Completed' },
      { event: 'Completed', date: baseDate.toISOString(), completed: status === 'Completed' }
    );
  } else if (type === 'Deposit') {
    events.push(
      { event: 'Deposit Initiated', date: baseDate.toISOString(), completed: true },
      { event: 'Funds Received', date: baseDate.toISOString(), completed: status === 'Completed' },
      { event: 'Available in Wallet', date: baseDate.toISOString(), completed: status === 'Completed' }
    );
  } else if (type === 'Withdrawal') {
    events.push(
      { event: 'Withdrawal Requested', date: baseDate.toISOString(), completed: true },
      { event: 'Processing', date: baseDate.toISOString(), completed: status === 'Completed' },
      { event: 'Funds Sent to Bank', date: baseDate.toISOString(), completed: status === 'Completed' }
    );
  } else {
    events.push(
      { event: 'Transaction Initiated', date: baseDate.toISOString(), completed: true },
      { event: 'Processing', date: baseDate.toISOString(), completed: status === 'Completed' },
      { event: 'Completed', date: baseDate.toISOString(), completed: status === 'Completed' }
    );
  }
  return events;
}

// --- Computed ---

const filteredTransactions = computed(() => {
  let list = [...transactions.value];
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(tx =>
      tx.transactionId.toLowerCase().includes(q) ||
      (tx.escrowId && tx.escrowId.toLowerCase().includes(q)) ||
      (tx.invoiceNumber && tx.invoiceNumber.toLowerCase().includes(q)) ||
      tx.projectName.toLowerCase().includes(q) ||
      tx.counterparty.toLowerCase().includes(q) ||
      tx.description.toLowerCase().includes(q)
    );
  }
  if (statusFilter.value !== 'All') {
    list = list.filter(tx => tx.status.toLowerCase() === statusFilter.value.toLowerCase());
  }
  if (typeFilter.value !== 'All') {
    list = list.filter(tx => tx.type === typeFilter.value);
  }
  if (dateFilter.value !== 'All') {
    const now = new Date();
    let startDate;
    switch (dateFilter.value) {
      case 'Today': startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
      case 'Last 7 Days': startDate = new Date(now.getTime() - 7 * 86400000); break;
      case 'Last 30 Days': startDate = new Date(now.getTime() - 30 * 86400000); break;
      case 'Last 90 Days': startDate = new Date(now.getTime() - 90 * 86400000); break;
      case 'This Year': startDate = new Date(now.getFullYear(), 0, 1); break;
      case 'Custom Range':
        if (customDateRange.value.start) startDate = new Date(customDateRange.value.start);
        break;
    }
    if (startDate) list = list.filter(tx => new Date(tx.date) >= startDate);
    if (dateFilter.value === 'Custom Range' && customDateRange.value.end) {
      const endDate = new Date(customDateRange.value.end);
      endDate.setHours(23, 59, 59, 999);
      list = list.filter(tx => new Date(tx.date) <= endDate);
    }
  }
  list.sort((a, b) => {
    let cmp = 0;
    if (sortField.value === 'date') cmp = new Date(a.date) - new Date(b.date);
    else if (sortField.value === 'amount') cmp = a.amount - b.amount;
    else if (sortField.value === 'status') cmp = a.status.localeCompare(b.status);
    return sortDirection.value === 'desc' ? -cmp : cmp;
  });
  return list;
});

const totalPages = computed(() => Math.ceil(filteredTransactions.value.length / itemsPerPage.value) || 1);

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredTransactions.value.slice(start, start + itemsPerPage.value);
});

const summaryCards = computed(() => {
  const all = transactions.value;
  const completed = all.filter(tx => tx.status === 'Completed');
  const received = completed.filter(tx => !tx.isOutgoing);
  const sent = completed.filter(tx => tx.isOutgoing);
  const activeEscrows = all.filter(tx => tx.type === 'Escrow' && ['Funded', 'In Progress', 'Pending'].includes(tx.status));
  return {
    totalTransactions: all.length,
    moneyReceived: received.reduce((sum, tx) => sum + tx.amount, 0),
    moneySent: sent.reduce((sum, tx) => sum + tx.amount, 0),
    activeEscrows: activeEscrows.length
  };
});

const currentSortLabel = computed(() => {
  const opt = sortOptions.find(o => o.field === sortField.value && o.dir === sortDirection.value);
  return opt ? opt.label : 'Newest First';
});

// --- Methods ---
function handlePageChange(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function setSort(option) {
  sortField.value = option.field;
  sortDirection.value = option.dir;
}

function openDrawer(tx) {
  selectedTransaction.value = tx;
  showDrawer.value = true;
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  showDrawer.value = false;
  document.body.style.overflow = '';
  setTimeout(() => { selectedTransaction.value = null; }, 300);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function getTypeIcon(type) {
  const icons = { 'Escrow': Shield, 'Invoice': FileText, 'Deposit': ArrowDownLeft, 'Withdrawal': ArrowUpRight, 'Settlement': Landmark, 'Refund': RotateCcw, 'Transfer': ArrowLeftRight };
  return icons[type] || Receipt;
}

function getTypeIconBg(type) {
  const bgs = { 'Escrow': 'bg-indigo-50 text-indigo-600', 'Invoice': 'bg-blue-50 text-blue-600', 'Deposit': 'bg-emerald-50 text-emerald-600', 'Withdrawal': 'bg-amber-50 text-amber-600', 'Settlement': 'bg-purple-50 text-purple-600', 'Refund': 'bg-rose-50 text-rose-600', 'Transfer': 'bg-cyan-50 text-cyan-600' };
  return bgs[type] || 'bg-slate-50 text-slate-600';
}

function getRoleBadgeClass(role) {
  const classes = { 'Client': 'bg-blue-50 text-blue-700 border-blue-100', 'Buyer': 'bg-cyan-50 text-cyan-700 border-cyan-100', 'Seller': 'bg-amber-50 text-amber-700 border-amber-100', 'Freelancer': 'bg-emerald-50 text-emerald-700 border-emerald-100', 'Agency': 'bg-purple-50 text-purple-700 border-purple-100' };
  return classes[role] || 'bg-slate-50 text-slate-600 border-slate-100';
}

function getStatusBadgeClass(status) {
  const norm = status.toLowerCase();
  const classes = {
    'completed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'released': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'funded': 'bg-blue-50 text-blue-700 border-blue-200',
    'pending': 'bg-amber-50 text-amber-700 border-amber-200',
    'awaiting funding': 'bg-amber-50 text-amber-700 border-amber-200',
    'in progress': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'delivered': 'bg-cyan-50 text-cyan-700 border-cyan-200',
    'refunded': 'bg-rose-50 text-rose-700 border-rose-200',
    'cancelled': 'bg-slate-50 text-slate-600 border-slate-200',
    'disputed': 'bg-red-50 text-red-700 border-red-200',
    'failed': 'bg-red-50 text-red-700 border-red-200'
  };
  return classes[norm] || 'bg-slate-50 text-slate-600 border-slate-200';
}

function getStatusDot(status) {
  const norm = status.toLowerCase();
  const colors = { 'completed': 'bg-emerald-500', 'released': 'bg-emerald-500', 'funded': 'bg-blue-500', 'pending': 'bg-amber-500', 'awaiting funding': 'bg-amber-500', 'in progress': 'bg-indigo-500', 'delivered': 'bg-cyan-500', 'refunded': 'bg-rose-500', 'cancelled': 'bg-slate-400', 'disputed': 'bg-red-500', 'failed': 'bg-red-500' };
  return colors[norm] || 'bg-slate-400';
}

function getPaymentMethodIcon(method) {
  const icons = { 'Bank Transfer': Landmark, 'Card': CreditCard, 'Wallet': Wallet, 'Escrow': Shield };
  return icons[method] || Landmark;
}

function exportCSV() {
  const rows = filteredTransactions.value;
  const headers = ['Transaction ID', 'Escrow ID', 'Invoice #', 'Project', 'Counterparty', 'Role', 'Type', 'Amount', 'Payment Method', 'Date', 'Status'];
  const csv = [headers.join(','), ...rows.map(tx => [tx.transactionId, tx.escrowId || '', tx.invoiceNumber || '', `"${tx.projectName}"`, `"${tx.counterparty}"`, tx.role, tx.type, (tx.isOutgoing ? '-' : '+') + tx.amount, tx.paymentMethod, formatDate(tx.date), tx.status].join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pact_transactions_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showExportMenu.value = false;
}

function exportExcel() { exportCSV(); showExportMenu.value = false; }
function exportPDF() { window.print(); showExportMenu.value = false; }

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name) {
  const colors = ['bg-emerald-100 text-emerald-700', 'bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700', 'bg-cyan-100 text-cyan-700', 'bg-indigo-100 text-indigo-700'];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getRoleIcon(role) {
  const icons = { 'Client': Building, 'Buyer': Store, 'Seller': Store, 'Freelancer': Code, 'Agency': Briefcase };
  return icons[role] || User;
}

function handleAction(action, tx) {
  openActionMenuId.value = null;
  if (action === 'View Details') { openDrawer(tx); }
  else if (action === 'Raise Dispute') { router.push('/disputes'); }
  else if (['Download Receipt', 'Download Invoice', 'Download Escrow Agreement'].includes(action)) {
    const blob = new Blob([`${action} for ${tx.transactionId}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${action.toLowerCase().replace(/\s+/g, '_')}_${tx.transactionId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

function getTimelineIcon(event) { return event.completed ? CheckCircle2 : Clock; }
function getTimelineColor(event) { return event.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'; }

const skeletonRows = Array(8).fill(null);
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-slate-900 tracking-tight">Transactions</h2>
        <p class="text-xs text-slate-500 mt-0.5">Track every escrow, invoice payment, refund, and settlement across your account.</p>
      </div>
      <div class="flex items-center gap-3">
        <PactButton variant="primary" size="md" class="!bg-[#0C513F] !border-[#0C513F] hover:!bg-[#0A3D2F]" @click="router.push('/payment-invites')">
          <Plus class="w-4 h-4" />
          New Payment Invite
        </PactButton>
        <div class="relative">
          <PactButton variant="secondary" size="md" @click="showExportMenu = !showExportMenu">
            <Download class="w-4 h-4" />
            Export
          </PactButton>
          <div v-if="showExportMenu" class="absolute right-0 top-full mt-2 w-44 bg-white rounded-2xl border border-slate-100 shadow-premium-lg py-2 z-50">
            <button v-for="opt in [{ label: 'Export as CSV', action: exportCSV }, { label: 'Export as Excel', action: exportExcel }, { label: 'Export as PDF', action: exportPDF }]" :key="opt.label" @click="opt.action" class="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
              <FileSpreadsheet v-if="opt.label.includes('CSV')" class="w-4 h-4 text-emerald-500" />
              <FileText v-else-if="opt.label.includes('Excel')" class="w-4 h-4 text-blue-500" />
              <File v-else class="w-4 h-4 text-red-500" />
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-2xl border border-slate-100 shadow-premium p-5 hover:shadow-premium-lg transition-all duration-200">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-[#0C513F]/10 text-[#0C513F]">
            <Receipt class="w-5 h-5" />
          </div>
          <div>
            <p class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Transactions</p>
            <p class="text-xl font-extrabold text-slate-900 mt-0.5">{{ summaryCards.totalTransactions.toLocaleString() }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 shadow-premium p-5 hover:shadow-premium-lg transition-all duration-200">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <ArrowDownLeft class="w-5 h-5" />
          </div>
          <div>
            <p class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Money Received</p>
            <p class="text-xl font-extrabold text-emerald-600 mt-0.5">₦{{ summaryCards.moneyReceived.toLocaleString() }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 shadow-premium p-5 hover:shadow-premium-lg transition-all duration-200">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-slate-50 text-slate-600">
            <ArrowUpRight class="w-5 h-5" />
          </div>
          <div>
            <p class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Money Sent</p>
            <p class="text-xl font-extrabold text-slate-900 mt-0.5">₦{{ summaryCards.moneySent.toLocaleString() }}</p>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-2xl border border-slate-100 shadow-premium p-5 hover:shadow-premium-lg transition-all duration-200">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <Shield class="w-5 h-5" />
          </div>
          <div>
            <p class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Active Escrows</p>
            <p class="text-xl font-extrabold text-slate-900 mt-0.5">{{ summaryCards.activeEscrows }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Transactions Card -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-premium overflow-hidden">
      <!-- Card Header -->
      <div class="px-6 py-5 border-b border-slate-100">
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 class="text-base font-bold text-slate-900">All Transactions</h3>
            <p class="text-xs text-slate-500 mt-0.5">View and manage your complete transaction history.</p>
          </div>
        </div>

        <!-- Filters Toolbar -->
        <div class="flex flex-col xl:flex-row xl:items-center gap-3 mt-4">
          <!-- Search -->
          <div class="relative flex-1 max-w-xs">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input v-model="searchQuery" type="text" placeholder="Search by ID, project, or name..." class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0C513F]/20 focus:border-[#0C513F] transition-all" />
          </div>

          <!-- Status Filter -->
          <div class="flex flex-wrap items-center gap-1.5 overflow-x-auto">
            <button v-for="f in statusFilters" :key="f" @click="statusFilter = f; currentPage = 1" class="px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all duration-150 cursor-pointer whitespace-nowrap" :class="statusFilter === f ? 'bg-[#0C513F]/10 border-[#0C513F]/30 text-[#0C513F] font-bold' : 'bg-slate-50/50 border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-slate-800'">{{ f }}</button>
          </div>
        </div>

        <!-- Second Row: Type, Date, Sort -->
        <div class="flex flex-wrap items-center gap-3 mt-3">
          <!-- Type Filter -->
          <div class="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Type:</span>
            <select v-model="typeFilter" @change="currentPage = 1" class="bg-transparent text-xs font-semibold text-slate-700 border-none focus:outline-none cursor-pointer">
              <option v-for="f in typeFilters" :key="f" :value="f">{{ f }}</option>
            </select>
          </div>

          <!-- Date Filter -->
          <div class="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Calendar class="w-3.5 h-3.5 text-slate-400" />
            <select v-model="dateFilter" @change="currentPage = 1" class="bg-transparent text-xs font-semibold text-slate-700 border-none focus:outline-none cursor-pointer">
              <option v-for="f in dateFilters" :key="f.value" :value="f.value">{{ f.label }}</option>
            </select>
          </div>

          <!-- Custom Date Range -->
          <!-- Sort -->
          <div class="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 relative">
            <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Sort:</span>
            <select @change="setSort(sortOptions.find(o => o.label === $event.target.value))" class="bg-transparent text-xs font-semibold text-slate-700 border-none focus:outline-none cursor-pointer">
              <option v-for="opt in sortOptions" :key="opt.label" :value="opt.label" :selected="opt.field === sortField && opt.dir === sortDirection">{{ opt.label }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading Skeleton -->
      <div v-if="loading" class="divide-y divide-slate-50">
        <div v-for="i in 8" :key="i" class="px-6 py-4">
          <div class="flex items-center gap-4 animate-pulse">
            <div class="w-10 h-10 rounded-xl bg-slate-100"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-slate-100 rounded w-48"></div>
              <div class="h-3 bg-slate-50 rounded w-32"></div>
            </div>
            <div class="h-4 bg-slate-100 rounded w-24"></div>
            <div class="h-6 bg-slate-100 rounded-full w-20"></div>
            <div class="h-4 bg-slate-100 rounded w-8"></div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredTransactions.length === 0" class="py-16 px-6">
        <div class="flex flex-col items-center justify-center text-center max-w-sm mx-auto">
          <div class="p-4 rounded-2xl bg-slate-50 mb-4">
            <Inbox class="w-12 h-12 text-slate-300" />
          </div>
          <h3 class="text-base font-bold text-slate-900">No Transactions Yet</h3>
          <p class="text-xs text-slate-500 mt-2 leading-relaxed">Your escrow agreements, invoice payments, and wallet activity will appear here once you start using Pact.</p>
          <div class="flex items-center gap-3 mt-6">
            <PactButton variant="primary" size="md" class="!bg-[#0C513F] !border-[#0C513F] hover:!bg-[#0A3D2F]" @click="router.push('/payment-invites')">
              <Plus class="w-4 h-4" />
              Create Payment Invite
            </PactButton>
            <PactButton variant="secondary" size="md" @click="router.push('/invoices')">
              <FileText class="w-4 h-4" />
              Create Invoice
            </PactButton>
          </div>
        </div>
      </div>

      <!-- Transaction Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-50">
              <th class="text-left px-6 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Transaction</th>
              <th class="text-left px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Counterparty</th>
              <th class="text-left px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Role</th>
              <th class="text-right px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
              <th class="text-left px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Payment Method</th>
              <th class="text-left px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Created</th>
              <th class="text-left px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              <th class="text-right px-6 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr
              v-for="tx in paginatedTransactions"
              :key="tx.id"
              class="group hover:bg-slate-50/50 transition-colors duration-150 cursor-pointer"
              @click="openDrawer(tx)"
            >
              <!-- Transaction Column -->
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="p-2 rounded-xl flex-shrink-0" :class="getTypeIconBg(tx.type)">
                    <component :is="getTypeIcon(tx.type)" class="w-4 h-4" />
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-bold text-slate-900 truncate max-w-[180px]">{{ tx.projectName }}</p>
                    <div class="flex items-center gap-1.5 mt-0.5">
                      <span class="text-[10px] font-mono font-semibold text-slate-400">{{ tx.transactionId }}</span>
                      <span v-if="tx.escrowId" class="text-[10px] font-mono font-semibold text-indigo-400">• {{ tx.escrowId }}</span>
                      <span v-if="tx.invoiceNumber" class="text-[10px] font-mono font-semibold text-blue-400">• {{ tx.invoiceNumber }}</span>
                    </div>
                    <p class="text-[10px] text-slate-400 mt-0.5 truncate max-w-[200px]">{{ tx.statusSummary }}</p>
                  </div>
                </div>
              </td>

              <!-- Counterparty -->
              <td class="px-4 py-4">
                <div class="flex items-center gap-2.5">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" :class="getAvatarColor(tx.counterparty)">
                    {{ getInitials(tx.counterparty) }}
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-slate-900 truncate max-w-[120px]">{{ tx.counterparty }}</p>
                    <p class="text-[10px] text-slate-400 truncate max-w-[120px]">{{ tx.counterpartyEmail }}</p>
                  </div>
                </div>
              </td>

              <!-- Role -->
              <td class="px-4 py-4">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border" :class="getRoleBadgeClass(tx.role)">
                  <component :is="getRoleIcon(tx.role)" class="w-3 h-3" />
                  {{ tx.role }}
                </span>
              </td>

              <!-- Amount -->
              <td class="px-4 py-4 text-right">
                <span class="text-sm font-extrabold" :class="tx.isOutgoing ? 'text-slate-600' : 'text-emerald-600'">
                  {{ tx.isOutgoing ? '-' : '+' }}₦{{ tx.amount.toLocaleString() }}
                </span>
              </td>

              <!-- Payment Method -->
              <td class="px-4 py-4 hidden lg:table-cell">
                <div class="flex items-center gap-1.5">
                  <component :is="getPaymentMethodIcon(tx.paymentMethod)" class="w-3.5 h-3.5 text-slate-400" />
                  <span class="text-xs font-semibold text-slate-600">{{ tx.paymentMethod }}</span>
                </div>
              </td>

              <!-- Date -->
              <td class="px-4 py-4 hidden md:table-cell">
                <p class="text-sm font-semibold text-slate-700">{{ formatDate(tx.date) }}</p>
                <p class="text-[10px] text-slate-400">{{ formatTime(tx.date) }}</p>
              </td>

              <!-- Status -->
              <td class="px-4 py-4">
                <div class="flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" :class="getStatusDot(tx.status)"></span>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border" :class="getStatusBadgeClass(tx.status)">
                    {{ tx.status }}
                  </span>
                </div>
              </td>

              <!-- Actions -->
              <td class="px-6 py-4 text-right relative" @click.stop>
                <button
                  @click="openActionMenuId = openActionMenuId === tx.id ? null : tx.id"
                  class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                >
                  <MoreHorizontal class="w-4 h-4" />
                </button>
                <div v-if="openActionMenuId === tx.id" class="absolute right-6 top-full mt-1 w-52 bg-white rounded-2xl border border-slate-100 shadow-premium-lg py-2 z-40">
                  <button
                    v-for="action in actionMenuOptions"
                    :key="action"
                    @click="handleAction(action, tx)"
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    :class="action === 'Raise Dispute' ? 'text-red-600 hover:bg-red-50' : ''"
                  >
                    <AlertTriangle v-if="action === 'Raise Dispute'" class="w-4 h-4 text-red-500" />
                    <Eye v-else-if="action === 'View Details'" class="w-4 h-4 text-slate-400" />
                    <FileText v-else-if="action.includes('Receipt')" class="w-4 h-4 text-slate-400" />
                    <FileText v-else-if="action.includes('Invoice')" class="w-4 h-4 text-blue-400" />
                    <File v-else-if="action.includes('Escrow')" class="w-4 h-4 text-indigo-400" />
                    <RotateCcw v-else-if="action === 'Refund'" class="w-4 h-4 text-amber-400" />
                    <Copy v-else class="w-4 h-4 text-slate-400" />
                    {{ action }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="!loading && filteredTransactions.length > 0" class="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p class="text-xs font-semibold text-slate-500">
          Showing {{ ((currentPage - 1) * itemsPerPage) + 1 }}–{{ Math.min(currentPage * itemsPerPage, filteredTransactions.length) }} of {{ filteredTransactions.length }} Transactions
        </p>
        <div class="flex items-center gap-2">
          <button
            @click="handlePageChange(currentPage - 1)"
            :disabled="currentPage === 1"
            class="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
          <div class="flex items-center gap-1">
            <button
              v-for="page in Math.min(totalPages, 7)"
              :key="page"
              @click="handlePageChange(page)"
              class="w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer"
              :class="currentPage === page ? 'bg-[#0C513F] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'"
            >{{ page }}</button>
          </div>
          <button
            @click="handlePageChange(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronRight class="w-4 h-4" />
          </button>
          <div class="flex items-center gap-1.5 ml-2">
            <span class="text-[10px] font-semibold text-slate-400">Rows:</span>
            <select v-model="itemsPerPage" class="bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 px-2 py-1 focus:outline-none cursor-pointer">
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Transaction Details Drawer -->
    <Teleport to="body">
      <Transition name="drawer">
        <div v-if="showDrawer && selectedTransaction" class="fixed inset-0 z-[100] flex justify-end">
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/20 backdrop-blur-sm" @click="closeDrawer"></div>
          <!-- Drawer Panel -->
          <div class="relative w-full max-w-lg bg-white shadow-2xl overflow-y-auto">
            <!-- Drawer Header -->
            <div class="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 class="text-base font-bold text-slate-900">Transaction Details</h3>
                <p class="text-[10px] font-mono font-semibold text-slate-400 mt-0.5">{{ selectedTransaction.transactionId }}</p>
              </div>
              <button @click="closeDrawer" class="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all cursor-pointer">
                <X class="w-5 h-5" />
              </button>
            </div>

            <div class="px-6 py-5 space-y-6">
              <!-- Transaction Summary -->
              <div class="bg-slate-50 rounded-2xl p-5">
                <div class="flex items-center gap-3 mb-4">
                  <div class="p-3 rounded-xl" :class="getTypeIconBg(selectedTransaction.type)">
                    <component :is="getTypeIcon(selectedTransaction.type)" class="w-6 h-6" />
                  </div>
                  <div>
                    <p class="text-lg font-extrabold text-slate-900">{{ selectedTransaction.projectName }}</p>
                    <p class="text-xs font-semibold text-slate-500">{{ selectedTransaction.typeLabel }}</p>
                  </div>
                </div>
                <div class="flex items-center justify-between py-3 border-t border-slate-100">
                  <span class="text-xs font-semibold text-slate-500">Amount</span>
                  <span class="text-lg font-extrabold" :class="selectedTransaction.isOutgoing ? 'text-slate-600' : 'text-emerald-600'">
                    {{ selectedTransaction.isOutgoing ? '-' : '+' }}₦{{ selectedTransaction.amount.toLocaleString() }}
                  </span>
                </div>
                <div class="flex items-center justify-between py-2">
                  <span class="text-xs font-semibold text-slate-500">Status</span>
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border" :class="getStatusBadgeClass(selectedTransaction.status)">
                    <span class="w-1.5 h-1.5 rounded-full" :class="getStatusDot(selectedTransaction.status)"></span>
                    {{ selectedTransaction.status }}
                  </span>
                </div>
                <div class="flex items-center justify-between py-2">
                  <span class="text-xs font-semibold text-slate-500">Status Summary</span>
                  <span class="text-xs font-semibold text-slate-700 text-right max-w-[200px]">{{ selectedTransaction.statusSummary }}</span>
                </div>
              </div>

              <!-- Counterparty Info -->
              <div>
                <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Counterparty</h4>
                <div class="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100">
                  <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" :class="getAvatarColor(selectedTransaction.counterparty)">
                    {{ getInitials(selectedTransaction.counterparty) }}
                  </div>
                  <div>
                    <p class="text-sm font-bold text-slate-900">{{ selectedTransaction.counterparty }}</p>
                    <p class="text-xs text-slate-500">{{ selectedTransaction.counterpartyEmail }}</p>
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border mt-1" :class="getRoleBadgeClass(selectedTransaction.role)">
                      <component :is="getRoleIcon(selectedTransaction.role)" class="w-3 h-3" />
                      {{ selectedTransaction.role }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Payment Info -->
              <div>
                <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Payment Information</h4>
                <div class="space-y-2">
                  <div class="flex items-center justify-between py-2 px-4 bg-white rounded-xl border border-slate-100">
                    <span class="text-xs font-semibold text-slate-500">Payment Method</span>
                    <div class="flex items-center gap-1.5">
                      <component :is="getPaymentMethodIcon(selectedTransaction.paymentMethod)" class="w-3.5 h-3.5 text-slate-400" />
                      <span class="text-xs font-bold text-slate-700">{{ selectedTransaction.paymentMethod }}</span>
                    </div>
                  </div>
                  <div class="flex items-center justify-between py-2 px-4 bg-white rounded-xl border border-slate-100">
                    <span class="text-xs font-semibold text-slate-500">Date</span>
                    <span class="text-xs font-bold text-slate-700">{{ formatDate(selectedTransaction.date) }} at {{ formatTime(selectedTransaction.date) }}</span>
                  </div>
                  <div v-if="selectedTransaction.escrowId" class="flex items-center justify-between py-2 px-4 bg-white rounded-xl border border-slate-100">
                    <span class="text-xs font-semibold text-slate-500">Escrow ID</span>
                    <span class="text-xs font-mono font-bold text-indigo-600">{{ selectedTransaction.escrowId }}</span>
                  </div>
                  <div v-if="selectedTransaction.invoiceNumber" class="flex items-center justify-between py-2 px-4 bg-white rounded-xl border border-slate-100">
                    <span class="text-xs font-semibold text-slate-500">Invoice #</span>
                    <span class="text-xs font-mono font-bold text-blue-600">{{ selectedTransaction.invoiceNumber }}</span>
                  </div>
                </div>
              </div>

              <!-- Timeline -->
              <div>
                <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Transaction Timeline</h4>
                <div class="relative pl-8 space-y-0">
                  <div v-for="(event, idx) in selectedTransaction.timeline" :key="idx" class="relative pb-5 last:pb-0">
                    <div class="absolute left-[-24px] top-0 flex flex-col items-center">
                      <div class="p-1 rounded-full" :class="getTimelineColor(event)">
                        <component :is="getTimelineIcon(event)" class="w-3 h-3" />
                      </div>
                      <div v-if="idx < selectedTransaction.timeline.length - 1" class="w-px h-full bg-slate-100 mt-1"></div>
                    </div>
                    <div>
                      <p class="text-sm font-semibold" :class="event.completed ? 'text-slate-900' : 'text-slate-400'">{{ event.event }}</p>
                      <p v-if="event.date" class="text-[10px] text-slate-400 mt-0.5">{{ formatDate(event.date) }} {{ formatTime(event.date) }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="space-y-2 pt-2">
                <PactButton variant="primary" size="md" class="w-full !bg-[#0C513F] !border-[#0C513F] hover:!bg-[#0A3D2F]" @click="router.push(`/contracts/${selectedTransaction.reference || ''}`)">
                  <ExternalLink class="w-4 h-4" />
                  View Escrow
                </PactButton>
                <PactButton variant="secondary" size="md" class="w-full" @click="handleAction('Download Receipt', selectedTransaction)">
                  <Download class="w-4 h-4" />
                  Download Receipt
                </PactButton>
                <PactButton variant="secondary" size="md" class="w-full" @click="handleAction('Download Invoice', selectedTransaction)">
                  <FileText class="w-4 h-4" />
                  Download Invoice
                </PactButton>
                <PactButton variant="ghost" size="md" class="w-full" @click="router.push(`/disputes`)">
                  <MessageCircle class="w-4 h-4" />
                  Contact Counterparty
                </PactButton>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}
.drawer-enter-from > div:last-child,
.drawer-leave-to > div:last-child {
  transform: translateX(100%);
}
.drawer-enter-active > div:last-child,
.drawer-leave-active > div:last-child {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>

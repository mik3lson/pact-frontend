<!-- src/views/wallet/Wallet.vue -->
<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { useContractsStore } from '../../stores/contracts';
import PactCard from '../../components/ui/PactCard.vue';
import PactButton from '../../components/ui/PactButton.vue';
import PactBadge from '../../components/ui/PactBadge.vue';
import PactInput from '../../components/ui/PactInput.vue';
import PactModal from '../../components/ui/PactModal.vue';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  TrendingUp, 
  Coins, 
  Wallet, 
  AlertCircle,
  HelpCircle,
  Building,
  CheckCircle,
  Inbox
} from '@lucide/vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const contractsStore = useContractsStore();

const searchQuery = ref('');
const activeFilter = ref('All');
const showWithdrawModal = ref(false);
const showDepositModal = ref(false);
const localError = ref('');
const loading = ref(false);

// Withdraw form fields
const withdrawAmount = ref('');
const selectedBankId = ref('');

// Deposit form fields
const depositAmount = ref('');
const selectedDepositBankId = ref('');

// Pagination state
const currentPage = ref(1);
const itemsPerPage = 8;

const filters = ['All', 'Deposit', 'Withdrawal', 'Escrow Hold', 'Escrow Release'];

onMounted(async () => {
  loading.value = true;
  await Promise.all([
    contractsStore.fetchWallet(),
    contractsStore.fetchTransactions()
  ]);
  
  // Set default bank selection if user has one
  const verifiedBanks = authStore.user?.bankAccounts?.filter(b => b.status === 'Verified') || [];
  if (verifiedBanks.length > 0) {
    selectedBankId.value = verifiedBanks[0].id;
    selectedDepositBankId.value = verifiedBanks[0].id;
  }
  
  if (route.query.withdraw === 'true') {
    showWithdrawModal.value = true;
  }
  if (route.query.deposit === 'true') {
    showDepositModal.value = true;
  }
  loading.value = false;
});

// Watch query parameters
watch(() => route.query.withdraw, (val) => {
  if (val === 'true') showWithdrawModal.value = true;
});
watch(() => route.query.deposit, (val) => {
  if (val === 'true') showDepositModal.value = true;
});

const closeWithdrawModal = () => {
  showWithdrawModal.value = false;
  router.replace('/wallet');
};

const closeDepositModal = () => {
  showDepositModal.value = false;
  router.replace('/wallet');
};

// Filtered Bank accounts
const verifiedBanks = computed(() => {
  return authStore.user?.bankAccounts?.filter(b => b.status === 'Verified') || [];
});

const selectedBankDetails = computed(() => {
  return verifiedBanks.value.find(b => b.id === selectedBankId.value);
});

// Filter & Search Ledger
const filteredTransactions = computed(() => {
  let list = contractsStore.transactions || [];

  // Filter
  if (activeFilter.value !== 'All') {
    list = list.filter(tx => tx.type.toLowerCase() === activeFilter.value.toLowerCase());
  }

  // Search
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

// Paginated Transactions
const totalPages = computed(() => {
  return Math.ceil(filteredTransactions.value.length / itemsPerPage) || 1;
});

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredTransactions.value.slice(start, start + itemsPerPage);
});

// Form Submissions
const handleWithdraw = async () => {
  localError.value = '';
  const amount = Number(withdrawAmount.value);

  if (!amount || amount <= 0) {
    localError.value = 'Please enter a valid withdrawal amount.';
    return;
  }

  if (amount > contractsStore.wallet.withdrawable) {
    localError.value = 'Withdrawal amount exceeds your withdrawable balance.';
    return;
  }

  if (!selectedBankId.value) {
    localError.value = 'Please select a payout destination bank account.';
    return;
  }

  loading.value = true;
  try {
    const bank = selectedBankDetails.value;
    await contractsStore.withdrawFunds(amount, bank.id, bank.bankName, bank.accountNumber);
    withdrawAmount.value = '';
    closeWithdrawModal();
  } catch (err) {
    localError.value = err.response?.data?.message || 'Withdrawal transaction failed.';
  } finally {
    loading.value = false;
  }
};

const handleDeposit = async () => {
  localError.value = '';
  const amount = Number(depositAmount.value);

  if (!amount || amount <= 0) {
    localError.value = 'Please enter a valid deposit amount.';
    return;
  }

  loading.value = true;
  try {
    await authStore.depositFunds(amount, selectedDepositBankId.value);
    await contractsStore.fetchWallet();
    await contractsStore.fetchTransactions();
    depositAmount.value = '';
    closeDepositModal();
  } catch (err) {
    localError.value = err.response?.data?.message || 'Deposit failed.';
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};
</script>

<template>
  <div class="space-y-6">
    
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-slate-900 tracking-tight">Wallet & Ledger</h2>
        <p class="text-xs text-slate-500 mt-0.5">Control payout flows, deposits, and ledger transaction streams</p>
      </div>

      <div class="flex items-center gap-2">
        <PactButton @click="showDepositModal = true" variant="secondary" size="sm">
          Deposit Funds
        </PactButton>
        <PactButton @click="showWithdrawModal = true" variant="primary" size="sm">
          Withdraw Funds
        </PactButton>
      </div>
    </div>

    <!-- Balance Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <!-- Card 1: Available Balance -->
      <PactCard padding="p-6" class="relative overflow-hidden">
        <div class="absolute right-4 top-4 text-brand-100 opacity-20">
          <Wallet class="w-16 h-16 stroke-[1.5]" />
        </div>
        <div class="flex justify-between items-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <span>Available Cash</span>
          <span class="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg text-[10px]">Withdrawable</span>
        </div>
        <div class="mt-4">
          <h3 class="text-3xl font-extrabold text-slate-900">${{ (contractsStore.wallet?.available || 0).toLocaleString() }}</h3>
          <p class="text-xs text-slate-400 mt-1.5 leading-relaxed">Liquid cash available for instant bank transfer payouts.</p>
        </div>
      </PactCard>

      <!-- Card 2: Funds in Escrow -->
      <PactCard padding="p-6" class="relative overflow-hidden">
        <div class="absolute right-4 top-4 text-blue-100 opacity-20">
          <Coins class="w-16 h-16 stroke-[1.5]" />
        </div>
        <div class="flex justify-between items-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <span>Escrow Hold Balance</span>
          <span class="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-[10px]">Locked</span>
        </div>
        <div class="mt-4">
          <h3 class="text-3xl font-extrabold text-slate-900">${{ (contractsStore.wallet?.escrow || 0).toLocaleString() }}</h3>
          <p class="text-xs text-slate-400 mt-1.5 leading-relaxed">Secured in multi-sig custody pending project milestone releases.</p>
        </div>
      </PactCard>

      <!-- Card 3: Ledger Total Transacted -->
      <PactCard padding="p-6" class="relative overflow-hidden">
        <div class="absolute right-4 top-4 text-emerald-100 opacity-20">
          <TrendingUp class="w-16 h-16 stroke-[1.5]" />
        </div>
        <div class="flex justify-between items-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <span>Cumulative Flow</span>
          <span class="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[10px]">All time</span>
        </div>
        <div class="mt-4">
          <h3 class="text-3xl font-extrabold text-slate-900">
            ${{ (contractsStore.transactions?.filter(tx => tx.status === 'Completed').reduce((sum, tx) => sum + tx.amount, 0) || 0).toLocaleString() }}
          </h3>
          <p class="text-xs text-slate-400 mt-1.5 leading-relaxed">Sum total of deposit receipts and payout releases on account.</p>
        </div>
      </PactCard>

    </div>

    <!-- Ledger List Table -->
    <div class="space-y-4">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-premium">
        <!-- Search bar -->
        <div class="w-full lg:w-72">
          <PactInput
            v-model="searchQuery"
            placeholder="Search ledger audit feed..."
            type="text"
          >
            <template #prefix>
              <Search class="w-4 h-4" />
            </template>
          </PactInput>
        </div>

        <!-- Filter tabs -->
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

      <!-- Transactions list table card -->
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
                <td class="px-6 py-4.5 font-semibold text-slate-500">{{ tx.type }}</td>
                <td class="px-6 py-4.5 text-slate-500">
                  {{ new Date(tx.timestamp).toLocaleString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}) }}
                </td>
                <td class="px-6 py-4.5">
                  <PactBadge :status="tx.status" />
                </td>
                <td class="px-6 py-4.5 text-right font-bold text-sm"
                  :class="[
                    tx.type === 'Withdrawal' || tx.type === 'Outflow' || tx.type === 'Escrow Hold'
                      ? 'text-slate-900'
                      : 'text-emerald-600'
                  ]"
                >
                  {{ tx.type === 'Withdrawal' || tx.type === 'Outflow' || tx.type === 'Escrow Hold' ? '-' : '+' }}${{ tx.amount.toLocaleString() }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty transaction state -->
        <div v-if="paginatedTransactions.length === 0" class="py-12 text-center">
          <Inbox class="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p class="text-xs text-slate-400 font-medium">No ledger listings matching criteria.</p>
        </div>

        <!-- Table pagination footer -->
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

    <!-- WITHDRAW FUNDS MODAL -->
    <PactModal 
      :show="showWithdrawModal" 
      title="Request Wallet Payout" 
      maxWidth="max-w-md"
      @close="closeWithdrawModal"
    >
      <div v-if="localError" class="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-1.5">
        <AlertCircle class="w-4 h-4 shrink-0 text-red-500" />
        {{ localError }}
      </div>

      <div class="space-y-4">
        <!-- Balance status summary -->
        <div class="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs font-medium">
          <span class="text-slate-500">Withdrawable Balance:</span>
          <span class="text-slate-900 font-extrabold text-sm">${{ contractsStore.wallet.withdrawable.toLocaleString() }} USD</span>
        </div>

        <!-- Bank list check -->
        <div v-if="verifiedBanks.length === 0" class="p-4 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl text-xs space-y-2">
          <p class="font-bold flex items-center gap-1">
            <AlertCircle class="w-4.5 h-4.5 text-amber-600" />
            No Verified Bank Accounts
          </p>
          <p class="text-[11px] leading-relaxed text-slate-600">
            You must add and verify a payout bank account in Settings before you can withdraw available funds.
          </p>
          <div class="pt-1">
            <PactButton @click="router.push('/settings?tab=bank')" variant="secondary" size="sm" class="w-full">
              Navigate to Bank Settings
            </PactButton>
          </div>
        </div>

        <div v-else class="space-y-4">
          <!-- Bank accounts selector -->
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-700 tracking-wide uppercase">Select Destination Account</label>
            <div class="space-y-2">
              <label 
                v-for="bank in verifiedBanks" 
                :key="bank.id"
                class="flex items-center gap-3 p-3 bg-white border rounded-xl cursor-pointer hover:bg-slate-50/50 transition-all select-none"
                :class="[ selectedBankId === bank.id ? 'border-brand-500 ring-1 ring-brand-500 bg-brand-50/5' : 'border-slate-200' ]"
              >
                <input 
                  type="radio" 
                  name="withdrawBank" 
                  :value="bank.id" 
                  v-model="selectedBankId"
                  class="text-brand-600 focus:ring-brand-500 h-4 w-4"
                />
                <Building class="w-5 h-5 text-slate-400 shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-bold text-slate-800">{{ bank.bankName }}</p>
                  <p class="text-[10px] text-slate-500">{{ bank.accountType }} account ({{ bank.accountNumber }})</p>
                </div>
                <span class="text-[9px] uppercase font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 rounded px-1.5 py-0.5">
                  Verified
                </span>
              </label>
            </div>
          </div>

          <!-- Amount -->
          <PactInput
            v-model="withdrawAmount"
            label="Payout Amount"
            type="number"
            placeholder="0.00"
            required
          >
            <template #prefix>
              <span class="text-xs font-semibold text-slate-400">$</span>
            </template>
          </PactInput>
        </div>
      </div>

      <template #footer>
        <PactButton variant="secondary" size="sm" @click="closeWithdrawModal">Cancel</PactButton>
        <PactButton 
          variant="primary" 
          size="sm" 
          :disabled="verifiedBanks.length === 0"
          :loading="loading"
          @click="handleWithdraw"
        >
          Confirm Payout
        </PactButton>
      </template>
    </PactModal>

    <!-- DEPOSIT FUNDS MODAL -->
    <PactModal 
      :show="showDepositModal" 
      title="Deposit Wallet Funds" 
      maxWidth="max-w-md"
      @close="closeDepositModal"
    >
      <div v-if="localError" class="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-1.5">
        <AlertCircle class="w-4 h-4 text-red-500" />
        {{ localError }}
      </div>

      <div class="space-y-4">
        <!-- Balance Status -->
        <div class="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs font-medium">
          <span class="text-slate-500">Available Wallet Balance:</span>
          <span class="text-slate-900 font-extrabold text-sm">${{ contractsStore.wallet.available.toLocaleString() }} USD</span>
        </div>

        <div v-if="verifiedBanks.length === 0" class="p-4 bg-amber-50 border border-amber-100 text-amber-800 rounded-xl text-xs space-y-2">
          <p class="font-bold flex items-center gap-1">
            <AlertCircle class="w-4.5 h-4.5 text-amber-600" />
            No Bank Accounts Linked
          </p>
          <p class="text-[11px] leading-relaxed text-slate-600">
            Please link a bank account in Settings to enable wire funding simulations.
          </p>
          <div class="pt-1">
            <PactButton @click="router.push('/settings?tab=bank')" variant="secondary" size="sm" class="w-full">
              Add Bank Account
            </PactButton>
          </div>
        </div>

        <div v-else class="space-y-4">
          <!-- Selection -->
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-700 tracking-wide uppercase">Select Funding Bank Source</label>
            <div class="space-y-2">
              <label 
                v-for="bank in verifiedBanks" 
                :key="bank.id"
                class="flex items-center gap-3 p-3 bg-white border rounded-xl cursor-pointer hover:bg-slate-50/50 transition-all select-none"
                :class="[ selectedDepositBankId === bank.id ? 'border-brand-500 ring-1 ring-brand-500 bg-brand-50/5' : 'border-slate-200' ]"
              >
                <input 
                  type="radio" 
                  name="depositBank" 
                  :value="bank.id" 
                  v-model="selectedDepositBankId"
                  class="text-brand-600 focus:ring-brand-500 h-4 w-4"
                />
                <Building class="w-5 h-5 text-slate-400 shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-bold text-slate-800">{{ bank.bankName }}</p>
                  <p class="text-[10px] text-slate-500">{{ bank.accountType }} account ({{ bank.accountNumber }})</p>
                </div>
              </label>
            </div>
          </div>

          <!-- Amount -->
          <PactInput
            v-model="depositAmount"
            label="Deposit Amount (USD)"
            type="number"
            placeholder="0.00"
            required
          >
            <template #prefix>
              <span class="text-xs font-semibold text-slate-400">$</span>
            </template>
          </PactInput>
        </div>
      </div>

      <template #footer>
        <PactButton variant="secondary" size="sm" @click="closeDepositModal">Cancel</PactButton>
        <PactButton 
          variant="primary" 
          size="sm" 
          :disabled="verifiedBanks.length === 0"
          :loading="loading"
          @click="handleDeposit"
        >
          Confirm Wire Deposit
        </PactButton>
      </template>
    </PactModal>
  </div>
</template>

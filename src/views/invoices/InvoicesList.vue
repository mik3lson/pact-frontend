<!-- src/views/invoices/InvoicesList.vue -->
<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { useInvoicesStore } from '../../stores/invoices';
import { useContractsStore } from '../../stores/contracts';
import PactCard from '../../components/ui/PactCard.vue';
import PactButton from '../../components/ui/PactButton.vue';
import PactBadge from '../../components/ui/PactBadge.vue';
import PactInput from '../../components/ui/PactInput.vue';
import PactModal from '../../components/ui/PactModal.vue';
import PactAvatar from '../../components/ui/PactAvatar.vue';
import { 
  FileText, 
  Plus, 
  Search, 
  Trash2, 
  Printer, 
  Download, 
  CreditCard, 
  CheckCircle,
  AlertTriangle,
  FolderOpen
} from '@lucide/vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const invoicesStore = useInvoicesStore();
const contractsStore = useContractsStore();

const searchQuery = ref('');
const activeFilter = ref('All');
const showCreateModal = ref(false);
const showPreviewModal = ref(false);
const selectedInvoice = ref(null);
const createLoading = ref(false);
const payLoading = ref(false);
const localError = ref('');

// New Invoice form fields
const invoiceTitle = ref('');
const counterpartyEmail = ref('');
const dueDate = ref('');
const discount = ref(0);
const invoiceItems = ref([
  { description: 'Initial consulting and deliverables scoping', quantity: 1, rate: 800 }
]);

const filters = ['All', 'Paid', 'Sent', 'Draft', 'Cancelled'];

onMounted(async () => {
  await invoicesStore.fetchInvoices();
  await contractsStore.fetchWallet();
  
  if (route.query.create === 'true') {
    showCreateModal.value = true;
  }
});

// Watch query params to trigger modal
watch(() => route.query.create, (val) => {
  if (val === 'true') {
    showCreateModal.value = true;
  }
});

const closeCreateModal = () => {
  showCreateModal.value = false;
  router.replace('/invoices');
};

const addItemRow = () => {
  invoiceItems.value.push({ description: '', quantity: 1, rate: 0 });
};

const removeItemRow = (idx) => {
  if (invoiceItems.value.length > 1) {
    invoiceItems.value.splice(idx, 1);
  }
};

const subtotal = computed(() => {
  return invoiceItems.value.reduce((acc, curr) => acc + (Number(curr.rate) * Number(curr.quantity) || 0), 0);
});

const calculatedTax = computed(() => {
  return Math.round(subtotal.value * 0.08); // 8% tax
});

const calculatedTotal = computed(() => {
  return subtotal.value + calculatedTax.value - (Number(discount.value) || 0);
});

// Search & Filter list
const filteredInvoices = computed(() => {
  let list = invoicesStore.invoices || [];
  
  if (activeFilter.value !== 'All') {
    list = list.filter(inv => inv.status.toLowerCase() === activeFilter.value.toLowerCase());
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(inv => 
      inv.id.toLowerCase().includes(q) ||
      inv.title.toLowerCase().includes(q) ||
      inv.clientName.toLowerCase().includes(q) ||
      inv.freelancerName.toLowerCase().includes(q)
    );
  }

  return list;
});

const handleCreateInvoice = async (saveStatus = 'Sent') => {
  localError.value = '';
  
  if (!invoiceTitle.value || !counterpartyEmail.value || !dueDate.value) {
    localError.value = 'Please complete all invoice metadata details.';
    return;
  }

  for (let i = 0; i < invoiceItems.value.length; i++) {
    const item = invoiceItems.value[i];
    if (!item.description || item.quantity <= 0 || item.rate <= 0) {
      localError.value = 'Please fill description, quantity, and rate for all invoice items.';
      return;
    }
  }

  createLoading.value = true;
  
  try {
    const payload = {
      title: invoiceTitle.value,
      dueDate: dueDate.value,
      discount: discount.value,
      items: invoiceItems.value,
      status: saveStatus
    };
    
    if (authStore.isFreelancer) {
      payload.clientEmail = counterpartyEmail.value;
    } else {
      payload.freelancerEmail = counterpartyEmail.value;
    }

    await invoicesStore.createInvoice(payload);
    
    // Reset Form
    invoiceTitle.value = '';
    counterpartyEmail.value = '';
    dueDate.value = '';
    discount.value = 0;
    invoiceItems.value = [{ description: 'Initial consulting and deliverables scoping', quantity: 1, rate: 800 }];
    
    closeCreateModal();
    await invoicesStore.fetchInvoices();
  } catch (err) {
    localError.value = err.response?.data?.message || 'Failed to create invoice.';
  } finally {
    createLoading.value = false;
  }
};

const handleOpenPreview = (invoice) => {
  selectedInvoice.value = invoice;
  showPreviewModal.value = true;
};

const handlePayInvoice = async () => {
  if (!selectedInvoice.value) return;
  
  // Quick balance check before action
  if (contractsStore.wallet.available < selectedInvoice.value.total) {
    alert(`Insufficient available funds. Your current available wallet balance is $${contractsStore.wallet.available.toLocaleString()}, but invoice requires $${selectedInvoice.value.total.toLocaleString()}. Please seed your available balance first.`);
    return;
  }

  payLoading.value = true;
  try {
    const updated = await invoicesStore.payInvoice(selectedInvoice.value.id);
    selectedInvoice.value = updated;
    await invoicesStore.fetchInvoices();
  } catch (err) {
    alert(err.response?.data?.message || 'Invoice settlement failed.');
  } finally {
    payLoading.value = false;
  }
};

const handleCancelInvoice = async () => {
  if (!selectedInvoice.value) return;
  try {
    const updated = await invoicesStore.cancelInvoice(selectedInvoice.value.id);
    selectedInvoice.value = updated;
    await invoicesStore.fetchInvoices();
  } catch (err) {
    console.error(err);
  }
};

const triggerPDFExport = () => {
  alert('Exporting Invoice details as PDF. Generating billing assets and downloading file...');
  // Simulated download process
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-slate-900 tracking-tight">Invoicing</h2>
        <p class="text-xs text-slate-500 mt-0.5">Professional invoices and billing management</p>
      </div>

      <PactButton 
        @click="showCreateModal = true" 
        variant="primary" 
        class="self-start md:self-auto"
      >
        <Plus class="w-4 h-4" />
        Create Invoice
      </PactButton>
    </div>

    <!-- Filters & Search -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-premium">
      <!-- Search -->
      <div class="w-full lg:w-72">
        <PactInput
          v-model="searchQuery"
          placeholder="Search invoices or clients..."
          type="text"
        >
          <template #prefix>
            <Search class="w-4 h-4" />
          </template>
        </PactInput>
      </div>

      <!-- Filters tab row -->
      <div class="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
        <button
          v-for="filter in filters"
          :key="filter"
          @click="activeFilter = filter"
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

    <!-- Table content -->
    <PactCard v-if="filteredInvoices.length > 0" padding="p-0" class="overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase tracking-wider font-bold text-slate-500">
              <th class="px-6 py-4">Invoice ID</th>
              <th class="px-6 py-4">Title</th>
              <th class="px-6 py-4">{{ authStore.isFreelancer ? 'Client' : 'Freelancer' }}</th>
              <th class="px-6 py-4">Due Date</th>
              <th class="px-6 py-4">Total</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 text-xs font-medium text-slate-700">
            <tr v-for="invoice in filteredInvoices" :key="invoice.id" class="hover:bg-slate-50/30 transition">
              <td class="px-6 py-4.5 font-bold text-slate-900">{{ invoice.id }}</td>
              <td class="px-6 py-4.5 max-w-[200px] truncate" :title="invoice.title">{{ invoice.title }}</td>
              <td class="px-6 py-4.5">
                <div class="flex items-center gap-2">
                  <PactAvatar 
                    :src="authStore.isFreelancer ? invoice.clientAvatar : invoice.freelancerAvatar" 
                    :name="authStore.isFreelancer ? invoice.clientName : invoice.freelancerName"
                    size="sm"
                    class="h-5 w-5" 
                  />
                  <span class="truncate max-w-[120px]">{{ authStore.isFreelancer ? invoice.clientName : invoice.freelancerName }}</span>
                </div>
              </td>
              <td class="px-6 py-4.5 text-slate-500">{{ invoice.dueDate }}</td>
              <td class="px-6 py-4.5 font-bold text-slate-900">${{ invoice.total.toLocaleString() }}</td>
              <td class="px-6 py-4.5">
                <PactBadge :status="invoice.status" />
              </td>
              <td class="px-6 py-4.5 text-right">
                <PactButton @click="handleOpenPreview(invoice)" variant="secondary" size="sm">
                  View Invoice
                </PactButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </PactCard>

    <!-- Empty State -->
    <div v-else class="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-premium">
      <FileText class="w-12 h-12 text-slate-300 mx-auto mb-4" />
      <h3 class="text-base font-bold text-slate-800">No Invoices</h3>
      <p class="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
        No invoices match the current filter state or search query.
      </p>
      <div class="mt-6">
        <PactButton @click="showCreateModal = true" variant="primary" size="sm">
          Generate New Invoice
        </PactButton>
      </div>
    </div>

    <!-- CREATE INVOICE MODAL -->
    <PactModal 
      :show="showCreateModal" 
      title="Create Professional Invoice" 
      maxWidth="max-w-2xl"
      @close="closeCreateModal"
    >
      <div v-if="localError" class="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-1.5">
        <AlertTriangle class="w-4 h-4" />
        {{ localError }}
      </div>

      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Counterparty email -->
          <PactInput
            v-model="counterpartyEmail"
            :label="authStore.isFreelancer ? 'Client Email Address' : 'Freelancer Email Address'"
            type="email"
            :placeholder="authStore.isFreelancer ? 'client@pact.com' : 'freelancer@pact.com'"
            required
          />
          <!-- Due date -->
          <PactInput
            v-model="dueDate"
            label="Payment Due Date"
            type="date"
            required
          />
        </div>

        <!-- Title -->
        <PactInput
          v-model="invoiceTitle"
          label="Invoice Title / Description"
          placeholder="e.g. Design Sprint Deliverables & Mockups"
          required
        />

        <!-- Itemized lists builder -->
        <div class="border-t border-slate-100 pt-4">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Invoice Line Items</h4>
            <button
              type="button"
              @click="addItemRow"
              class="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 cursor-pointer"
            >
              <Plus class="w-3.5 h-3.5 stroke-[2.5]" />
              Add Line Item
            </button>
          </div>

          <div class="space-y-3 max-h-48 overflow-y-auto pr-1">
            <div 
              v-for="(item, idx) in invoiceItems" 
              :key="idx"
              class="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl"
            >
              <div class="md:col-span-6">
                <PactInput
                  v-model="item.description"
                  placeholder="Item details description..."
                />
              </div>
              <div class="md:col-span-2">
                <PactInput
                  v-model="item.quantity"
                  placeholder="Qty"
                  type="number"
                />
              </div>
              <div class="md:col-span-3">
                <PactInput
                  v-model="item.rate"
                  placeholder="Rate"
                  type="number"
                >
                  <template #prefix>
                    <span class="text-xs font-semibold text-slate-400">$</span>
                  </template>
                </PactInput>
              </div>
              <div class="md:col-span-1 flex items-end justify-center pb-2">
                <button
                  type="button"
                  @click="removeItemRow(idx)"
                  class="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 cursor-pointer transition"
                  :disabled="invoiceItems.length === 1"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Calculations panel -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
          <!-- Discount input -->
          <div>
            <PactInput
              v-model="discount"
              label="Simulate Discount / Adjustment"
              type="number"
            >
              <template #prefix>
                <span class="text-xs font-semibold text-slate-400">$</span>
              </template>
            </PactInput>
          </div>

          <!-- Total Calculation box -->
          <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-2">
            <div class="flex justify-between font-medium text-slate-500">
              <span>Subtotal:</span>
              <span>${{ subtotal.toLocaleString() }}</span>
            </div>
            <div class="flex justify-between font-medium text-slate-500">
              <span>Tax (8%):</span>
              <span>${{ calculatedTax.toLocaleString() }}</span>
            </div>
            <div class="flex justify-between font-medium text-slate-500 text-red-500" v-if="discount > 0">
              <span>Discount:</span>
              <span>-${{ Number(discount).toLocaleString() }}</span>
            </div>
            <div class="h-px bg-slate-200 my-1"></div>
            <div class="flex justify-between font-extrabold text-sm text-slate-900">
              <span>Total Bill:</span>
              <span>${{ calculatedTotal.toLocaleString() }} USD</span>
            </div>
          </div>
        </div>

      </div>

      <template #footer>
        <PactButton variant="secondary" size="sm" @click="closeCreateModal">Cancel</PactButton>
        <PactButton variant="ghost" size="sm" @click="handleCreateInvoice('Draft')">Save as Draft</PactButton>
        <PactButton 
          variant="primary" 
          size="sm" 
          :loading="createLoading"
          @click="handleCreateInvoice('Sent')"
        >
          Send to Client
        </PactButton>
      </template>
    </PactModal>

    <!-- INVOICE PREVIEW / DETAIL SHEET MODAL -->
    <PactModal 
      :show="showPreviewModal" 
      title="Invoice Audit & Details" 
      maxWidth="max-w-xl"
      @close="showPreviewModal = false"
    >
      <div v-if="selectedInvoice" class="space-y-6">
        
        <!-- Interactive status warnings -->
        <div 
          v-if="selectedInvoice.status === 'Sent' && authStore.isClient"
          class="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
        >
          <div class="flex gap-2 items-start text-amber-800 leading-relaxed">
            <CreditCard class="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p class="font-bold text-slate-900">Payment Required</p>
              <p class="text-[11px] text-slate-600 mt-0.5">Please settle this invoice using your available wallet funds.</p>
            </div>
          </div>
          <PactButton 
            @click="handlePayInvoice" 
            variant="success" 
            size="sm" 
            :loading="payLoading"
            class="shrink-0"
          >
            Settle & Pay ${{ selectedInvoice.total.toLocaleString() }}
          </PactButton>
        </div>

        <!-- Rendered Sheet Mockup -->
        <div class="border border-slate-200/80 bg-white rounded-2xl shadow-sm p-6 relative overflow-hidden text-xs">
          <!-- Top diagonal stamp -->
          <div class="absolute top-4 right-4 uppercase tracking-widest font-extrabold text-[10px] py-1 px-3 border-2 rounded-xl transform rotate-3"
            :class="[
              selectedInvoice.status === 'Paid' ? 'border-emerald-500 text-emerald-500 bg-emerald-50/50' :
              selectedInvoice.status === 'Sent' ? 'border-amber-400 text-amber-500 bg-amber-50/50' :
              'border-slate-400 text-slate-400'
            ]"
          >
            {{ selectedInvoice.status }}
          </div>

          <!-- Header info -->
          <div class="flex items-center justify-between border-b border-slate-100 pb-4.5 mb-5">
            <div>
              <span class="text-[10px] uppercase font-bold text-brand-500">Pact Escrow Platform</span>
              <h4 class="text-base font-extrabold text-slate-900 mt-0.5">{{ selectedInvoice.id }}</h4>
              <p class="text-[10px] text-slate-400 mt-1">Issued: {{ new Date(selectedInvoice.createdAt).toLocaleDateString() }}</p>
            </div>
          </div>

          <!-- Billing parties -->
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p class="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Billed From</p>
              <p class="font-bold text-slate-800">{{ selectedInvoice.freelancerName }}</p>
              <p class="text-slate-500 text-[10px] mt-0.5">{{ selectedInvoice.freelancerEmail }}</p>
            </div>
            <div>
              <p class="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Billed To</p>
              <p class="font-bold text-slate-800">{{ selectedInvoice.clientName }}</p>
              <p class="text-slate-500 text-[10px] mt-0.5">{{ selectedInvoice.clientEmail }}</p>
            </div>
          </div>

          <!-- Itemized table -->
          <table class="w-full text-left border-collapse border-y border-slate-100 mb-6">
            <thead>
              <tr class="text-[9px] font-bold text-slate-400 uppercase border-b border-slate-100 bg-slate-50/20">
                <th class="py-2.5">Description</th>
                <th class="py-2.5 text-center">Qty</th>
                <th class="py-2.5 text-right">Rate</th>
                <th class="py-2.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-[11px] font-semibold text-slate-700">
              <tr v-for="(item, idx) in selectedInvoice.items" :key="idx">
                <td class="py-3 pr-4 max-w-[200px] truncate">{{ item.description }}</td>
                <td class="py-3 text-center text-slate-500">{{ item.quantity }}</td>
                <td class="py-3 text-right text-slate-500">${{ item.rate.toLocaleString() }}</td>
                <td class="py-3 text-right font-bold text-slate-900">${{ item.amount.toLocaleString() }}</td>
              </tr>
            </tbody>
          </table>

          <!-- Totals block -->
          <div class="w-56 ml-auto space-y-1.5 text-right text-[11px]">
            <div class="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span class="font-bold text-slate-700">${{ selectedInvoice.subtotal.toLocaleString() }}</span>
            </div>
            <div class="flex justify-between text-slate-500">
              <span>Tax (8%):</span>
              <span class="font-bold text-slate-700">${{ selectedInvoice.tax.toLocaleString() }}</span>
            </div>
            <div class="flex justify-between text-red-500 font-semibold" v-if="selectedInvoice.discount > 0">
              <span>Discount:</span>
              <span>-${{ selectedInvoice.discount.toLocaleString() }}</span>
            </div>
            <div class="h-px bg-slate-200 my-1.5"></div>
            <div class="flex justify-between text-slate-900 font-extrabold text-xs">
              <span>Grand Total:</span>
              <span class="text-brand-600">${{ selectedInvoice.total.toLocaleString() }} USD</span>
            </div>
          </div>
        </div>

        <!-- Utility download panel -->
        <div class="flex items-center justify-between border-t border-slate-100 pt-4.5 bg-slate-50/20">
          <PactButton 
            v-if="selectedInvoice.status === 'Sent' && authStore.isFreelancer"
            @click="handleCancelInvoice" 
            variant="ghost" 
            size="sm"
            class="text-red-500 hover:bg-red-50"
          >
            Cancel Invoice
          </PactButton>
          <div class="flex items-center gap-2 ml-auto">
            <PactButton @click="triggerPDFExport" variant="secondary" size="sm">
              <Download class="w-3.5 h-3.5" />
              Simulate PDF
            </PactButton>
            <PactButton @click="window.print()" variant="secondary" size="sm">
              <Printer class="w-3.5 h-3.5" />
              Print
            </PactButton>
          </div>
        </div>

      </div>
    </PactModal>
  </div>
</template>

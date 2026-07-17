<!-- src/views/contracts/ContractsList.vue -->
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
import PactAvatar from '../../components/ui/PactAvatar.vue';
import { 
  FilePlus, 
  Search, 
  Calendar, 
  DollarSign, 
  ArrowRight,
  Trash2,
  AlertTriangle,
  FolderOpen
} from '@lucide/vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const contractsStore = useContractsStore();

const searchQuery = ref('');
const activeFilter = ref('All');
const showCreateModal = ref(false);
const createLoading = ref(false);
const localError = ref('');

// Form fields
const title = ref('');
const description = ref('');
const counterpartyEmail = ref('');
const dueDate = ref('');
const milestones = ref([
  { title: 'Initial Milestone / Kickoff', amount: '', dueDate: '' }
]);

const filters = ['All', 'Active', 'Pending', 'Funded', 'Submitted', 'Released', 'Disputed'];

onMounted(async () => {
  await contractsStore.fetchContracts();
  
  // Open creation modal if query param is set
  if (route.query.create === 'true') {
    showCreateModal.value = true;
  }
});

// Watch query params to open modal
watch(() => route.query.create, (val) => {
  if (val === 'true') {
    showCreateModal.value = true;
  }
});

// Sync close modal with routing query cleanup
const closeModal = () => {
  showCreateModal.value = false;
  router.replace('/contracts');
};

const addMilestoneRow = () => {
  milestones.value.push({ title: '', amount: '', dueDate: '' });
};

const removeMilestoneRow = (idx) => {
  if (milestones.value.length > 1) {
    milestones.value.splice(idx, 1);
  }
};

const contractTotalAmount = computed(() => {
  return milestones.value.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
});

// Filter & Search Logic
const filteredContracts = computed(() => {
  let list = contractsStore.contracts || [];
  
  // Status filter
  if (activeFilter.value !== 'All') {
    list = list.filter(c => c.status.toLowerCase() === activeFilter.value.toLowerCase());
  }
  
  // Search query (title, counterparty name)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(c => 
      c.title.toLowerCase().includes(q) || 
      c.clientName.toLowerCase().includes(q) || 
      c.freelancerName.toLowerCase().includes(q)
    );
  }
  
  return list;
});

const getMilestoneProgress = (contract) => {
  if (!contract.milestones || contract.milestones.length === 0) return 0;
  const released = contract.milestones.filter(m => m.status === 'Released' || m.status === 'Approved').length;
  return Math.round((released / contract.milestones.length) * 100);
};

const handleCreateContract = async () => {
  localError.value = '';
  
  if (!title.value || !description.value || !counterpartyEmail.value || !dueDate.value) {
    localError.value = 'Please fill out all contract metadata fields.';
    return;
  }

  // Validate milestones
  for (let i = 0; i < milestones.value.length; i++) {
    const m = milestones.value[i];
    if (!m.title || !m.amount || !m.dueDate) {
      localError.value = 'Please complete all fields for each milestone.';
      return;
    }
  }

  createLoading.value = true;
  
  try {
    const payload = {
      title: title.value,
      description: description.value,
      dueDate: dueDate.value,
      milestones: milestones.value,
    };
    
    if (authStore.isClient) {
      payload.freelancerEmail = counterpartyEmail.value;
    } else {
      payload.clientEmail = counterpartyEmail.value;
    }
    
    await contractsStore.createContract(payload);
    
    // Reset form
    title.value = '';
    description.value = '';
    counterpartyEmail.value = '';
    dueDate.value = '';
    milestones.value = [{ title: 'Initial Milestone / Kickoff', amount: '', dueDate: '' }];
    
    closeModal();
    await contractsStore.fetchContracts();
  } catch (err) {
    localError.value = err.response?.data?.message || 'Failed to create contract.';
  } finally {
    createLoading.value = false;
  }
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-slate-900 tracking-tight">Escrow Contracts</h2>
        <p class="text-xs text-slate-500 mt-0.5">Secure, multi-milestone payment workflows</p>
      </div>

      <PactButton 
        @click="showCreateModal = true" 
        variant="primary" 
        class="self-start md:self-auto !bg-[#0C513F] !border-[#0C513F] hover:!bg-[#0A3D2F]"
      >
        <FilePlus class="w-4 h-4" />
        New Contract Draft
      </PactButton>
    </div>

    <!-- Filters and Search Bar -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-premium">
      <!-- Search -->
      <div class="w-full lg:w-72">
        <PactInput
          v-model="searchQuery"
          placeholder="Search contracts or parties..."
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
          class="px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-all duration-150 cursor-pointer"
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

    <!-- Contracts Grid -->
    <div v-if="filteredContracts.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <PactCard 
        v-for="contract in filteredContracts" 
        :key="contract.id"
        padding="p-6" 
        hoverable 
        class="flex flex-col justify-between"
      >
        <template #header>
          <div class="flex items-center justify-between gap-2">
            <span class="text-[10px] font-bold text-slate-400">ID: {{ contract.id.toUpperCase() }}</span>
            <PactBadge :status="contract.status" />
          </div>
        </template>

        <!-- Body -->
        <div class="space-y-4 flex-1">
          <div>
            <h4 class="text-sm font-bold text-slate-900 line-clamp-1 leading-snug" :title="contract.title">
              {{ contract.title }}
            </h4>
            <p class="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              {{ contract.description }}
            </p>
          </div>

          <!-- Counterparty Details -->
          <div class="flex items-center gap-2.5 p-2 bg-slate-50 border border-slate-100 rounded-xl">
            <template v-if="authStore.isClient">
              <PactAvatar :src="contract.freelancerAvatar" :name="contract.freelancerName" size="sm" />
              <div class="flex-1 min-w-0">
                <p class="text-[11px] text-slate-400 font-medium">Freelancer</p>
                <p class="text-xs font-bold text-slate-700 truncate">{{ contract.freelancerName }}</p>
              </div>
            </template>
            <template v-else>
              <PactAvatar :src="contract.clientAvatar" :name="contract.clientName" size="sm" />
              <div class="flex-1 min-w-0">
                <p class="text-[11px] text-slate-400 font-medium">Client Partner</p>
                <p class="text-xs font-bold text-slate-700 truncate">{{ contract.clientName }}</p>
              </div>
            </template>
          </div>

          <!-- Progress Bar -->
          <div class="space-y-1">
            <div class="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-wide">
              <span>Milestone Release</span>
              <span>{{ getMilestoneProgress(contract) }}%</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div 
                class="bg-brand-500 h-1.5 rounded-full transition-all duration-300"
                :style="{ width: `${getMilestoneProgress(contract)}%` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <template #footer>
          <div class="w-full flex items-center justify-between pt-1">
            <div>
              <p class="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Escrow Amount</p>
              <p class="text-sm font-bold text-slate-900">${{ contract.escrowAmount.toLocaleString() }}</p>
            </div>
            <PactButton 
              @click="router.push(`/contracts/${contract.id}`)" 
              variant="secondary" 
              size="sm"
            >
              Open Escrow Portal
              <ArrowRight class="w-3.5 h-3.5" />
            </PactButton>
          </div>
        </template>
      </PactCard>
    </div>

    <!-- Empty State -->
    <div v-else class="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-premium">
      <FolderOpen class="w-12 h-12 text-slate-300 mx-auto mb-4" />
      <h3 class="text-base font-bold text-slate-800">No Contracts Found</h3>
      <p class="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
        There are no contracts matching your current status filter or search parameters.
      </p>
      <div class="mt-6">
        <PactButton @click="showCreateModal = true" variant="primary" size="sm">
          Draft a New Proposal
        </PactButton>
      </div>
    </div>

    <!-- CREATE CONTRACT DRAFT MODAL -->
    <PactModal 
      :show="showCreateModal" 
      title="Create Contract Proposal" 
      maxWidth="max-w-xl"
      @close="closeModal"
    >
      <!-- Error notification inside modal -->
      <div v-if="localError" class="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-semibold text-red-600 flex items-center gap-1.5">
        <AlertTriangle class="w-4 h-4 text-red-500" />
        {{ localError }}
      </div>

      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Counterparty Email -->
          <PactInput
            v-model="counterpartyEmail"
            :label="authStore.isClient ? 'Freelancer Email Address' : 'Client Email Address'"
            type="email"
            :placeholder="authStore.isClient ? 'freelancer@pact.com' : 'client@pact.com'"
            required
          />
          <!-- Due date -->
          <PactInput
            v-model="dueDate"
            label="Target Completion Date"
            type="date"
            required
          />
        </div>

        <!-- Contract Title -->
        <PactInput
          v-model="title"
          label="Contract Title"
          placeholder="e.g., Mobile Application UI Design & Wireframes"
          required
        />

        <!-- Contract Description -->
        <PactInput
          v-model="description"
          label="Project Description & Scope"
          type="textarea"
          placeholder="Detail the deliverables, terms, and final milestones expectations..."
          required
        />

        <!-- Milestones Section Builder -->
        <div class="border-t border-slate-100 pt-4">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wide">Payment Milestones</h4>
            <button
              type="button"
              @click="addMilestoneRow"
              class="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 cursor-pointer"
            >
              <Plus class="w-3.5 h-3.5 stroke-[2.5]" />
              Add Milestone
            </button>
          </div>

          <div class="space-y-3 max-h-56 overflow-y-auto pr-1">
            <div 
              v-for="(milestone, idx) in milestones" 
              :key="idx" 
              class="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl relative"
            >
              <div class="md:col-span-6">
                <PactInput
                  v-model="milestone.title"
                  placeholder="Milestone title (e.g. Figma V1)"
                  type="text"
                />
              </div>
              <div class="md:col-span-3">
                <PactInput
                  v-model="milestone.amount"
                  placeholder="Budget"
                  type="number"
                >
                  <template #prefix>
                    <span class="text-xs font-semibold text-slate-400">$</span>
                  </template>
                </PactInput>
              </div>
              <div class="md:col-span-3 flex items-center gap-1.5">
                <PactInput
                  v-model="milestone.dueDate"
                  type="date"
                />
                <!-- Trash row -->
                <button
                  type="button"
                  @click="removeMilestoneRow(idx)"
                  class="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition cursor-pointer self-end mb-0.5"
                  :disabled="milestones.length === 1"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Realtime Budget Summary -->
        <div class="bg-brand-50/40 border border-brand-100 rounded-xl p-3.5 flex items-center justify-between text-xs">
          <span class="font-bold text-slate-700">Calculated Escrow Deposit</span>
          <span class="text-sm font-bold text-brand-600">${{ contractTotalAmount.toLocaleString() }} USD</span>
        </div>
      </div>

      <template #footer>
        <PactButton variant="secondary" size="sm" @click="closeModal">Cancel</PactButton>
        <PactButton 
          variant="primary" 
          size="sm" 
          :loading="createLoading"
          @click="handleCreateContract"
        >
          {{ authStore.isClient ? 'Fund & Launch Contract' : 'Propose Contract' }}
        </PactButton>
      </template>
    </PactModal>
  </div>
</template>

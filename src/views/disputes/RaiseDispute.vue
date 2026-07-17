<!-- src/views/disputes/RaiseDispute.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useDisputesStore } from '../../stores/disputes';
import { useAuthStore } from '../../stores/auth';
import PactButton from '../../components/ui/PactButton.vue';
import PactBadge from '../../components/ui/PactBadge.vue';
import {
  ShieldAlert,
  Scale,
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Search,
  AlertTriangle,
  FileText,
  Upload,
  Clock,
  User,
  Briefcase,
  Building,
  Store,
  Code,
  Palette,
  PenTool,
  MessageCircle,
  DollarSign,
  XCircle,
  HelpCircle,
  Image,
  File,
  Film,
  Archive,
  FileSpreadsheet,
  FileEdit,
  ChevronDown,
  CheckCircle2,
  Loader,
  Send,
  Gavel,
  Eye,
  EyeOff,
  Calendar,
  Hash,
  BadgeCheck,
  UserCheck,
  Users,
  Star,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Flag,
  Ban,
  Handshake,
  Undo2,
  Copy,
  ExternalLink
} from '@lucide/vue';

const emit = defineEmits(['close', 'submitted']);
const router = useRouter();
const disputesStore = useDisputesStore();
const authStore = useAuthStore();

// --- State ---
const currentStep = ref(1);
const totalSteps = 8;
const loading = ref(false);
const submitting = ref(false);
const showConfirmModal = ref(false);
const showSuccess = ref(false);
const submittedDispute = ref(null);
const escrowSearchQuery = ref('');
const escrowDropdownOpen = ref(false);

// --- Form Data ---
const selectedEscrow = ref(null);
const eligibleEscrows = ref([]);
const loadingEscrows = ref(false);
const reason = ref('');
const explanation = ref('');
const desiredResolution = ref('');
const evidence = ref([]);
const dragOver = ref(false);

// --- Computed ---
const userRole = computed(() => {
  return authStore.user?.role || 'freelancer';
});

const userRoleLabel = computed(() => {
  const role = userRole.value;
  const labels = {
    client: 'Client',
    freelancer: 'Freelancer',
    buyer: 'Buyer',
    seller: 'Seller',
    agency: 'Agency'
  };
  return labels[role] || role.charAt(0).toUpperCase() + role.slice(1);
});

const isBuyerRole = computed(() => {
  return ['client', 'buyer'].includes(userRole.value);
});

const disputeReasons = computed(() => {
  if (isBuyerRole.value) {
    return [
      { id: 'not_delivered', icon: XCircle, title: 'Work not delivered', desc: 'The work was never completed or handed over.' },
      { id: 'missed_deadline', icon: Clock, title: 'Missed deadline', desc: 'The agreed timeline was not met.' },
      { id: 'not_as_agreed', icon: FileEdit, title: 'Work not as agreed', desc: 'The delivered work does not match the agreement.' },
      { id: 'poor_quality', icon: ThumbsDown, title: 'Poor quality', desc: 'The quality of work is below acceptable standards.' },
      { id: 'partial_delivery', icon: FileText, title: 'Partial delivery', desc: 'Only part of the agreed work was delivered.' },
      { id: 'communication_stopped', icon: MessageCircle, title: 'Communication stopped', desc: 'The other party stopped responding.' },
      { id: 'suspected_fraud', icon: Ban, title: 'Suspected fraud', desc: 'I believe this may be fraudulent activity.' },
      { id: 'other', icon: HelpCircle, title: 'Other', desc: 'An issue not listed above.' }
    ];
  }
  return [
    { id: 'refuses_payment', icon: DollarSign, title: 'Client refuses to release payment', desc: 'Work was completed but payment is being withheld.' },
    { id: 'outside_agreement', icon: FileEdit, title: 'Client requesting work outside agreement', desc: 'Additional work requested beyond the original scope.' },
    { id: 'false_claim', icon: ThumbsDown, title: 'False claim', desc: 'The client made an inaccurate claim about the work.' },
    { id: 'client_unresponsive', icon: MessageCircle, title: 'Client became unresponsive', desc: 'The client stopped communicating.' },
    { id: 'payment_issue', icon: DollarSign, title: 'Payment issue', desc: 'There is a problem with the payment arrangement.' },
    { id: 'agreement_changed', icon: RefreshCw, title: 'Agreement changed', desc: 'The terms were changed without agreement.' },
    { id: 'abuse_or_misconduct', icon: Flag, title: 'Abuse or misconduct', desc: 'I experienced inappropriate behavior.' },
    { id: 'other', icon: HelpCircle, title: 'Other', desc: 'An issue not listed above.' }
  ];
});

const resolutionOptions = [
  { id: 'release_to_me', icon: Handshake, title: 'Release funds to me', desc: 'I am entitled to the full escrow amount.' },
  { id: 'refund_client', icon: Undo2, title: 'Refund the client', desc: 'The client should receive a full refund.' },
  { id: 'partial_refund', icon: DollarSign, title: 'Partial refund', desc: 'Split the escrow amount between both parties.' },
  { id: 'continue_project', icon: RefreshCw, title: 'Continue the project', desc: 'Resume work under modified terms.' },
  { id: 'cancel_escrow', icon: XCircle, title: 'Cancel escrow', desc: 'Cancel the escrow entirely.' },
  { id: 'other_resolution', icon: HelpCircle, title: 'Other', desc: 'Another resolution not listed.' }
];

const explanationValid = computed(() => {
  return explanation.value.trim().length >= 50;
});

const canSubmit = computed(() => {
  return selectedEscrow.value &&
    reason.value &&
    explanationValid.value &&
    desiredResolution.value;
});

const explanationCharCount = computed(() => explanation.value.length);

const filteredEscrows = computed(() => {
  if (!escrowSearchQuery.value.trim()) return eligibleEscrows.value;
  const q = escrowSearchQuery.value.toLowerCase();
  return eligibleEscrows.value.filter(e =>
    e.title.toLowerCase().includes(q) ||
    e.escrowId.toLowerCase().includes(q) ||
    e.counterpartyName.toLowerCase().includes(q)
  );
});

const stepProgress = computed(() => {
  return Math.round((currentStep.value / totalSteps) * 100);
});

// --- Methods ---
onMounted(async () => {
  loading.value = true;
  try {
    eligibleEscrows.value = await disputesStore.fetchEligibleEscrows();
  } catch (err) {
    console.error('Failed to load escrows', err);
  } finally {
    loading.value = false;
  }
});

const selectEscrow = (escrow) => {
  selectedEscrow.value = escrow;
  escrowDropdownOpen.value = false;
  escrowSearchQuery.value = '';
};

const selectReason = (r) => {
  reason.value = r.id;
};

const selectResolution = (r) => {
  desiredResolution.value = r;
};

const handleFileUpload = (event) => {
  const files = event.target.files;
  if (!files) return;
  for (const file of files) {
    if (file.size > 20 * 1024 * 1024) continue; // Skip files over 20MB
    evidence.value.push({
      id: 'ev_' + Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    });
  }
};

const removeFile = (id) => {
  const file = evidence.value.find(f => f.id === id);
  if (file?.preview) URL.revokeObjectURL(file.preview);
  evidence.value = evidence.value.filter(f => f.id !== id);
};

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const getFileIcon = (type) => {
  if (!type) return File;
  if (type.startsWith('image/')) return Image;
  if (type.includes('pdf')) return FileText;
  if (type.includes('zip') || type.includes('rar')) return Archive;
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('sheet')) return FileSpreadsheet;
  if (type.includes('word') || type.includes('document')) return FileEdit;
  if (type.includes('video')) return Film;
  return File;
};

const nextStep = () => {
  if (currentStep.value < totalSteps) currentStep.value++;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const prevStep = () => {
  if (currentStep.value > 1) currentStep.value--;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const openConfirmModal = () => {
  showConfirmModal.value = true;
};

const submitDispute = async () => {
  submitting.value = true;
  try {
    const reasonObj = disputeReasons.value.find(r => r.id === reason.value);
    const disputeData = {
      escrowId: selectedEscrow.value.id,
      invoiceNumber: selectedEscrow.value.invoiceNumber,
      initiatorRole: userRole.value,
      reason: reason.value,
      reasonLabel: reasonObj?.title || reason.value,
      explanation: explanation.value,
      desiredResolution: desiredResolution.value,
      evidence: evidence.value.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type
      }))
    };
    const result = await disputesStore.createDispute(disputeData);
    submittedDispute.value = result;
    showConfirmModal.value = false;
    showSuccess.value = true;
    emit('submitted', result);
  } catch (err) {
    console.error('Failed to submit dispute', err);
  } finally {
    submitting.value = false;
  }
};

const handleTrackDispute = () => {
  emit('close');
};

const handleReturnToDashboard = () => {
  router.push('/dashboard');
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric'
  });
};
</script>

<template>
  <div class="space-y-6">
    <!-- Success Screen -->
    <template v-if="showSuccess && submittedDispute">
      <div class="text-center py-12 max-w-lg mx-auto">
        <div class="w-24 h-24 mx-auto mb-6 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
          <CheckCircle2 class="w-12 h-12 text-emerald-500" />
        </div>
        <h2 class="text-2xl font-bold text-slate-900">Dispute Submitted</h2>
        <p class="text-sm text-slate-500 mt-2">Your dispute has been received.</p>
        
        <div class="mt-8 bg-white rounded-2xl border border-slate-100 shadow-premium p-6">
          <div class="flex items-center justify-center gap-2 mb-4">
            <span class="text-sm font-mono font-bold text-slate-800">{{ submittedDispute.id }}</span>
            <button
              @click="navigator.clipboard?.writeText(submittedDispute.id)"
              class="p-1 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-all"
              title="Copy Case ID"
            >
              <Copy class="w-3.5 h-3.5" />
            </button>
          </div>
          <PactBadge :status="submittedDispute.status" />
        </div>

        <div class="flex items-center justify-center gap-3 mt-8">
          <PactButton variant="primary" size="md" @click="handleTrackDispute">
            <Eye class="w-4 h-4" />
            Track Dispute
          </PactButton>
          <PactButton variant="secondary" size="md" @click="handleReturnToDashboard">
            Return to Dashboard
          </PactButton>
        </div>
      </div>
    </template>

    <!-- Main Form -->
    <template v-else>
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <button
            @click="emit('close')"
            class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
          <div>
            <h2 class="text-xl font-bold text-slate-900 tracking-tight">Raise a Dispute</h2>
            <p class="text-xs text-slate-500 mt-0.5">Step {{ currentStep }} of {{ totalSteps }}</p>
          </div>
        </div>
        <PactButton variant="ghost" size="sm" @click="emit('close')">
          <ArrowLeft class="w-4 h-4" />
          Back to Disputes
        </PactButton>
      </div>

      <!-- Progress Bar -->
      <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
        <div
          class="h-full bg-brand-500 rounded-full transition-all duration-500 ease-out"
          :style="{ width: stepProgress + '%' }"
        ></div>
      </div>

      <!-- Warning Banner -->
      <div class="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
        <AlertTriangle class="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p class="text-sm font-bold text-amber-800">Disputes should be a last resort.</p>
          <p class="text-xs text-amber-700 mt-0.5">
            We encourage both parties to communicate first. Once a dispute is opened, the escrow is frozen until a decision is reached.
          </p>
        </div>
      </div>

      <!-- Step 1: Select Escrow -->
      <div v-if="currentStep === 1" class="space-y-4">
        <h3 class="text-base font-bold text-slate-900">Which escrow is this dispute about?</h3>
        <p class="text-xs text-slate-500">Select the active escrow you'd like to dispute.</p>

        <!-- Loading -->
        <div v-if="loadingEscrows" class="space-y-2 animate-pulse">
          <div v-for="i in 3" :key="i" class="h-20 bg-slate-100 rounded-2xl"></div>
        </div>

        <!-- Searchable Dropdown -->
        <div class="relative" v-else>
          <div
            class="relative w-full"
            @click="escrowDropdownOpen = !escrowDropdownOpen"
          >
            <div
              class="w-full flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-all"
              :class="{ 'ring-2 ring-brand-400 border-brand-400': escrowDropdownOpen }"
            >
              <Search class="w-4 h-4 text-slate-400 shrink-0" />
              <span v-if="!selectedEscrow" class="text-sm text-slate-400">Search by escrow ID, project title, or counterparty...</span>
              <span v-else class="text-sm font-semibold text-slate-800">{{ selectedEscrow.title }}</span>
              <ChevronDown class="w-4 h-4 text-slate-400 ml-auto shrink-0 transition-transform" :class="{ 'rotate-180': escrowDropdownOpen }" />
            </div>
          </div>

          <!-- Dropdown Menu -->
          <div
            v-if="escrowDropdownOpen"
            class="absolute z-50 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-premium-lg overflow-hidden"
          >
            <div class="p-3 border-b border-slate-100">
              <div class="relative">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  v-model="escrowSearchQuery"
                  type="text"
                  placeholder="Search escrows..."
                  class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
                  @click.stop
                />
              </div>
            </div>

            <div class="max-h-64 overflow-y-auto">
              <div
                v-for="escrow in filteredEscrows"
                :key="escrow.id"
                @click="selectEscrow(escrow)"
                class="p-4 hover:bg-brand-50/50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
                :class="{ 'bg-brand-50/30': selectedEscrow?.id === escrow.id }"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="text-sm font-bold text-slate-800">{{ escrow.title }}</p>
                    <p class="text-xs text-slate-400 font-mono mt-0.5">{{ escrow.escrowId }}</p>
                    <p class="text-xs text-slate-500 mt-1">
                      <span class="font-semibold">{{ escrow.counterpartyRole === 'Client' ? 'Client' : 'Freelancer' }}:</span>
                      {{ escrow.counterpartyName }}
                    </p>
                  </div>
                  <div class="text-right shrink-0">
                    <p class="text-sm font-bold text-slate-900">₦{{ (escrow.amount || 0).toLocaleString() }}</p>
                    <PactBadge :status="escrow.status" />
                  </div>
                </div>
              </div>

              <!-- Empty dropdown state -->
              <div v-if="filteredEscrows.length === 0" class="p-8 text-center">
                <Inbox class="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p class="text-sm text-slate-400 font-medium">No active escrows are eligible for dispute.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Escrow Summary Card (when selected) -->
        <div
          v-if="selectedEscrow"
          class="bg-white rounded-2xl border border-slate-100 shadow-premium overflow-hidden"
        >
          <div class="p-5">
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-sm font-bold text-slate-900">{{ selectedEscrow.title }}</h4>
              <PactBadge :status="selectedEscrow.status" />
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Escrow ID</p>
                <p class="text-sm font-mono font-semibold text-slate-800 mt-1">{{ selectedEscrow.escrowId }}</p>
              </div>
              <div v-if="selectedEscrow.invoiceNumber">
                <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Invoice</p>
                <p class="text-sm font-mono font-semibold text-slate-800 mt-1">{{ selectedEscrow.invoiceNumber }}</p>
              </div>
              <div>
                <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Counterparty</p>
                <p class="text-sm font-semibold text-slate-800 mt-1">{{ selectedEscrow.counterpartyName }}</p>
              </div>
              <div>
                <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Amount in Escrow</p>
                <p class="text-sm font-bold text-brand-600 mt-1">₦{{ (selectedEscrow.amount || 0).toLocaleString() }}</p>
              </div>
              <div>
                <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Funded</p>
                <p class="text-sm font-semibold text-slate-800 mt-1">{{ formatDate(selectedEscrow.createdAt) }}</p>
              </div>
              <div>
                <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Deadline</p>
                <p class="text-sm font-semibold text-slate-800 mt-1">{{ formatDate(selectedEscrow.dueDate) }}</p>
              </div>
              <div>
                <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Role</p>
                <p class="text-sm font-semibold text-slate-800 mt-1">{{ selectedEscrow.counterpartyRole === 'Client' ? 'Client / Buyer' : 'Freelancer / Seller' }}</p>
              </div>
              <div>
                <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Current Status</p>
                <p class="text-sm font-semibold text-slate-800 mt-1 capitalize">{{ selectedEscrow.status }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Who are you? -->
      <div v-if="currentStep === 2" class="space-y-4">
        <h3 class="text-base font-bold text-slate-900">Who are you?</h3>
        <p class="text-xs text-slate-500">Your role in this escrow has been automatically detected.</p>

        <div class="inline-flex items-center gap-3 px-5 py-4 bg-white rounded-2xl border border-slate-100 shadow-premium">
          <div class="p-2.5 rounded-xl bg-brand-50 text-brand-600">
            <UserCheck class="w-5 h-5" />
          </div>
          <div>
            <p class="text-sm font-bold text-slate-900">{{ authStore.user?.name }}</p>
            <div class="flex items-center gap-2 mt-1">
              <span
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-100"
              >
                <BadgeCheck class="w-3 h-3" />
                {{ userRoleLabel }}
              </span>
              <span class="text-xs text-slate-400">Automatically detected</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 3: Reason for Dispute -->
      <div v-if="currentStep === 3" class="space-y-4">
        <h3 class="text-base font-bold text-slate-900">Reason for Dispute</h3>
        <p class="text-xs text-slate-500">Select the reason that best describes your situation.</p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            v-for="r in disputeReasons"
            :key="r.id"
            @click="selectReason(r)"
            class="relative p-4 bg-white rounded-2xl border-2 cursor-pointer transition-all duration-200 hover:shadow-premium"
            :class="[
              reason === r.id
                ? 'border-brand-500 bg-brand-50/30 shadow-premium'
                : 'border-slate-100 hover:border-slate-200'
            ]"
          >
            <div class="flex items-start gap-3">
              <div
                class="p-2 rounded-xl shrink-0"
                :class="reason === r.id ? 'bg-brand-100 text-brand-600' : 'bg-slate-50 text-slate-400'"
              >
                <component :is="r.icon" class="w-5 h-5" />
              </div>
              <div class="min-w-0">
                <p class="text-sm font-bold text-slate-900">{{ r.title }}</p>
                <p class="text-xs text-slate-500 mt-0.5">{{ r.desc }}</p>
              </div>
              <div
                v-if="reason === r.id"
                class="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center"
              >
                <Check class="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 4: Explain the Issue -->
      <div v-if="currentStep === 4" class="space-y-4">
        <h3 class="text-base font-bold text-slate-900">Explain the Issue</h3>
        <p class="text-xs text-slate-500">Describe what happened in detail. Include what was agreed, what has happened, attempts to resolve, and what outcome you expect.</p>

        <div class="relative">
          <textarea
            v-model="explanation"
            placeholder="Describe what happened.&#10;&#10;• what was agreed&#10;• what has happened&#10;• attempts to resolve&#10;• what outcome you expect"
            class="w-full min-h-[200px] p-4 bg-white border border-slate-200 rounded-2xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 transition-all resize-y"
            :class="{ 'border-red-300 focus:ring-red-400': explanation.length > 0 && !explanationValid }"
          ></textarea>
          <div class="absolute bottom-3 right-3 flex items-center gap-1.5 text-xs"
            :class="explanationValid ? 'text-emerald-600' : 'text-slate-400'"
          >
            <span>{{ explanationCharCount }}</span>
            <span class="text-slate-300">/</span>
            <span>50</span>
            <Check v-if="explanationValid" class="w-3.5 h-3.5 text-emerald-500" />
          </div>
        </div>
        <p v-if="explanation.length > 0 && !explanationValid" class="text-xs text-red-500">
          Please write at least 50 characters ({{ 50 - explanationCharCount }} more needed).
        </p>
      </div>

      <!-- Step 5: Desired Resolution -->
      <div v-if="currentStep === 5" class="space-y-4">
        <h3 class="text-base font-bold text-slate-900">Desired Resolution</h3>
        <p class="text-xs text-slate-500">What outcome are you looking for?</p>

        <div class="space-y-2">
          <div
            v-for="option in resolutionOptions"
            :key="option.id"
            @click="selectResolution(option.id)"
            class="flex items-center gap-4 p-4 bg-white rounded-2xl border-2 cursor-pointer transition-all duration-200 hover:shadow-premium"
            :class="[
              desiredResolution === option.id
                ? 'border-brand-500 bg-brand-50/30 shadow-premium'
                : 'border-slate-100 hover:border-slate-200'
            ]"
          >
            <div
              class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
              :class="desiredResolution === option.id ? 'border-brand-500' : 'border-slate-300'"
            >
              <div v-if="desiredResolution === option.id" class="w-2.5 h-2.5 rounded-full bg-brand-500"></div>
            </div>
            <div
              class="p-2 rounded-xl shrink-0"
              :class="desiredResolution === option.id ? 'bg-brand-100 text-brand-600' : 'bg-slate-50 text-slate-400'"
            >
              <component :is="option.icon" class="w-5 h-5" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-bold text-slate-900">{{ option.title }}</p>
              <p class="text-xs text-slate-500">{{ option.desc }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 6: Evidence Upload -->
      <div v-if="currentStep === 6" class="space-y-4">
        <h3 class="text-base font-bold text-slate-900">Evidence Upload</h3>
        <p class="text-xs text-slate-500">Upload any supporting documents. Accepted formats: Images, PDF, ZIP, Word, Excel, Videos. Max 20MB per file.</p>

        <!-- Upload Zone -->
        <div
          class="relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer"
          :class="[
            dragOver
              ? 'border-brand-400 bg-brand-50/50'
              : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
          ]"
          @dragover.prevent="dragOver = true"
          @dragleave="dragOver = false"
          @drop.prevent="dragOver = false; handleFileUpload({ target: { files: $event.dataTransfer.files } })"
          @click="$refs.fileInput.click()"
        >
          <Upload class="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p class="text-sm font-semibold text-slate-700">Drop files here or click to browse</p>
          <p class="text-xs text-slate-400 mt-1">Images, PDF, ZIP, Word, Excel, Videos — up to 20MB each</p>
          <input
            ref="fileInput"
            type="file"
            multiple
            accept="image/*,.pdf,.zip,.doc,.docx,.xls,.xlsx,.mp4,.mov,.avi"
            class="hidden"
            @change="handleFileUpload"
          />
        </div>

        <!-- Uploaded Files -->
        <div v-if="evidence.length > 0" class="space-y-2">
          <div
            v-for="file in evidence"
            :key="file.id"
            class="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100"
          >
            <!-- Preview for images -->
            <div v-if="file.preview" class="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0">
              <img :src="file.preview" :alt="file.name" class="w-full h-full object-cover" />
            </div>
            <div v-else class="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
              <component :is="getFileIcon(file.type)" class="w-5 h-5" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-slate-800 truncate">{{ file.name }}</p>
              <p class="text-xs text-slate-400">{{ formatFileSize(file.size) }}</p>
            </div>
            <button
              @click.stop="removeFile(file.id)"
              class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Step 7: Timeline Preview -->
      <div v-if="currentStep === 7 && selectedEscrow" class="space-y-4">
        <h3 class="text-base font-bold text-slate-900">Timeline Preview</h3>
        <p class="text-xs text-slate-500">This timeline helps the mediator understand the flow of events.</p>

        <div class="bg-white rounded-2xl border border-slate-100 shadow-premium p-6">
          <div class="relative">
            <!-- Vertical Line -->
            <div class="absolute left-[15px] top-2 bottom-2 w-0.5 bg-slate-200"></div>

            <div class="space-y-6">
              <div v-for="(item, idx) in [
                { event: 'Escrow Created', date: selectedEscrow.createdAt, icon: FileText, color: 'bg-slate-100 text-slate-500' },
                { event: 'Escrow Funded', date: selectedEscrow.createdAt, icon: DollarSign, color: 'bg-emerald-100 text-emerald-600' },
                { event: 'Work Started', date: selectedEscrow.createdAt, icon: Code, color: 'bg-blue-100 text-blue-600' },
                { event: 'Work Delivered', date: selectedEscrow.createdAt, icon: Check, color: 'bg-indigo-100 text-indigo-600' },
                { event: 'Dispute Opened', date: new Date().toISOString(), icon: AlertTriangle, color: 'bg-amber-100 text-amber-600' },
                { event: 'Under Review', date: null, icon: Search, color: 'bg-purple-100 text-purple-600' },
                { event: 'Decision', date: null, icon: Gavel, color: 'bg-slate-100 text-slate-400' }
              ]" :key="idx">
                <div class="flex items-start gap-4">
                  <div class="relative z-10">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center" :class="item.color">
                      <component :is="item.icon" class="w-4 h-4" />
                    </div>
                  </div>
                  <div class="min-w-0 pt-1">
                    <p class="text-sm font-bold text-slate-800">{{ item.event }}</p>
                    <p class="text-xs text-slate-400 mt-0.5">
                      {{ item.date ? formatDate(item.date) : 'Pending' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 8: What Happens Next -->
      <div v-if="currentStep === 8" class="space-y-4">
        <h3 class="text-base font-bold text-slate-900">What Happens Next?</h3>
        <p class="text-xs text-slate-500">Here's what to expect after submitting your dispute.</p>

        <div class="bg-white rounded-2xl border border-slate-100 shadow-premium p-6 space-y-4">
          <div class="flex items-start gap-4">
            <div class="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
              <span class="text-sm font-bold">1</span>
            </div>
            <div>
              <p class="text-sm font-bold text-slate-900">Counterparty Notification</p>
              <p class="text-xs text-slate-500 mt-0.5">The other party will be notified immediately and given 7 days to respond with their side of the story.</p>
            </div>
          </div>
          <div class="flex items-start gap-4">
            <div class="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
              <span class="text-sm font-bold">2</span>
            </div>
            <div>
              <p class="text-sm font-bold text-slate-900">Mediation Review</p>
              <p class="text-xs text-slate-500 mt-0.5">Our mediation team reviews both sides, examines evidence, and may reach out for additional information.</p>
            </div>
          </div>
          <div class="flex items-start gap-4">
            <div class="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
              <span class="text-sm font-bold">3</span>
            </div>
            <div>
              <p class="text-sm font-bold text-slate-900">Resolution Decision</p>
              <p class="text-xs text-slate-500 mt-0.5">A decision is made based on the evidence. Funds are released accordingly — either to you, the other party, or split.</p>
            </div>
          </div>
          <div class="flex items-start gap-4">
            <div class="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
              <span class="text-sm font-bold">4</span>
            </div>
            <div>
              <p class="text-sm font-bold text-slate-900">Escrow Closure</p>
              <p class="text-xs text-slate-500 mt-0.5">Once resolved, the escrow is closed and funds are released per the decision. Both parties receive a summary.</p>
            </div>
          </div>
        </div>

        <!-- Summary Card -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-premium p-6">
          <h4 class="text-sm font-bold text-slate-900 mb-4">Dispute Summary</h4>
          <div class="space-y-3">
            <div class="flex items-center justify-between py-2 border-b border-slate-50">
              <span class="text-xs text-slate-500">Escrow</span>
              <span class="text-xs font-semibold text-slate-800">{{ selectedEscrow?.title }}</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-slate-50">
              <span class="text-xs text-slate-500">Amount</span>
              <span class="text-xs font-bold text-slate-800">₦{{ (selectedEscrow?.amount || 0).toLocaleString() }}</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-slate-50">
              <span class="text-xs text-slate-500">Reason</span>
              <span class="text-xs font-semibold text-slate-800">{{ disputeReasons.find(r => r.id === reason)?.title || reason }}</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-slate-50">
              <span class="text-xs text-slate-500">Desired Resolution</span>
              <span class="text-xs font-semibold text-slate-800">{{ resolutionOptions.find(r => r.id === desiredResolution)?.title || desiredResolution }}</span>
            </div>
            <div class="flex items-center justify-between py-2">
              <span class="text-xs text-slate-500">Evidence Files</span>
              <span class="text-xs font-semibold text-slate-800">{{ evidence.length }} file(s)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation Buttons -->
      <div class="flex items-center justify-between pt-4 border-t border-slate-100">
        <PactButton
          v-if="currentStep > 1"
          variant="ghost"
          size="md"
          @click="prevStep"
        >
          <ArrowLeft class="w-4 h-4" />
          Back
        </PactButton>
        <div v-else></div>

        <div class="flex items-center gap-3">
          <PactButton
            v-if="currentStep < totalSteps"
            variant="primary"
            size="md"
            @click="nextStep"
            :disabled="
              (currentStep === 1 && !selectedEscrow) ||
              (currentStep === 3 && !reason) ||
              (currentStep === 4 && !explanationValid) ||
              (currentStep === 5 && !desiredResolution)
            "
          >
            Continue
            <ArrowRight class="w-4 h-4" />
          </PactButton>

          <PactButton
            v-if="currentStep === totalSteps"
            variant="primary"
            size="md"
            @click="openConfirmModal"
            :disabled="!canSubmit"
          >
            <Send class="w-4 h-4" />
            Submit Dispute
          </PactButton>
        </div>
      </div>
    </template>

    <!-- Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="showConfirmModal"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/40 backdrop-blur-sm"
          @click="showConfirmModal = false"
        ></div>

        <!-- Modal -->
        <div class="relative w-full max-w-md bg-white rounded-2xl shadow-premium-lg p-6 z-10">
          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
              <AlertTriangle class="w-8 h-8 text-amber-500" />
            </div>
            <h3 class="text-lg font-bold text-slate-900">Submit Dispute?</h3>
            <p class="text-sm text-slate-500 mt-2">
              Once submitted, the escrow will be frozen and the other party will be notified. This action cannot be undone.
            </p>
          </div>

          <div class="flex items-center gap-3 mt-6">
            <PactButton
              variant="secondary"
              size="md"
              class="flex-1"
              @click="showConfirmModal = false"
              :disabled="submitting"
            >
              Cancel
            </PactButton>
            <PactButton
              variant="danger"
              size="md"
              class="flex-1"
              @click="submitDispute"
              :loading="submitting"
            >
              Yes, Submit Dispute
            </PactButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

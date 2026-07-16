<!-- src/views/contracts/ContractDetails.vue -->
<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { useContractsStore } from '../../stores/contracts';
import PactCard from '../../components/ui/PactCard.vue';
import PactButton from '../../components/ui/PactButton.vue';
import PactBadge from '../../components/ui/PactBadge.vue';
import PactAvatar from '../../components/ui/PactAvatar.vue';
import PactInput from '../../components/ui/PactInput.vue';
import { 
  ArrowLeft, 
  Send, 
  Paperclip, 
  Calendar, 
  Coins, 
  User, 
  MessageSquare, 
  ShieldCheck,
  AlertTriangle,
  Download,
  Info,
  Clock,
  CheckCircle,
  HelpCircle
} from '@lucide/vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const contractsStore = useContractsStore();

const contractId = route.params.id;
const chatContainer = ref(null);
const newMessage = ref('');
const sendingMessage = ref(false);
const actionLoading = ref({});
const disputeLoading = ref(false);

// Attachment Simulator states
const showAttachmentMenu = ref(false);
const simulatedAttachments = [
  { name: 'Wireframes_Mobile_Draft.pdf', size: '2.4 MB', type: 'application/pdf' },
  { name: 'Pact_System_Components.zip', size: '8.7 MB', type: 'application/zip' },
  { name: 'LandingPage_Figma_Export.png', size: '4.1 MB', type: 'image/png' }
];

onMounted(async () => {
  try {
    await contractsStore.fetchContractById(contractId);
    scrollToBottom();
  } catch (err) {
    router.push('/contracts');
  }
});

const contract = computed(() => contractsStore.currentContract);

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
};

const handleSendMessage = async (attachment = null) => {
  if (!newMessage.value.trim() && !attachment) return;
  sendingMessage.value = true;
  showAttachmentMenu.value = false;
  
  try {
    const text = newMessage.value;
    newMessage.value = '';
    await contractsStore.sendMessage(contractId, text, attachment);
    scrollToBottom();
  } catch (err) {
    console.error(err);
  } finally {
    sendingMessage.value = false;
  }
};

const triggerSimulatedAttachment = (file) => {
  handleSendMessage(file);
};

const handleFundContract = async () => {
  actionLoading.value['fund'] = true;
  try {
    await contractsStore.fundContract(contractId);
    scrollToBottom();
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to fund contract.');
  } finally {
    actionLoading.value['fund'] = false;
  }
};

const handleSubmitMilestone = async (mId) => {
  actionLoading.value[mId] = true;
  try {
    await contractsStore.submitMilestone(contractId, mId);
    scrollToBottom();
  } catch (err) {
    console.error(err);
  } finally {
    actionLoading.value[mId] = false;
  }
};

const handleApproveMilestone = async (mId) => {
  actionLoading.value[mId] = true;
  try {
    await contractsStore.approveMilestone(contractId, mId);
    scrollToBottom();
  } catch (err) {
    console.error(err);
  } finally {
    actionLoading.value[mId] = false;
  }
};

const handleOpenDispute = async () => {
  if (!confirm('Are you sure you want to file a dispute? This will freeze all remaining escrow funds and request support arbitration.')) {
    return;
  }
  disputeLoading.value = true;
  try {
    await contractsStore.openDispute(contractId);
    scrollToBottom();
  } catch (err) {
    console.error(err);
  } finally {
    disputeLoading.value = false;
  }
};
</script>

<template>
  <div v-if="!contract" class="space-y-6 animate-pulse">
    <div class="h-6 w-32 bg-slate-100 rounded-lg"></div>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 h-96 bg-slate-100 rounded-2xl"></div>
      <div class="h-96 bg-slate-100 rounded-2xl"></div>
    </div>
  </div>

  <div v-else class="space-y-6">
    <!-- Back Header Navigation -->
    <div class="flex items-center justify-between border-b border-slate-100 pb-4">
      <div class="flex items-center gap-3">
        <button 
          @click="router.push('/contracts')"
          class="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft class="w-4 h-4" />
        </button>
        <div>
          <span class="text-xs font-semibold text-slate-400">ID: {{ contract.id.toUpperCase() }}</span>
          <h2 class="text-lg font-bold text-slate-900 leading-snug tracking-tight">{{ contract.title }}</h2>
        </div>
      </div>
      <PactBadge :status="contract.status" />
    </div>

    <!-- Main Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      
      <!-- ESCROW WORKFLOW PANELS (2/3 width) -->
      <div class="lg:col-span-2 space-y-6">
        
        <!-- Contract Meta Information Card -->
        <PactCard padding="p-6">
          <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide mb-4">Project Overview</h3>
          <p class="text-xs text-slate-600 leading-relaxed">{{ contract.description }}</p>
          
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-50">
            <div>
              <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Escrow</p>
              <p class="text-sm font-extrabold text-slate-900 mt-0.5">${{ contract.escrowAmount.toLocaleString() }}</p>
            </div>
            <div>
              <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Due Date</p>
              <p class="text-xs font-semibold text-slate-700 mt-0.5 inline-flex items-center gap-1">
                <Calendar class="w-3.5 h-3.5 text-slate-400" />
                {{ contract.dueDate }}
              </p>
            </div>
            <div>
              <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Client Partner</p>
              <div class="flex items-center gap-1.5 mt-0.5">
                <PactAvatar :src="contract.clientAvatar" :name="contract.clientName" size="sm" class="h-5 w-5" />
                <span class="text-xs font-semibold text-slate-700 truncate max-w-24">{{ contract.clientName }}</span>
              </div>
            </div>
            <div>
              <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Freelancer</p>
              <div class="flex items-center gap-1.5 mt-0.5">
                <PactAvatar :src="contract.freelancerAvatar" :name="contract.freelancerName" size="sm" class="h-5 w-5" />
                <span class="text-xs font-semibold text-slate-700 truncate max-w-24">{{ contract.freelancerName }}</span>
              </div>
            </div>
          </div>
        </PactCard>

        <!-- Dynamic Action Alert Box -->
        <div 
          v-if="contract.status === 'Pending' && authStore.isClient"
          class="p-5 bg-brand-50 border border-brand-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
        >
          <div class="flex gap-3 items-start">
            <span class="p-2 rounded-xl bg-brand-100 text-brand-600 border border-brand-200">
              <Coins class="w-5 h-5" />
            </span>
            <div>
              <h4 class="text-sm font-bold text-slate-900">Fund Contract Proposal</h4>
              <p class="text-xs text-slate-600 mt-0.5 leading-relaxed">
                This contract proposal needs funding before the freelancer can submit work. Locked funds remain secure in Pact Vault escrow.
              </p>
            </div>
          </div>
          <PactButton 
            @click="handleFundContract" 
            variant="primary" 
            size="sm"
            :loading="actionLoading['fund']"
            class="shrink-0 self-start md:self-auto"
          >
            Deposit & Activate Contract
          </PactButton>
        </div>

        <div 
          v-if="contract.status === 'Disputed'"
          class="p-5 bg-red-50 border border-red-100 rounded-2xl flex gap-3 items-start shadow-sm"
        >
          <span class="p-2 rounded-xl bg-red-100 text-red-600 border border-red-200">
            <AlertTriangle class="w-5 h-5" />
          </span>
          <div>
            <h4 class="text-sm font-bold text-red-900">Dispute Filed</h4>
            <p class="text-xs text-red-600 mt-0.5 leading-relaxed">
              Arbitration has been triggered on this contract. Balance payout releases are frozen. A support manager has been assigned to evaluate the milestone materials and chat logs.
            </p>
          </div>
        </div>

        <!-- Milestones list & management -->
        <PactCard padding="p-6">
          <template #header>
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-bold text-slate-900">Payment Milestones</h3>
                <p class="text-xs text-slate-500 mt-0.5">Clear deliverables linked to escrow releases</p>
              </div>
              <!-- Dispute button available on funded contracts -->
              <PactButton
                v-if="['Active', 'Submitted'].includes(contract.status)"
                @click="handleOpenDispute"
                variant="ghost"
                size="sm"
                class="text-red-500 hover:text-red-700 hover:bg-red-50"
                :loading="disputeLoading"
              >
                <AlertTriangle class="w-4 h-4" />
                File Dispute
              </PactButton>
            </div>
          </template>

          <div class="space-y-4 mt-4">
            <div 
              v-for="(milestone, index) in contract.milestones" 
              :key="milestone.id"
              class="p-4 border border-slate-100 bg-slate-50/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:bg-slate-50/50"
            >
              <!-- Info -->
              <div class="flex items-start gap-3">
                <span 
                  class="mt-1 h-5 w-5 rounded-full flex items-center justify-center shrink-0 border"
                  :class="[
                    milestone.status === 'Released' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                    milestone.status === 'Submitted' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' :
                    'bg-slate-50 border-slate-200 text-slate-400'
                  ]"
                >
                  <CheckCircle v-if="milestone.status === 'Released'" class="w-3.5 h-3.5" />
                  <Clock v-else class="w-3.5 h-3.5" />
                </span>

                <div>
                  <h4 class="text-xs font-bold text-slate-800">
                    M{{ index + 1 }}: {{ milestone.title }}
                  </h4>
                  <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[10px] font-medium text-slate-500">
                    <span class="inline-flex items-center gap-1">
                      <Calendar class="w-3 h-3 text-slate-400" />
                      Due {{ milestone.dueDate }}
                    </span>
                    <span class="inline-flex items-center gap-1 font-bold text-slate-900">
                      ${{ milestone.amount.toLocaleString() }}
                    </span>
                    <!-- Inline status badge -->
                    <span 
                      class="px-1.5 py-0.5 rounded text-[9px] uppercase font-semibold"
                      :class="[
                        milestone.status === 'Released' ? 'bg-emerald-100 text-emerald-800' :
                        milestone.status === 'Submitted' ? 'bg-indigo-100 text-indigo-800' :
                        milestone.status === 'Draft' ? 'bg-slate-200 text-slate-600' :
                        'bg-amber-100 text-amber-800'
                      ]"
                    >
                      {{ milestone.status }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Milestone Action triggers -->
              <div class="shrink-0 flex gap-2">
                <!-- Freelancer triggers submission -->
                <PactButton
                  v-if="milestone.status === 'Pending' && authStore.isFreelancer && contract.status === 'Active'"
                  @click="handleSubmitMilestone(milestone.id)"
                  variant="secondary"
                  size="sm"
                  :loading="actionLoading[milestone.id]"
                >
                  Submit Milestone Work
                </PactButton>

                <!-- Client triggers release -->
                <PactButton
                  v-if="['Pending', 'Submitted'].includes(milestone.status) && authStore.isClient && ['Active', 'Submitted'].includes(contract.status)"
                  @click="handleApproveMilestone(milestone.id)"
                  variant="success"
                  size="sm"
                  :loading="actionLoading[milestone.id]"
                >
                  Approve & Release Funds
                </PactButton>
              </div>
            </div>
          </div>
        </PactCard>

      </div>

      <!-- ESCROW CONVERSATION BOX (1/3 width) -->
      <div>
        <PactCard padding="p-0" class="h-[600px] flex flex-col justify-between overflow-hidden relative">
          <!-- Chat Header -->
          <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-3.5 bg-slate-50/50">
            <span class="p-2 rounded-xl bg-white border border-slate-100 text-slate-600">
              <MessageSquare class="w-4 h-4" />
            </span>
            <div class="flex-1 min-w-0">
              <h3 class="text-xs font-bold text-slate-800">Contract Room</h3>
              <p class="text-[10px] text-slate-500 truncate">Chat & delivery file exchange</p>
            </div>
          </div>

          <!-- Messages scroll feed -->
          <div 
            ref="chatContainer"
            class="flex-1 overflow-y-auto p-5 space-y-4"
          >
            <div 
              v-for="msg in contract.messages" 
              :key="msg.id"
              class="flex flex-col space-y-1"
              :class="[ msg.senderId === authStore.user?.id ? 'items-end' : 'items-start' ]"
            >
              <!-- Meta Sender Name -->
              <span class="text-[10px] text-slate-400 font-semibold px-1">
                {{ msg.senderId === authStore.user?.id ? 'You' : msg.senderName }}
              </span>

              <!-- Bubble bubble -->
              <div 
                class="max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-sm leading-relaxed"
                :class="[
                  msg.senderId === authStore.user?.id 
                    ? 'bg-brand-500 text-white' 
                    : 'bg-slate-100 text-slate-800'
                ]"
              >
                <p>{{ msg.content }}</p>

                <!-- Attached asset link card -->
                <div 
                  v-if="msg.attachment" 
                  class="mt-2.5 p-2 bg-black/5 hover:bg-black/10 border border-black/10 rounded-xl flex items-center justify-between gap-3 text-current transition-colors"
                >
                  <div class="flex items-center gap-2 min-w-0">
                    <Paperclip class="w-3.5 h-3.5 opacity-80 shrink-0" />
                    <div class="min-w-0">
                      <p class="text-[10px] font-bold truncate leading-tight">{{ msg.attachment.name }}</p>
                      <p class="text-[9px] opacity-70 leading-none mt-0.5">{{ msg.attachment.size }}</p>
                    </div>
                  </div>
                  <a 
                    href="#" 
                    @click.prevent="alert(`Mock download of ${msg.attachment.name}`)"
                    class="p-1 rounded bg-white/10 hover:bg-white/20 text-current transition"
                    title="Download attachment"
                  >
                    <Download class="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <!-- Timestamp -->
              <span class="text-[8px] text-slate-400 font-medium px-1.5">
                {{ new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
              </span>
            </div>
          </div>

          <!-- Bottom Chat Inputs -->
          <div class="p-4 border-t border-slate-100 bg-slate-50/30 flex flex-col gap-2 relative">
            
            <!-- Attachment overlay picker simulator -->
            <div 
              v-if="showAttachmentMenu"
              class="absolute bottom-full left-4 right-4 bg-white border border-slate-200 rounded-xl shadow-premium-lg p-2.5 z-10 space-y-1 mb-2"
            >
              <p class="text-[9px] font-bold text-slate-400 uppercase tracking-wide px-2 mb-1.5">Simulate File Upload</p>
              <button 
                v-for="file in simulatedAttachments" 
                :key="file.name"
                @click="triggerSimulatedAttachment(file)"
                class="w-full px-2.5 py-1.5 rounded-lg text-left text-[11px] font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition"
              >
                <Paperclip class="w-3.5 h-3.5 text-slate-400" />
                {{ file.name }} ({{ file.size }})
              </button>
            </div>

            <!-- Input and buttons row -->
            <div class="flex items-center gap-2">
              <button
                @click="showAttachmentMenu = !showAttachmentMenu"
                class="p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl transition cursor-pointer"
                title="Attach Document"
              >
                <Paperclip class="w-4 h-4" />
              </button>

              <div class="flex-1">
                <input
                  v-model="newMessage"
                  @keydown.enter="handleSendMessage()"
                  placeholder="Type a message or share work..."
                  class="w-full text-xs bg-white border border-slate-200 hover:border-slate-300 focus:border-brand-500 outline-none rounded-xl px-3.5 py-2.5 transition"
                  :disabled="sendingMessage"
                />
              </div>

              <button
                @click="handleSendMessage()"
                class="p-2.5 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white rounded-xl transition cursor-pointer"
                :disabled="sendingMessage"
              >
                <Send class="w-4 h-4" />
              </button>
            </div>
          </div>
        </PactCard>
      </div>

    </div>
  </div>
</template>

<!-- src/views/disputes/DisputesPage.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useDisputesStore } from '../../stores/disputes';
import { useAuthStore } from '../../stores/auth';
import PactCard from '../../components/ui/PactCard.vue';
import PactBadge from '../../components/ui/PactBadge.vue';
import PactButton from '../../components/ui/PactButton.vue';
import RaiseDispute from './RaiseDispute.vue';
import {
  ShieldAlert,
  Scale,
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  Inbox,
  ExternalLink,
  ChevronRight,
  Gavel
} from '@lucide/vue';

const router = useRouter();
const disputesStore = useDisputesStore();
const authStore = useAuthStore();

const loading = ref(true);
const showRaiseForm = ref(false);
const searchQuery = ref('');

onMounted(async () => {
  await disputesStore.fetchDisputes();
  loading.value = false;
});

const filteredDisputes = computed(() => {
  let list = disputesStore.disputes || [];
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(d =>
      d.id.toLowerCase().includes(q) ||
      d.escrowTitle.toLowerCase().includes(q) ||
      d.respondentName.toLowerCase().includes(q)
    );
  }
  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
});

const getStatusIcon = (status) => {
  const s = (status || '').toLowerCase();
  if (s.includes('awaiting')) return Clock;
  if (s.includes('review')) return Search;
  if (s.includes('resolved') || s.includes('closed')) return CheckCircle;
  return AlertTriangle;
};

const getStatusColor = (status) => {
  const s = (status || '').toLowerCase();
  if (s.includes('awaiting')) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (s.includes('review')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  if (s.includes('resolved') || s.includes('closed')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  return 'bg-red-50 text-red-700 border-red-200';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric'
  });
};

const handleViewDispute = (dispute) => {
  // For now, just navigate to the dispute detail (future enhancement)
  // We'll keep it simple and show the list
};

const handleBackToEscrow = () => {
  router.push('/contracts');
};
</script>

<template>
  <div class="space-y-6">
    <!-- Raise Dispute Form -->
    <RaiseDispute
      v-if="showRaiseForm"
      @close="showRaiseForm = false"
      @submitted="showRaiseForm = false"
    />

    <!-- Disputes List View -->
    <template v-else>
      <!-- Page Header -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-slate-900 tracking-tight">Dispute Resolution</h2>
          <p class="text-xs text-slate-500 mt-0.5 max-w-2xl">
            If you're unable to resolve the issue directly with the other party, you can request mediation. Funds remain securely held in escrow until the dispute is resolved.
          </p>
        </div>
        <div class="flex items-center gap-3 shrink-0">
          <PactButton variant="ghost" size="sm" @click="handleBackToEscrow" class="!text-[#0C513F] hover:!bg-[#0C513F]/5">
            <ArrowLeft class="w-4 h-4" />
            Back to Escrow
          </PactButton>
          <PactButton variant="primary" size="sm" @click="showRaiseForm = true" class="!bg-[#0C513F] !border-[#0C513F] hover:!bg-[#0A3D2F]">
            <Scale class="w-4 h-4" />
            Raise a Dispute
          </PactButton>
        </div>
      </div>

      <!-- Warning Banner -->
      <div class="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
        <AlertTriangle class="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p class="text-sm font-bold text-amber-800">Disputes should be a last resort.</p>
          <p class="text-xs text-amber-700 mt-0.5">
            We encourage both parties to resolve issues through direct communication first. If a dispute is opened, the escrowed funds are temporarily frozen until all submitted evidence is reviewed and a resolution is reached.
          </p>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="space-y-3 animate-pulse">
        <div v-for="i in 3" :key="i" class="h-24 bg-slate-100 rounded-2xl"></div>
      </div>

      <!-- Disputes List -->
      <template v-else>
        <!-- Search -->
        <div v-if="filteredDisputes.length > 0" class="relative w-full lg:w-80">
          <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search disputes..."
            class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 transition-all"
          />
        </div>

        <!-- Dispute Cards -->
        <div v-if="filteredDisputes.length > 0" class="space-y-3">
          <div
            v-for="dispute in filteredDisputes"
            :key="dispute.id"
            class="bg-white rounded-2xl border border-slate-100 shadow-premium p-5 hover:shadow-premium-lg hover:border-slate-200 transition-all duration-200 cursor-pointer"
            @click="handleViewDispute(dispute)"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-start gap-3 min-w-0">
                <div class="p-2.5 rounded-xl bg-red-50 text-red-600 shrink-0">
                  <ShieldAlert class="w-5 h-5" />
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h3 class="text-sm font-bold text-slate-900">{{ dispute.escrowTitle }}</h3>
                    <span class="text-xs font-mono font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg">{{ dispute.id }}</span>
                  </div>
                  <p class="text-xs text-slate-500 mt-1">
                    Disputed with <span class="font-semibold text-slate-700">{{ dispute.respondentName }}</span>
                    — {{ dispute.reasonLabel }}
                  </p>
                  <div class="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    <span>₦{{ (dispute.escrowAmount || 0).toLocaleString() }}</span>
                    <span class="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>{{ formatDate(dispute.createdAt) }}</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-3 shrink-0">
                <span
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border"
                  :class="getStatusColor(dispute.status)"
                >
                  <component :is="getStatusIcon(dispute.status)" class="w-3.5 h-3.5" />
                  {{ dispute.status }}
                </span>
                <ChevronRight class="w-4 h-4 text-slate-300" />
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-16">
          <div class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
            <Gavel class="w-10 h-10 text-slate-300" />
          </div>
          <h3 class="text-lg font-bold text-slate-800">No disputes yet</h3>
          <p class="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Every escrow completed successfully helps build trust. If an issue arises, we're here to help mediate fairly.
          </p>
          <PactButton variant="primary" size="md" class="mt-6" @click="showRaiseForm = true">
            <Scale class="w-4 h-4" />
            Raise a Dispute
          </PactButton>
        </div>
      </template>
    </template>
  </div>
</template>

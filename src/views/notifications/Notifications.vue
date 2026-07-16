<!-- src/views/notifications/Notifications.vue -->
<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import PactCard from '../../components/ui/PactCard.vue';
import PactButton from '../../components/ui/PactButton.vue';
import PactBadge from '../../components/ui/PactBadge.vue';
import api from '../../services/api';
import { 
  Bell, 
  CheckCheck, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Inbox,
  ArrowRight
} from '@lucide/vue';

const router = useRouter();
const authStore = useAuthStore();
const notifications = ref([]);
const loading = ref(false);

const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.read).length;
});

async function fetchNotifications() {
  loading.value = true;
  try {
    const res = await api.get('/notifications');
    notifications.value = res.data.notifications;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
}

async function markAsRead(id) {
  try {
    await api.post(`/notifications/${id}/read`);
    const index = notifications.value.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications.value[index].read = true;
    }
  } catch (err) {
    console.error(err);
  }
}

async function markAllAsRead() {
  try {
    await api.post('/notifications/read-all');
    notifications.value.forEach(n => n.read = true);
  } catch (err) {
    console.error(err);
  }
}

const handleNotificationClick = (item) => {
  markAsRead(item.id);
  router.push(item.actionUrl || '/dashboard');
};

onMounted(() => {
  fetchNotifications();
});
</script>

<template>
  <div class="space-y-6 max-w-4xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Bell class="w-5.5 h-5.5 text-brand-500" />
          Notifications Feed
        </h2>
        <p class="text-xs text-slate-500 mt-0.5">Track actions, proposal updates, and payment releases on your account</p>
      </div>

      <PactButton 
        v-if="unreadCount > 0" 
        @click="markAllAsRead" 
        variant="secondary" 
        size="sm"
      >
        <CheckCheck class="w-4 h-4 text-brand-600" />
        Mark All as Read
      </PactButton>
    </div>

    <!-- Notifications List -->
    <div v-if="loading" class="space-y-4 animate-pulse">
      <div v-for="i in 3" :key="i" class="h-20 bg-slate-100 rounded-2xl"></div>
    </div>

    <div v-else-if="notifications.length > 0" class="space-y-3">
      <div
        v-for="item in notifications"
        :key="item.id"
        class="bg-white border rounded-2xl p-5 shadow-premium flex items-start gap-4 transition duration-150 hover:bg-slate-50/20"
        :class="[ !item.read ? 'border-brand-100 bg-brand-50/5' : 'border-slate-100' ]"
      >
        <!-- Icon indication -->
        <span class="mt-0.5 shrink-0 flex items-center justify-center h-8 w-8 rounded-xl"
          :class="[
            item.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
            item.type === 'danger' ? 'bg-red-50 text-red-600 border border-red-100' :
            'bg-blue-50 text-blue-600 border border-blue-100'
          ]"
        >
          <CheckCircle2 v-if="item.type === 'success'" class="w-4.5 h-4.5" />
          <AlertTriangle v-else-if="item.type === 'danger'" class="w-4.5 h-4.5" />
          <Clock v-else class="w-4.5 h-4.5" />
        </span>

        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-4">
            <h4 class="text-xs font-bold text-slate-800" :class="[ !item.read ? 'text-brand-600' : '' ]">
              {{ item.title }}
            </h4>
            <span class="text-[10px] text-slate-400 font-medium">
              {{ new Date(item.timestamp).toLocaleDateString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'}) }}
            </span>
          </div>
          
          <p class="text-xs text-slate-600 mt-1 leading-relaxed">
            {{ item.message }}
          </p>

          <!-- Interactive Actions bar inside Notification row -->
          <div class="mt-3.5 flex items-center gap-3.5">
            <PactButton 
              @click="handleNotificationClick(item)" 
              variant="secondary" 
              size="sm"
              class="py-1 px-3"
            >
              Open details
              <ArrowRight class="w-3 h-3" />
            </PactButton>
            
            <button
              v-if="!item.read"
              @click="markAsRead(item.id)"
              class="text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              Mark read
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-premium">
      <Inbox class="w-12 h-12 text-slate-300 mx-auto mb-4" />
      <h3 class="text-base font-bold text-slate-800 font-sans">All Caught Up!</h3>
      <p class="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
        You have no notifications or updates waiting on your dashboard.
      </p>
    </div>
  </div>
</template>

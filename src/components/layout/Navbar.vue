<!-- src/components/layout/Navbar.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { useContractsStore } from '../../stores/contracts';
import api from '../../services/api';
import { 
  Bell, 
  Plus, 
  ChevronDown, 
  Moon,
  Sun,
  CheckCircle,
  Clock,
  AlertTriangle,
  Inbox
} from '@lucide/vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const contractsStore = useContractsStore();

const showNotifications = ref(false);
const notifications = ref([]);
const loadingNotifications = ref(false);
const isDarkMode = ref(false);

const getGreeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
});

const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.read).length;
});

async function fetchNotifications() {
  if (!authStore.isAuthenticated) return;
  try {
    const res = await api.get('/notifications');
    notifications.value = res.data.notifications;
  } catch (err) {
    console.error(err);
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
  showNotifications.value = false;
  router.push(item.actionUrl || '/notifications');
};

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value;
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
};

onMounted(() => {
  // Initialize theme from localStorage
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    isDarkMode.value = true;
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  fetchNotifications();
  contractsStore.fetchWallet();
  setInterval(fetchNotifications, 60000);
});
</script>

<template>
  <div class="h-12 bg-slate-50 border-slate-200 sticky top-0 z-20"></div>
  <header class="h-20 bg-slate-50 border-slate-200 flex items-center justify-between px-8 sticky top-0 z-20">
    <!-- Left: Greeting -->
    <div>
      <h1 class="text-xl font-bold text-slate-900 tracking-tight">
        {{ getGreeting }}, {{ authStore.user?.name?.split(' ')[0] || 'there' }}
      </h1>
      <p class="text-sm text-slate-500 mt-0.5">Ready when you are</p>
    </div>

    <!-- Right Utility Panel -->
    <div class="flex items-center gap-3">
      
      <!-- New Payment Invite Button -->
      <button
        @click="router.push('/payment-invites?create=true')"
        class="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white text-sm font-semibold rounded-xl shadow-sm cursor-pointer transition-all duration-150"
      >
        <Plus class="w-4 h-4 stroke-[2.5]" />
        New Payment Invite
      </button>

      <!-- Currency Selector -->
      <div class="flex items-center gap-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-100 transition-all duration-150">
        <span class="text-slate-900 font-bold">₦</span>
        <span>NGN</span>
        <ChevronDown class="w-3.5 h-3.5 text-slate-400" />
      </div>

      <!-- Theme Toggle -->
      <button
        @click="toggleTheme"
        class="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200 cursor-pointer"
        title="Toggle theme"
      >
        <Sun v-if="!isDarkMode" class="w-5 h-5" />
        <Moon v-else class="w-5 h-5" />
      </button>

      <!-- Notifications Bell Widget -->
      <div class="relative">
        <button
          @click="showNotifications = !showNotifications"
          class="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl relative transition-all duration-200 cursor-pointer"
        >
          <Bell class="w-5 h-5" />
          <span
            v-if="unreadCount > 0"
            class="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"
          ></span>
        </button>

        <!-- Dropdown Notifications Menu -->
        <div
          v-if="showNotifications"
          class="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-lg z-50 overflow-hidden"
          @click.outside="showNotifications = false"
        >
          <div class="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <span class="text-sm font-bold text-slate-800">Notifications</span>
            <button
              v-if="unreadCount > 0"
              @click="markAllAsRead"
              class="text-xs font-semibold text-brand-600 hover:underline cursor-pointer"
            >
              Mark all read
            </button>
          </div>

          <!-- List -->
          <div class="divide-y divide-slate-50 max-h-80 overflow-y-auto">
            <div
              v-for="item in notifications.slice(0, 4)"
              :key="item.id"
              @click="handleNotificationClick(item)"
              class="p-4 hover:bg-slate-50/70 transition-all duration-150 cursor-pointer flex gap-3 align-start"
              :class="[ !item.read ? 'bg-brand-50/15' : '' ]"
            >
              <span class="mt-0.5 shrink-0 flex items-center justify-center h-5 w-5 rounded-full"
                :class="[
                  item.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
                  item.type === 'danger' ? 'bg-red-50 text-red-600' :
                  'bg-blue-50 text-blue-600'
                ]"
              >
                <CheckCircle v-if="item.type === 'success'" class="w-3.5 h-3.5" />
                <AlertTriangle v-else-if="item.type === 'danger'" class="w-3.5 h-3.5" />
                <Clock v-else class="w-3.5 h-3.5" />
              </span>

              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-1.5">
                  <p class="text-sm font-bold text-slate-800 truncate" :class="[ !item.read ? 'text-brand-600' : '' ]">
                    {{ item.title }}
                  </p>
                  <span class="text-xs text-slate-400 shrink-0">Just now</span>
                </div>
                <p class="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                  {{ item.message }}
                </p>
              </div>
            </div>

            <!-- Empty State -->
            <div v-if="notifications.length === 0" class="p-6 text-center">
              <Inbox class="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p class="text-sm text-slate-400 font-medium">All caught up!</p>
            </div>
          </div>

          <!-- Bottom bar -->
          <div class="p-2 border-t border-slate-100 bg-slate-50/20 text-center">
            <router-link
              to="/notifications"
              @click="showNotifications = false"
              class="block text-xs font-bold text-slate-600 hover:text-brand-600 hover:underline"
            >
              View all notifications
            </router-link>
          </div>
        </div>
      </div>
      
    </div>
  </header>
</template>

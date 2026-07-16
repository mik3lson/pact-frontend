<!-- src/components/layout/Sidebar.vue -->
<script setup>
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Send, 
  FileText, 
  Wallet, 
  Bell, 
  Key, 
  ShieldAlert, 
  Users, 
  Settings, 
  LogOut,
  ChevronRight,
  ArrowLeftRight
} from '@lucide/vue';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const menuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Payment Invites', path: '/payment-invites', icon: Send },
  { name: 'Milestone Contracts', path: '/contracts', icon: FileText },
  { name: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
  { name: 'Wallets', path: '/wallet', icon: Wallet },
];

const bottomMenuItems = [
  { name: 'Notifications', path: '/notifications', icon: Bell },
  { name: 'Disputes', path: '/disputes', icon: ShieldAlert },
];

const handleLogout = () => {
  authStore.logout();
  router.push('/auth/login');
};
</script>

<template>
  <aside class="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 shrink-0 z-30">
    <!-- Brand Header -->
    <div class="h-20 border-b border-slate-100 flex items-center px-6">
      <img src="/src/assets/images/pactlogogo.png" alt="Pact Logo" class="h-10 w-auto" />
    </div>

    <!-- Navigation Menu -->
    <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      <div class="mb-4">
        <p class="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Main Menu</p>
        <router-link
          v-for="item in menuItems"
          :key="item.name"
          :to="item.path"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group cursor-pointer"
          :class="[
            route.path.startsWith(item.path)
              ? 'bg-brand-50 text-brand-600 font-semibold'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          ]"
        >
          <component
            :is="item.icon"
            class="w-5 h-5 shrink-0"
            :class="[
              route.path.startsWith(item.path)
                ? 'text-brand-500'
                : 'text-slate-400 group-hover:text-slate-500'
            ]"
          />
          <span>{{ item.name }}</span>
        </router-link>
      </div>

      <div>
        <p class="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Workspace</p>
        <router-link
          v-for="item in bottomMenuItems"
          :key="item.name"
          :to="item.path"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group cursor-pointer"
          :class="[
            route.path.startsWith(item.path)
              ? 'bg-brand-50 text-brand-600 font-semibold'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
          ]"
        >
          <component
            :is="item.icon"
            class="w-5 h-5 shrink-0"
            :class="[
              route.path.startsWith(item.path)
                ? 'text-brand-500'
                : 'text-slate-400 group-hover:text-slate-500'
            ]"
          />
          <span>{{ item.name }}</span>
        </router-link>
      </div>
    </nav>

    <!-- Sidebar Footer (Profile Info & Settings) -->
    <div class="p-4 border-t border-slate-100 bg-white">
      <div class="flex items-center gap-3">
        <div class="h-9 w-9 rounded-full overflow-hidden bg-slate-200 border border-slate-300 shrink-0">
          <img v-if="authStore.user?.avatar" :src="authStore.user.avatar" class="h-full w-full object-cover" />
          <div v-else class="h-full w-full flex items-center justify-center bg-brand-100 text-brand-600 text-xs font-bold">
            {{ authStore.user?.name?.charAt(0) || 'U' }}
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-slate-800 truncate">{{ authStore.user?.name || 'User' }}</p>
          <p class="text-xs text-slate-500 truncate">@{{ authStore.user?.username || 'username' }}</p>
        </div>
        <router-link
          to="/settings"
          class="p-2 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-all duration-200 cursor-pointer"
          title="Settings"
        >
          <Settings class="w-4 h-4" />
        </router-link>
      </div>
    </div>
  </aside>
</template>

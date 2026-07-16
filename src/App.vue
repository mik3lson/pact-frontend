<!-- src/App.vue -->
<script setup>
import { useRoute } from 'vue-router';
import Sidebar from './components/layout/Sidebar.vue';
import Navbar from './components/layout/Navbar.vue';

const route = useRoute();
</script>

<template>
  <!-- Guest Layout (Login, Register, Forgot Password) -->
  <div v-if="route.meta.requiresGuest" class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>

  <!-- Authenticated Layout (Dashboard, Invoices, Contracts, Wallet, Settings) -->
  <div v-else class="min-h-screen flex bg-slate-50 text-slate-900">
    <Sidebar />
    <div class="flex-1 flex flex-col min-w-0">
      <Navbar />
      <!-- Main Content Area -->
      <main class="flex-1 overflow-y-auto p-8 max-w-7xl w-full mx-auto">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

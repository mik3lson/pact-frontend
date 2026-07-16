// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { initDb } from '../services/mockDb';

const routes = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/auth/login',
    name: 'Login',
    component: () => import('../views/auth/Login.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/auth/register',
    name: 'Register',
    component: () => import('../views/auth/Register.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/auth/forgot-password',
    name: 'ForgotPassword',
    component: () => import('../views/auth/ForgotPassword.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/dashboard/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/contracts',
    name: 'Contracts',
    component: () => import('../views/contracts/ContractsList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/contracts/:id',
    name: 'ContractDetails',
    component: () => import('../views/contracts/ContractDetails.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/invoices',
    name: 'Invoices',
    component: () => import('../views/invoices/InvoicesList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/wallet',
    name: 'Wallet',
    component: () => import('../views/wallet/Wallet.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/settings/Settings.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/payment-invites',
    name: 'PaymentInvites',
    component: () => import('../views/payment-invite/PaymentInvitePage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/transactions',
    name: 'Transactions',
    component: () => import('../views/transactions/Transactions.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: () => import('../views/notifications/Notifications.vue'),
    meta: { requiresAuth: true }
  },
  // Fallback redirect
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  // Always initialize mock database on route load
  initDb();
  
  const authStore = useAuthStore();
  
  // Hydrate auth user state if token exists but user is not loaded
  if (authStore.token && !authStore.user) {
    await authStore.checkMe();
  }

  const isAuth = authStore.isAuthenticated;

  if (to.meta.requiresAuth && !isAuth) {
    next('/auth/login');
  } else if (to.meta.requiresGuest && isAuth) {
    next('/dashboard');
  } else {
    next();
  }
});

export default router;

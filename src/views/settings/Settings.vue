 <!-- src/views/settings/Settings.vue -->
<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import PactCard from '../../components/ui/PactCard.vue';
import PactButton from '../../components/ui/PactButton.vue';
import PactInput from '../../components/ui/PactInput.vue';
import { 
  User, 
  Building2, 
  ShieldCheck, 
  BellRing, 
  Palette,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Plus,
  LogOut
} from '@lucide/vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const activeTab = ref('profile'); // 'profile' | 'bank' | 'security' | 'notifications' | 'appearance'
const successMessage = ref('');
const localError = ref('');
const actionLoading = ref(false);

// Form Profile bindings
const profileName = ref('');
const profileTitle = ref('');
const profileBio = ref('');
const profileAvatar = ref('');

// Form Bank bindings
const bankName = ref('');
const accountType = ref('Checking');
const routingNumber = ref('');
const accountNumber = ref('');
const showAddBank = ref(false);

// Form Security bindings
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const twoFactor = ref(false);

// Form Notification bindings
const notifEmail = ref(true);
const notifPush = ref(true);
const notifMarketing = ref(false);

// Form Appearance accent bindings
const activeAccent = ref('#6DB33F');
const colorAccents = [
  { name: 'Pact Green', hex: '#6DB33F' },
  { name: 'Classic Indigo', hex: '#4F46E5' },
  { name: 'Teal Teal', hex: '#0D9488' },
  { name: 'Warm Amber', hex: '#D97706' },
  { name: 'Slate Gray', hex: '#475569' }
];

onMounted(() => {
  // Sync tab with URL queries if present
  if (route.query.tab) {
    activeTab.value = route.query.tab;
  }
  syncFormData();
});

watch(() => route.query.tab, (val) => {
  if (val) activeTab.value = val;
});

const syncFormData = () => {
  const user = authStore.user;
  if (user) {
    profileName.value = user.name || '';
    profileTitle.value = user.title || '';
    profileBio.value = user.bio || '';
    profileAvatar.value = user.avatar || '';
    twoFactor.value = user.settings?.security?.twoFactor || false;
    
    // Notifications settings
    notifEmail.value = user.settings?.notifications?.email ?? true;
    notifPush.value = user.settings?.notifications?.push ?? true;
    notifMarketing.value = user.settings?.notifications?.marketing ?? false;
  }
};

const handleSaveProfile = async () => {
  successMessage.value = '';
  localError.value = '';
  actionLoading.value = true;
  
  try {
    await authStore.updateProfile({
      name: profileName.value,
      title: profileTitle.value,
      bio: profileBio.value,
      avatar: profileAvatar.value
    });
    successMessage.value = 'Profile updated successfully!';
  } catch (err) {
    localError.value = 'Failed to update profile details.';
  } finally {
    actionLoading.value = false;
  }
};

const handleAddBank = async () => {
  successMessage.value = '';
  localError.value = '';
  
  if (!bankName.value || !accountNumber.value || !routingNumber.value) {
    localError.value = 'All bank fields are required.';
    return;
  }

  // Mask number for security display
  const maskedAcct = '•••• ' + accountNumber.value.slice(-4);
  actionLoading.value = true;
  
  try {
    await authStore.addBankAccount({
      bankName: bankName.value,
      accountType: accountType.value,
      routingNumber: routingNumber.value,
      accountNumber: maskedAcct
    });
    
    // Reset
    bankName.value = '';
    routingNumber.value = '';
    accountNumber.value = '';
    showAddBank.value = false;
    successMessage.value = 'Bank account linked and verified successfully!';
  } catch (err) {
    localError.value = 'Failed to link bank account.';
  } finally {
    actionLoading.value = false;
  }
};

const handleDeleteBank = async (id) => {
  if (!confirm('Are you sure you want to remove this bank account?')) return;
  
  try {
    await authStore.deleteBankAccount(id);
    successMessage.value = 'Bank account removed.';
  } catch (err) {
    localError.value = 'Failed to delete bank account.';
  }
};

const handleSaveSecurity = async () => {
  successMessage.value = '';
  localError.value = '';

  if (newPassword.value !== confirmPassword.value) {
    localError.value = 'New passwords do not match.';
    return;
  }

  actionLoading.value = true;
  await new Promise(r => setTimeout(r, 600)); // Simulate api
  actionLoading.value = false;

  // Clear fields
  currentPassword.value = '';
  newPassword.value = '';
  confirmPassword.value = '';
  
  // Sync 2FA change back to settings
  await authStore.updateProfile({
    settings: {
      ...authStore.user.settings,
      security: { twoFactor: twoFactor.value }
    }
  });

  successMessage.value = 'Security settings updated successfully!';
};

const handleSavePreferences = async () => {
  successMessage.value = '';
  localError.value = '';
  actionLoading.value = true;

  try {
    await authStore.updateProfile({
      settings: {
        ...authStore.user.settings,
        notifications: {
          email: notifEmail.value,
          push: notifPush.value,
          marketing: notifMarketing.value
        }
      }
    });
    successMessage.value = 'Notification triggers updated.';
  } catch (err) {
    localError.value = 'Failed to save notifications preference.';
  } finally {
    actionLoading.value = false;
  }
};

const handleSaveAppearance = () => {
  successMessage.value = 'Appearance accent saved (demo only).';
};

const handleLogout = () => {
  authStore.logout();
  router.push('/auth/login');
};

const tabs = [
  { id: 'profile', name: 'Profile Info', icon: User },
  { id: 'bank', name: 'Bank Accounts', icon: Building2 },
  { id: 'security', name: 'Security & 2FA', icon: ShieldCheck },
  { id: 'notifications', name: 'Notifications', icon: BellRing },
  { id: 'appearance', name: 'Appearance', icon: Palette }
];
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-xl font-bold text-slate-900 tracking-tight">System Settings</h2>
      <p class="text-xs text-slate-500 mt-0.5">Manage your personal profiles, withdrawal bank pathways, and security rules</p>
    </div>

    <!-- Alert triggers -->
    <div v-if="successMessage" class="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-semibold text-emerald-700 flex items-center gap-1.5 shadow-sm">
      <CheckCircle2 class="w-4 h-4 text-emerald-500" />
      {{ successMessage }}
    </div>

    <div v-if="localError" class="p-3.5 bg-red-50 border border-red-100 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-1.5 shadow-sm">
      <AlertCircle class="w-4 h-4 text-red-500" />
      {{ localError }}
    </div>

    <!-- Tab navigation deck -->
    <div class="flex border-b border-slate-200 overflow-x-auto gap-4 scrollbar-none">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id; successMessage = ''; localError = '';"
        class="py-3 border-b-2 font-semibold text-xs transition duration-150 inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
        :class="[
          activeTab === tab.id
            ? 'border-brand-500 text-brand-600 font-extrabold'
            : 'border-transparent text-slate-500 hover:text-slate-800'
        ]"
      >
        <component :is="tab.icon" class="w-4.5 h-4.5" />
        {{ tab.name }}
      </button>
    </div>

    <!-- TAB PANEL CONTENT -->
    <div class="mt-4">
      
      <!-- 1. PROFILE INFO PANEL -->
      <PactCard v-if="activeTab === 'profile'" padding="p-6">
        <form @submit.prevent="handleSaveProfile" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Full Name -->
            <PactInput
              v-model="profileName"
              label="Full Name"
              required
            />
            
            <!-- Professional title -->
            <PactInput
              v-model="profileTitle"
              label="Professional Subtitle / Role"
              placeholder="e.g. Freelance Graphic Designer"
            />
          </div>

          <!-- Avatar Image link -->
          <PactInput
            v-model="profileAvatar"
            label="Profile Image URL"
            placeholder="https://images.unsplash.com/..."
          />

          <!-- User Bio -->
          <PactInput
            v-model="profileBio"
            label="Profile Biography"
            type="textarea"
            :rows="4"
            placeholder="Tell clients or contractors about your skill set and details..."
          />

          <div class="border-t border-slate-50 pt-4 flex justify-end">
            <PactButton type="submit" variant="primary" :loading="actionLoading">
              Save Changes
            </PactButton>
          </div>
        </form>
      </PactCard>

      <!-- 2. BANK ACCOUNTS PANEL -->
      <div v-if="activeTab === 'bank'" class="space-y-6">
        <!-- Linked banks list -->
        <PactCard padding="p-6">
          <template #header>
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-bold text-slate-900">Linked Bank Accounts</h3>
                <p class="text-xs text-slate-500 mt-0.5">Destinations for wallet cashouts and payouts</p>
              </div>
              <PactButton
                v-if="!showAddBank"
                @click="showAddBank = true"
                variant="secondary"
                size="sm"
              >
                <Plus class="w-3.5 h-3.5" />
                Link Bank
              </PactButton>
            </div>
          </template>

          <div class="divide-y divide-slate-100">
            <div 
              v-for="bank in authStore.user?.bankAccounts" 
              :key="bank.id" 
              class="py-4.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
            >
              <div class="flex items-start gap-3">
                <span class="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-500 shrink-0">
                  <Building2 class="w-5 h-5" />
                </span>
                <div>
                  <h4 class="text-xs font-extrabold text-slate-800 leading-tight">
                    {{ bank.bankName }}
                  </h4>
                  <p class="text-[10px] text-slate-500 mt-1 font-medium">
                    {{ bank.accountType }} account ({{ bank.accountNumber }}) · Routing: {{ bank.routingNumber }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <span 
                  class="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border"
                  :class="[
                    bank.status === 'Verified' 
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                      : 'bg-amber-50 border-amber-100 text-amber-700'
                  ]"
                >
                  {{ bank.status }}
                </span>
                
                <button
                  @click="handleDeleteBank(bank.id)"
                  class="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                  title="Remove Account"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Empty linked banks state -->
            <div v-if="!authStore.user?.bankAccounts || authStore.user.bankAccounts.length === 0" class="py-6 text-center text-slate-500">
              <Building2 class="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p class="text-xs font-semibold">No bank accounts linked yet.</p>
              <p class="text-[11px] text-slate-400 mt-0.5">Link a checking or saving node to request available balance payouts.</p>
            </div>
          </div>
        </PactCard>

        <!-- Dynamic form to Add a bank account -->
        <PactCard v-if="showAddBank" padding="p-6">
          <template #header>
            <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wide">Link Payout Account</h3>
          </template>

          <form @submit.prevent="handleAddBank" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Bank Name -->
              <PactInput
                v-model="bankName"
                label="Bank Name"
                placeholder="Chase, Wells Fargo, Mercury"
                required
              />

              <!-- Account Type -->
              <div class="space-y-1.5">
                <label class="block text-xs font-semibold text-slate-700 tracking-wide uppercase">Account Type</label>
                <select 
                  v-model="accountType" 
                  class="block w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition duration-150"
                >
                  <option>Checking</option>
                  <option>Savings</option>
                  <option>Business Checking</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Routing -->
              <PactInput
                v-model="routingNumber"
                label="Routing Number"
                placeholder="9-digit bank routing number"
                type="text"
                required
              />

              <!-- Account number -->
              <PactInput
                v-model="accountNumber"
                label="Account Number"
                placeholder="Standard deposit account number"
                type="text"
                required
              />
            </div>

            <div class="flex justify-end gap-3 pt-3">
              <PactButton @click="showAddBank = false" variant="ghost" size="sm">Cancel</PactButton>
              <PactButton type="submit" variant="primary" size="sm" :loading="actionLoading">
                Verify & Save Bank
              </PactButton>
            </div>
          </form>
        </PactCard>
      </div>

      <!-- 3. SECURITY & 2FA PANEL -->
      <PactCard v-slot:default v-if="activeTab === 'security'" padding="p-6">
        <form @submit.prevent="handleSaveSecurity" class="space-y-6">
          <div class="space-y-4">
            <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-50 pb-2">Change Password</h4>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PactInput
                v-model="currentPassword"
                label="Current Password"
                type="password"
                required
              />
              <PactInput
                v-model="newPassword"
                label="New Password"
                type="password"
                required
              />
              <PactInput
                v-model="confirmPassword"
                label="Confirm New Password"
                type="password"
                required
              />
            </div>
          </div>

          <div class="space-y-4 pt-4 border-t border-slate-100">
            <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wide pb-1">Two-Factor Authentication</h4>
            <label class="flex items-center gap-3 cursor-pointer select-none">
              <input 
                type="checkbox" 
                v-model="twoFactor"
                class="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4.5 w-4.5"
              />
              <span class="text-xs font-medium text-slate-700">Enable simulated 2FA checks on payout withdrawals</span>
            </label>
          </div>

          <div class="border-t border-slate-50 pt-4 flex justify-end">
            <PactButton type="submit" variant="primary" :loading="actionLoading">
              Save Security Rules
            </PactButton>
          </div>
        </form>
      </PactCard>

      <!-- 4. NOTIFICATIONS RULES PANEL -->
      <PactCard v-if="activeTab === 'notifications'" padding="p-6">
        <form @submit.prevent="handleSavePreferences" class="space-y-5">
          <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-50 pb-2">Email & Push Alerts</h3>
          
          <div class="space-y-4.5">
            <label class="flex items-start gap-3 cursor-pointer select-none">
              <input 
                type="checkbox" 
                v-model="notifEmail"
                class="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4.5 w-4.5 mt-0.5"
              />
              <div>
                <span class="text-xs font-bold text-slate-800 block">Email Notifications</span>
                <span class="text-[10px] text-slate-400">Receive receipts, milestone updates, and contract details via email.</span>
              </div>
            </label>

            <label class="flex items-start gap-3 cursor-pointer select-none">
              <input 
                type="checkbox" 
                v-model="notifPush"
                class="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4.5 w-4.5 mt-0.5"
              />
              <div>
                <span class="text-xs font-bold text-slate-800 block">Push Notifications</span>
                <span class="text-[10px] text-slate-400">Enable micro browser toast triggers on contract chat message arrivals.</span>
              </div>
            </label>

            <label class="flex items-start gap-3 cursor-pointer select-none">
              <input 
                type="checkbox" 
                v-model="notifMarketing"
                class="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4.5 w-4.5 mt-0.5"
              />
              <div>
                <span class="text-xs font-bold text-slate-800 block">Marketing & Platform Updates</span>
                <span class="text-[10px] text-slate-400">Subscribe to monthly product feature logs and community escrow reviews.</span>
              </div>
            </label>
          </div>

          <div class="border-t border-slate-50 pt-4 flex justify-end">
            <PactButton type="submit" variant="primary" :loading="actionLoading">
              Save Preferences
            </PactButton>
          </div>
        </form>
      </PactCard>

      <!-- 5. APPEARANCE PANEL -->
      <PactCard v-slot:default v-if="activeTab === 'appearance'" padding="p-6">
        <div class="space-y-6">
          <div>
            <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wide">Brand Accents Theme</h3>
            <p class="text-xs text-slate-500 mt-0.5">Customize the interface highlighting shades</p>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
            <button
              v-for="accent in colorAccents"
              :key="accent.name"
              @click="activeAccent = accent.hex"
              class="flex flex-col items-center gap-2 p-3 bg-slate-50 border rounded-2xl cursor-pointer hover:bg-slate-100 transition"
              :class="[ activeAccent === accent.hex ? 'border-slate-400 ring-2 ring-offset-2 ring-slate-800/10' : 'border-slate-100' ]"
            >
              <span class="h-6 w-6 rounded-full" :style="{ backgroundColor: accent.hex }"></span>
              <span class="text-[10px] font-bold text-slate-700">{{ accent.name }}</span>
            </button>
          </div>

          <div class="border-t border-slate-50 pt-4 flex justify-end">
            <PactButton @click="handleSaveAppearance" variant="primary">
              Apply Accent Theme
            </PactButton>
          </div>
        </div>
      </PactCard>

    </div>

    <!-- Logout Section -->
    <div class="pt-4 border-t border-slate-200">
      <PactCard padding="p-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-bold text-slate-900">Sign Out</h3>
            <p class="text-xs text-slate-500 mt-0.5">End your current session and return to the login screen</p>
          </div>
          <PactButton @click="handleLogout" variant="danger">
            <LogOut class="w-4 h-4" />
            Logout
          </PactButton>
        </div>
      </PactCard>
    </div>
  </div>
</template>

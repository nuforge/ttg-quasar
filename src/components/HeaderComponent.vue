<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useCurrentUser } from 'vuefire';
import { useRouter } from 'vue-router';
import { vueFireAuthService } from 'src/services/vuefire-auth-service';
import { usePlayersFirebaseStore } from 'src/stores/players-firebase-store';
import PlayerAvatar from 'src/components/PlayerAvatar.vue';
import NotificationBell from 'src/components/NotificationBell.vue';

// Define props
defineProps<{
  leftDrawerOpen: boolean;
  rightDrawerOpen: boolean;
}>();

// Define emits
const emit = defineEmits<{
  toggleLeftDrawer: [];
  toggleRightDrawer: [];
}>();

const router = useRouter();
const user = useCurrentUser();
const playersStore = usePlayersFirebaseStore();
const isAuthenticated = computed(() => !!user.value);
const currentPlayer = computed(() => vueFireAuthService.currentPlayer.value);

// Check if current user is admin
const isAdmin = computed(() => {
  if (!user.value) return false;
  const userRole = playersStore.getUserRole(user.value.uid);
  return userRole?.permissions.includes('admin') || false;
});

const signOut = async () => {
  try {
    await vueFireAuthService.signOut();
  } catch (error) {
    console.error('Sign out error:', error);
  }
};

const navigateToAdmin = async (route: string) => {
  try {
    await router.push(route);
  } catch (error) {
    console.error('Navigation error:', error);
  }
};

// Initialize admin data on mount if user is authenticated
onMounted(async () => {
  if (isAuthenticated.value) {
    await playersStore.initializeAdminData();
  }
});
</script>

<template>
  <q-header class="header-theme-responsive">
    <q-toolbar>
      <q-btn flat dense round icon="menu" :aria-label="$t('menu')" @click="emit('toggleLeftDrawer')" />

      <q-toolbar-title class="text-uppercase text-primary font-aldrich">
        Looking For Group
      </q-toolbar-title>

      <!-- User menu -->
      <div v-if="isAuthenticated" class="row items-center q-gutter-sm">
        <!-- Notification Bell -->
        <NotificationBell />

        <PlayerAvatar v-if="currentPlayer" :player="currentPlayer" size="32px" />
        <q-avatar v-else size="32px" color="primary" text-color="white">
          {{ (user?.displayName || 'U').charAt(0).toUpperCase() }}
        </q-avatar>

        <q-btn-dropdown flat no-caps :label="user?.displayName || $t('user')">
          <q-list>
            <q-item clickable v-close-popup to="/account">
              <q-item-section avatar>
                <q-icon name="account_circle" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ $t('account') }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item clickable v-close-popup to="/settings">
              <q-item-section avatar>
                <q-icon name="settings" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ $t('settings.title') }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item clickable v-close-popup to="/game-shelf">
              <q-item-section avatar>
                <q-icon name="mdi-bookshelf" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ $t('gameShelf') }}</q-item-label>
              </q-item-section>
            </q-item>
            
            <!-- Admin section (only show if user is admin) -->
            <template v-if="isAdmin">
              <q-separator />

              <q-item clickable v-close-popup @click="navigateToAdmin('/admin')">
                <q-item-section avatar>
                  <q-icon name="dashboard" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ $t('adminDashboard') }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item clickable v-close-popup @click="navigateToAdmin('/admin/games')">
                <q-item-section avatar>
                  <q-icon name="mdi-dice-6" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ $t('adminGames') }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item clickable v-close-popup @click="navigateToAdmin('/admin/users')">
                <q-item-section avatar>
                  <q-icon name="group" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ $t('adminUsers') }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>

            <q-separator />

            <q-item clickable v-close-popup @click="signOut">
              <q-item-section avatar>
                <q-icon name="logout" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ $t('logout') }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </div>

      <!-- Sign in button for guests -->
      <q-btn v-else flat to="/login" :label="$t('login')" />

      <q-btn flat dense round icon="mdi-calendar-clock" :aria-label="$t('notifications.title')"
        @click="emit('toggleRightDrawer')" />
    </q-toolbar>
  </q-header>
</template>
<style scoped>
.header-theme-responsive {
  background-color: var(--q-color-background);
  color: var(--q-color-on-background);
}
</style>

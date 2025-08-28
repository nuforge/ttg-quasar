<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useCurrentUser } from 'vuefire';
import { vueFireAuthService } from 'src/services/vuefire-auth-service';
import { usePlayersFirebaseStore } from 'src/stores/players-firebase-store';
import LeftDrawer from "src/components/LeftDrawer.vue";
import RightDrawer from "src/components/RightDrawer.vue";
import PlayerAvatar from 'src/components/PlayerAvatar.vue';

const user = useCurrentUser();
const playersStore = usePlayersFirebaseStore();
const isAuthenticated = computed(() => !!user.value);
const currentPlayer = computed(() => vueFireAuthService.currentPlayer.value);

const leftDrawerOpen = ref(false);
const rightDrawerOpen = ref(false);

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

// Initialize admin data on mount if user is authenticated
onMounted(async () => {
  if (isAuthenticated.value) {
    await playersStore.initializeAdminData();
  }
});
</script>

<template>
  <q-layout view="lHr Lpr lFf">
    <q-header class="bg-dark">
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="leftDrawerOpen = !leftDrawerOpen" />

        <q-toolbar-title class="text-uppercase text-primary font-aldrich">
          Looking For Group
        </q-toolbar-title>

        <!-- User menu -->
        <div v-if="isAuthenticated" class="row items-center q-gutter-sm">
          <PlayerAvatar v-if="currentPlayer" :player="currentPlayer" size="32px" />
          <q-avatar v-else size="32px" color="primary" text-color="white">
            {{ (user?.displayName || 'U').charAt(0).toUpperCase() }}
          </q-avatar>

          <q-btn-dropdown flat no-caps :label="user?.displayName || 'User'">
            <q-list>
              <q-item clickable v-close-popup to="/account">
                <q-item-section avatar>
                  <q-icon name="account_circle" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Account</q-item-label>
                </q-item-section>
              </q-item>

              <q-item clickable v-close-popup to="/settings">
                <q-item-section avatar>
                  <q-icon name="settings" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Settings</q-item-label>
                </q-item-section>
              </q-item>

              <!-- Admin section (only show if user is admin) -->
              <q-item v-if="isAdmin" clickable v-close-popup>
                <q-item-section avatar>
                  <q-icon name="mdi-shield-crown" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Admin</q-item-label>
                </q-item-section>

                <q-menu anchor="top right" self="top left">
                  <q-list>
                    <q-item clickable v-close-popup to="/admin">
                      <q-item-section avatar>
                        <q-icon name="dashboard" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>Dashboard</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item clickable v-close-popup to="/admin/games">
                      <q-item-section avatar>
                        <q-icon name="mdi-dice-6" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>Games</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item clickable v-close-popup to="/admin/users">
                      <q-item-section avatar>
                        <q-icon name="group" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>Users</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-item>              <q-separator />

              <q-item clickable v-close-popup @click="signOut">
                <q-item-section avatar>
                  <q-icon name="logout" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Sign Out</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>

        <!-- Sign in button for guests -->
        <q-btn v-else flat to="/login" label="Sign In" />

        <q-btn flat dense round icon="notifications" aria-label="Notifications"
          @click="rightDrawerOpen = !rightDrawerOpen" />
      </q-toolbar>
    </q-header>

    <LeftDrawer v-model="leftDrawerOpen" />
    <RightDrawer v-model="rightDrawerOpen" />

    <q-page-container>
      <q-page class="q-pa-md full-height">
        <router-view />
      </q-page>
    </q-page-container>
  </q-layout>
</template>


<style>
.q-date__calendar-item .q-btn {
  border-radius: 2px !important;
}

.full-height {
  /* Adjust for header height */
  display: flex;
  flex-direction: column;
}
</style>

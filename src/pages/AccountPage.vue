<template>
  <q-page padding>
    <div class="q-mb-md">
      <div class="text-h4">
        <q-icon name="mdi-account-circle-outline" class="q-mr-sm" />
        {{ $t('account') }}
      </div>
    </div>

    <!-- User Info Card -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h6">User Information</div>
      </q-card-section>
      <q-card-section>
        <div v-if="currentUser">
          <q-list>
            <q-item>
              <q-item-section avatar>
                <q-avatar color="primary" text-color="white">
                  <q-icon name="person" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ currentUser.displayName || 'No display name' }}</q-item-label>
                <q-item-label caption>Display Name</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section avatar>
                <q-avatar color="secondary" text-color="white">
                  <q-icon name="email" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ currentUser.email }}</q-item-label>
                <q-item-label caption>Email</q-item-label>
              </q-item-section>
            </q-item>

            <q-item>
              <q-item-section avatar>
                <q-avatar color="info" text-color="white">
                  <q-icon name="fingerprint" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-mono">{{ currentUser.uid }}</q-item-label>
                <q-item-label caption>Firebase UID</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
        <div v-else class="text-center text-grey-6">
          Not signed in
        </div>
      </q-card-section>
    </q-card>

    <!-- Permissions Debug Card -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h6">
          <q-icon name="security" class="q-mr-sm" />
          Permissions & Roles
        </div>
        <div class="text-caption text-grey-6">Debug information for your current permissions</div>
      </q-card-section>
      <q-card-section>
        <div v-if="permissionsInfo">
          <q-list>
            <!-- Admin Status -->
            <q-item>
              <q-item-section avatar>
                <q-avatar :color="permissionsInfo.isAdmin ? 'positive' : 'grey'" text-color="white">
                  <q-icon :name="permissionsInfo.isAdmin ? 'admin_panel_settings' : 'person'" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>
                  {{ permissionsInfo.isAdmin ? 'Administrator' : 'Regular User' }}
                </q-item-label>
                <q-item-label caption>Admin Status</q-item-label>
              </q-item-section>
            </q-item>

            <!-- Permissions List -->
            <q-item>
              <q-item-section avatar>
                <q-avatar color="info" text-color="white">
                  <q-icon name="list" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label v-if="permissionsInfo.permissions.length > 0">
                  <q-chip v-for="permission in permissionsInfo.permissions" :key="permission"
                    :color="getPermissionColor(permission)" text-color="white" size="sm" class="q-mr-xs q-mb-xs">
                    {{ permission }}
                  </q-chip>
                </q-item-label>
                <q-item-label v-else class="text-grey-6">No permissions assigned</q-item-label>
                <q-item-label caption>Your Permissions</q-item-label>
              </q-item-section>
            </q-item>

            <!-- Role Info -->
            <q-item v-if="permissionsInfo.role">
              <q-item-section avatar>
                <q-avatar color="purple" text-color="white">
                  <q-icon name="badge" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ permissionsInfo.role.name }}</q-item-label>
                <q-item-label caption>Role Name</q-item-label>
              </q-item-section>
            </q-item>

            <!-- Debug Info -->
            <q-item>
              <q-item-section avatar>
                <q-avatar color="orange" text-color="white">
                  <q-icon name="bug_report" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>
                  {{ permissionsInfo.rolesLoaded ? 'Yes' : 'No' }}
                  ({{ permissionsInfo.totalRolesInSystem }} total roles in system)
                </q-item-label>
                <q-item-label caption>Roles Data Loaded</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>

          <!-- Refresh Button -->
          <div class="q-mt-md text-center">
            <q-btn color="primary" icon="refresh" label="Refresh Permissions" @click="refreshPermissions"
              :loading="loading" />
          </div>
        </div>
        <div v-else class="text-center text-grey-6">
          <q-spinner size="lg" class="q-mb-md" />
          <div>Loading permissions...</div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Firebase Document Info -->
    <q-card v-if="permissionsInfo && isDevelopment">
      <q-card-section>
        <div class="text-h6">
          <q-icon name="storage" class="q-mr-sm" />
          Firebase Debug Info
        </div>
        <div class="text-caption text-grey-6">Development mode only - Raw Firebase data</div>
      </q-card-section>
      <q-card-section>
        <q-expansion-item icon="code" label="Raw Permissions Object" class="text-weight-bold">
          <div class="q-pa-md bg-grey-1">
            <pre class="text-caption">{{ JSON.stringify(permissionsInfo, null, 2) }}</pre>
          </div>
        </q-expansion-item>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useCurrentUser } from 'vuefire';
import { usePlayersFirebaseStore } from 'src/stores/players-firebase-store';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const currentUser = useCurrentUser();
const playersStore = usePlayersFirebaseStore();
const loading = ref(false);

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Get current user permissions
const permissionsInfo = computed(() => playersStore.getCurrentUserPermissions);

// Helper function to get permission colors
const getPermissionColor = (permission: string) => {
  switch (permission) {
    case 'admin': return 'red';
    case 'moderator': return 'orange';
    case 'user': return 'blue';
    default: return 'grey';
  }
};

// Refresh permissions data
const refreshPermissions = async () => {
  loading.value = true;
  try {
    await playersStore.initializeAdminData();
    $q.notify({
      type: 'positive',
      message: 'Permissions refreshed successfully',
      position: 'top'
    });
  } catch (error) {
    console.error('Error refreshing permissions:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to refresh permissions',
      position: 'top'
    });
  } finally {
    loading.value = false;
  }
};

// Initialize permissions on mount
onMounted(async () => {
  if (currentUser.value) {
    console.log('🔄 Account page mounted, initializing permissions...');
    await refreshPermissions();
  }
});
</script>

<style scoped>
.text-mono {
  font-family: 'Courier New', monospace;
  font-size: 0.85em;
}

pre {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>

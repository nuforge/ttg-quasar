<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useCurrentUser } from 'vuefire';
import { usePlayersFirebaseStore } from 'src/stores/players-firebase-store';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
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
      message: t('permissionsRefreshedSuccessfully'),
      position: 'top'
    });
  } catch (error) {
    console.error('Error refreshing permissions:', error);
    $q.notify({
      type: 'negative',
      message: t('failedToRefreshPermissions'),
      position: 'top'
    });
  } finally {
    loading.value = false;
  }
};

// Initialize permissions on mount
onMounted(async () => {
  if (currentUser.value) {
    await refreshPermissions();
  }
});
</script>

<template>
  <q-page padding>
    <div class="q-mb-md">
      <div class="text-h4">
        <q-icon name="mdi-account-circle-outline" class="q-mr-sm" />
        {{ $t('account') }}
      </div>
    </div>
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-6">
        <!-- User Info Card -->
        <q-card flat class="q-mb-md">
          <q-card-section>
            <div class="text-h6">{{ $t('userInformation') }}</div>
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
                    <q-item-label>{{ currentUser.displayName || $t('noDisplayName') }}</q-item-label>
                    <q-item-label caption>{{ $t('displayName') }}</q-item-label>
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
                    <q-item-label caption>{{ $t('email') }}</q-item-label>
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
                    <q-item-label caption>{{ $t('firebaseUid') }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
            <div v-else class="text-center text-grey-6">
              {{ $t('notSignedIn') }}
            </div>
          </q-card-section>
        </q-card>

        <!-- Firebase Document Info -->
        <q-card v-if="permissionsInfo && isDevelopment" class="q-mb-md">
          <q-card-section>
            <div class="text-h6">
              <q-icon name="storage" class="q-mr-sm" />
              {{ $t('firebaseDebugInfo') }}
            </div>
            <div class="text-caption text-grey-6">{{ $t('developmentModeOnly') }}</div>
          </q-card-section>
          <q-card-section>
            <q-expansion-item icon="code" :label="$t('rawPermissionsObject')" class="text-weight-bold">
              <div class="q-pa-md ">
                <pre class="text-caption">{{ JSON.stringify(permissionsInfo, null, 2) }}</pre>
              </div>
            </q-expansion-item>
          </q-card-section>
        </q-card>

      </div>
      <!-- Permissions Debug Card -->
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-h6">
              <q-icon name="security" class="q-mr-sm" />
              {{ $t('permissionsAndRoles') }}
            </div>
            <div class="text-caption text-grey-6">{{ $t('debugInformationPermissions') }}</div>
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
                      {{ permissionsInfo.isAdmin ? $t('administrator') : $t('regularUser') }}
                    </q-item-label>
                    <q-item-label caption>{{ $t('adminStatus') }}</q-item-label>
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
                    <q-item-label v-else class="text-grey-6">{{ $t('noPermissionsAssigned') }}</q-item-label>
                    <q-item-label caption>{{ $t('yourPermissions') }}</q-item-label>
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
                    <q-item-label caption>{{ $t('roleName') }}</q-item-label>
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
                      {{ permissionsInfo.rolesLoaded ? $t('yes') : $t('no') }}
                      ({{ $t('totalRolesInSystem', { count: permissionsInfo.totalRolesInSystem }) }})
                    </q-item-label>
                    <q-item-label caption>{{ $t('rolesDataLoaded') }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>

              <!-- Refresh Button -->
              <div class="q-mt-md text-center">
                <q-btn color="primary" icon="refresh" :label="$t('refreshPermissions')" @click="refreshPermissions"
                  :loading="loading" />
              </div>
            </div>
            <div v-else class="text-center text-grey-6">
              <q-spinner size="lg" class="q-mb-md" />
              <div>{{ $t('loadingPermissions') }}</div>
            </div>
          </q-card-section>
        </q-card>

      </div>
    </div>

  </q-page>
</template>


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

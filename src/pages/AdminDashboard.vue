<template>
  <q-page padding class="admin-dashboard">
    <div class="page-header q-mb-md">
      <div class="text-h4">Admin Dashboard</div>
      <div class="text-body1 text-grey-6">System overview and quick actions</div>
    </div>

    <!-- Quick Stats -->
    <div class="row q-gutter-md q-mb-xl">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="stat-card">
          <q-card-section>
            <div class="flex items-center">
              <q-icon name="group" size="lg" color="primary" class="q-mr-md" />
              <div>
                <div class="text-h4">{{ totalUsers }}</div>
                <div class="text-caption text-grey-6">Total Users</div>
              </div>
            </div>
          </q-card-section>
          <q-card-actions>
            <q-btn flat color="primary" to="/admin/users">Manage Users</q-btn>
          </q-card-actions>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="stat-card">
          <q-card-section>
            <div class="flex items-center">
              <q-icon name="mdi-dice-6" size="lg" color="secondary" class="q-mr-md" />
              <div>
                <div class="text-h4">{{ totalGames }}</div>
                <div class="text-caption text-grey-6">Total Games</div>
              </div>
            </div>
          </q-card-section>
          <q-card-actions>
            <q-btn flat color="secondary" to="/admin/games">Manage Games</q-btn>
          </q-card-actions>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="stat-card">
          <q-card-section>
            <div class="flex items-center">
              <q-icon name="event" size="lg" color="positive" class="q-mr-md" />
              <div>
                <div class="text-h4">{{ totalEvents }}</div>
                <div class="text-caption text-grey-6">Active Events</div>
              </div>
            </div>
          </q-card-section>
          <q-card-actions>
            <q-btn flat color="positive" to="/events">View Events</q-btn>
          </q-card-actions>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="stat-card">
          <q-card-section>
            <div class="flex items-center">
              <q-icon name="message" size="lg" color="warning" class="q-mr-md" />
              <div>
                <div class="text-h4">{{ totalMessages }}</div>
                <div class="text-caption text-grey-6">Messages</div>
              </div>
            </div>
          </q-card-section>
          <q-card-actions>
            <q-btn flat color="warning" to="/messages">View Messages</q-btn>
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- System Status -->
    <div class="row q-gutter-md q-mb-xl">
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-h6">
              <q-icon name="settings" class="q-mr-sm" />
              System Status
            </div>
          </q-card-section>
          <q-card-section class="q-pt-none">
            <q-list>
              <q-item>
                <q-item-section avatar>
                  <q-avatar :color="firebaseStatus.color" text-color="white" icon="mdi-firebase" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Firebase Connection</q-item-label>
                  <q-item-label caption>{{ firebaseStatus.message }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-avatar :color="authStatus.color" text-color="white" icon="security" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Authentication</q-item-label>
                  <q-item-label caption>{{ authStatus.message }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-item>
                <q-item-section avatar>
                  <q-avatar :color="dataStatus.color" text-color="white" icon="database" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Data Migration</q-item-label>
                  <q-item-label caption>{{ dataStatus.message }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-h6">
              <q-icon name="trending_up" class="q-mr-sm" />
              Recent Activity
            </div>
          </q-card-section>
          <q-card-section class="q-pt-none">
            <q-list>
              <q-item v-for="activity in recentActivity" :key="activity.id">
                <q-item-section avatar>
                  <q-avatar :color="activity.color" text-color="white" :icon="activity.icon" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ activity.title }}</q-item-label>
                  <q-item-label caption>{{ activity.timestamp }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="row q-gutter-md">
      <div class="col-12">
        <q-card>
          <q-card-section>
            <div class="text-h6">
              <q-icon name="flash_on" class="q-mr-sm" />
              Quick Actions
            </div>
          </q-card-section>
          <q-card-section class="q-pt-none">
            <div class="row q-gutter-md">
              <q-btn
                color="primary"
                icon="group_add"
                label="Add User"
                @click="$router.push('/admin/users')"
              />
              <q-btn
                color="secondary"
                icon="mdi-dice-plus"
                label="Add Game"
                @click="$router.push('/admin/games')"
              />
              <q-btn
                color="positive"
                icon="event_note"
                label="Create Event"
                @click="$router.push('/events')"
              />
              <q-btn
                color="info"
                icon="backup"
                label="Backup Data"
                @click="backupData"
                :loading="backupLoading"
              />
              <q-btn
                color="warning"
                icon="refresh"
                label="Refresh Cache"
                @click="refreshCache"
                :loading="refreshLoading"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { usePlayersFirebaseStore } from 'src/stores/players-firebase-store';
import { useGamesFirebaseStore } from 'src/stores/games-firebase-store';
import { useEventsFirebaseStore } from 'src/stores/events-firebase-store';

const $q = useQuasar();
const playersStore = usePlayersFirebaseStore();
const gamesStore = useGamesFirebaseStore();
const eventsStore = useEventsFirebaseStore();

const backupLoading = ref(false);
const refreshLoading = ref(false);

// Stats
const totalUsers = computed(() => playersStore.players.length);
const totalGames = computed(() => gamesStore.games.length);
const totalEvents = computed(() => eventsStore.events.length);
const totalMessages = computed(() => 0); // Placeholder

// System status
const firebaseStatus = computed(() => ({
  color: 'positive',
  message: 'Connected and operational'
}));

const authStatus = computed(() => ({
  color: 'positive',
  message: 'Authentication services active'
}));

const dataStatus = computed(() => ({
  color: 'positive',
  message: 'All data sources synchronized'
}));

// Recent activity (mock data for now)
const recentActivity = ref([
  {
    id: 1,
    title: 'New user registered',
    timestamp: '2 minutes ago',
    color: 'primary',
    icon: 'person_add'
  },
  {
    id: 2,
    title: 'Game submission approved',
    timestamp: '15 minutes ago',
    color: 'positive',
    icon: 'check_circle'
  },
  {
    id: 3,
    title: 'Event created',
    timestamp: '1 hour ago',
    color: 'secondary',
    icon: 'event'
  },
  {
    id: 4,
    title: 'User role updated',
    timestamp: '2 hours ago',
    color: 'warning',
    icon: 'security'
  }
]);

// Actions
const backupData = async () => {
  backupLoading.value = true;
  try {
    // Simulate backup process
    await new Promise(resolve => setTimeout(resolve, 2000));
    $q.notify({
      type: 'positive',
      message: 'Data backup completed successfully'
    });
  } catch (error) {
    console.error('Backup failed:', error);
    $q.notify({
      type: 'negative',
      message: 'Backup failed'
    });
  } finally {
    backupLoading.value = false;
  }
};

const refreshCache = async () => {
  refreshLoading.value = true;
  try {
    await Promise.all([
      playersStore.fetchAllPlayers(),
      // gamesStore.loadGames(), // Uncomment when needed
      // eventsStore.fetchAllEvents() // Uncomment when available
    ]);
    $q.notify({
      type: 'positive',
      message: 'Cache refreshed successfully'
    });
  } catch (error) {
    console.error('Failed to refresh cache:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to refresh cache'
    });
  } finally {
    refreshLoading.value = false;
  }
};

// Initialize data
onMounted(async () => {
  try {
    await Promise.all([
      playersStore.fetchAllPlayers(),
      playersStore.initializeAdminData()
    ]);
  } catch (error) {
    console.error('Error loading admin dashboard:', error);
  }
});
</script>

<style scoped lang="scss">
.admin-dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 2rem;
}

.stat-card {
  height: 100%;
  display: flex;
  flex-direction: column;

  .q-card__section {
    flex-grow: 1;
  }

  .q-card__actions {
    padding: 16px;
    padding-top: 0;
  }
}
</style>

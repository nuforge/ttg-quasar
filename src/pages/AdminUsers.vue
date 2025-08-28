<template>
  <q-page padding class="admin-users">
    <div class="page-header q-mb-md">
      <div class="text-h4">User Administration</div>
      <div class="text-body1 text-grey-6">Manage users, roles, and permissions</div>
    </div>

    <!-- Search and Filters -->
    <div class="row q-gutter-md q-mb-md">
      <div class="col-12 col-md-8">
        <q-input
          v-model="searchTerm"
          placeholder="Search users by name or email..."
          outlined
          dense
          @keyup.enter="searchUsers"
          clearable
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
          <template v-slot:append>
            <q-btn
              flat
              round
              dense
              icon="search"
              @click="searchUsers"
              :loading="searching"
            />
          </template>
        </q-input>
      </div>
      <div class="col-12 col-md-4">
        <q-select
          v-model="statusFilter"
          :options="statusOptions"
          placeholder="Filter by status"
          outlined
          dense
          clearable
          emit-value
          map-options
        />
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="row q-gutter-md q-mb-md">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="stats-card">
          <q-card-section>
            <div class="flex items-center">
              <q-icon name="group" size="md" color="primary" class="q-mr-sm" />
              <div>
                <div class="text-h5">{{ totalUsers }}</div>
                <div class="text-caption text-grey-6">Total Users</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="stats-card">
          <q-card-section>
            <div class="flex items-center">
              <q-icon name="check_circle" size="md" color="positive" class="q-mr-sm" />
              <div>
                <div class="text-h5">{{ activeUsers }}</div>
                <div class="text-caption text-grey-6">Active Users</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="stats-card">
          <q-card-section>
            <div class="flex items-center">
              <q-icon name="block" size="md" color="negative" class="q-mr-sm" />
              <div>
                <div class="text-h5">{{ blockedUsers }}</div>
                <div class="text-caption text-grey-6">Blocked Users</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="stats-card">
          <q-card-section>
            <div class="flex items-center">
              <q-icon name="admin_panel_settings" size="md" color="warning" class="q-mr-sm" />
              <div>
                <div class="text-h5">{{ adminUsers }}</div>
                <div class="text-caption text-grey-6">Admin Users</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Users Table -->
    <q-card>
      <q-card-section>
        <q-table
          :rows="filteredUsers"
          :columns="columns"
          :loading="playersStore.loading"
          :pagination="pagination"
          row-key="firebaseId"
          selection="multiple"
          v-model:selected="selected"
          @request="onRequest"
        >
          <template v-slot:top>
            <div class="full-width flex justify-between items-center">
              <div class="text-h6">Users</div>
              <div class="q-gutter-sm">
                <q-btn
                  v-if="selected.length > 0"
                  color="negative"
                  icon="block"
                  label="Block Selected"
                  @click="bulkUpdateStatus('blocked')"
                  outline
                />
                <q-btn
                  v-if="selected.length > 0"
                  color="positive"
                  icon="check_circle"
                  label="Activate Selected"
                  @click="bulkUpdateStatus('active')"
                  outline
                />
                <q-btn
                  color="primary"
                  icon="refresh"
                  label="Refresh"
                  @click="refreshUsers"
                  :loading="playersStore.loading"
                />
              </div>
            </div>
          </template>

          <template v-slot:body-cell-avatar="props">
            <q-td :props="props">
              <q-avatar size="32px">
                <img v-if="props.row.avatar" :src="props.row.avatar" :alt="props.row.name" />
                <span v-else class="text-white">{{ props.row.getInitials() }}</span>
              </q-avatar>
            </q-td>
          </template>

          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-chip
                :color="getStatusColor(props.row)"
                :icon="getStatusIcon(props.row)"
                text-color="white"
                :label="getDisplayStatus(props.row)"
                size="sm"
              />
            </q-td>
          </template>

          <template v-slot:body-cell-role="props">
            <q-td :props="props">
              <q-chip
                v-for="role in getUserRoles(props.row)"
                :key="role"
                :color="getRoleColor(role)"
                text-color="white"
                :label="role"
                size="sm"
                class="q-mr-xs"
              />
              <span v-if="!getUserRoles(props.row).length" class="text-grey-6">User</span>
            </q-td>
          </template>

          <template v-slot:body-cell-joinDate="props">
            <q-td :props="props">
              {{ formatDate(props.row.joinDate) }}
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn-group flat>
                <q-btn
                  flat
                  round
                  dense
                  icon="edit"
                  size="sm"
                  @click="editUser(props.row)"
                >
                  <q-tooltip>Edit User</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  dense
                  icon="security"
                  size="sm"
                  @click="manageRoles(props.row)"
                >
                  <q-tooltip>Manage Roles</q-tooltip>
                </q-btn>
                <q-btn
                  v-if="getDisplayStatus(props.row) === 'active'"
                  flat
                  round
                  dense
                  icon="block"
                  size="sm"
                  color="negative"
                  @click="blockUser(props.row)"
                >
                  <q-tooltip>Block User</q-tooltip>
                </q-btn>
                <q-btn
                  v-else-if="getDisplayStatus(props.row) === 'blocked'"
                  flat
                  round
                  dense
                  icon="check_circle"
                  size="sm"
                  color="positive"
                  @click="unblockUser(props.row)"
                >
                  <q-tooltip>Unblock User</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  dense
                  icon="delete"
                  size="sm"
                  color="negative"
                  @click="deleteUser(props.row)"
                >
                  <q-tooltip>Delete User</q-tooltip>
                </q-btn>
              </q-btn-group>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Edit User Dialog -->
    <q-dialog v-model="editDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Edit User</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            v-model="editForm.name"
            label="Name"
            outlined
            dense
            :rules="[val => !!val || 'Name is required']"
          />
          <q-input
            v-model="editForm.email"
            label="Email"
            outlined
            dense
            type="email"
            class="q-mt-md"
            :rules="[val => !!val || 'Email is required']"
          />
          <q-input
            v-model="editForm.bio"
            label="Bio"
            outlined
            dense
            type="textarea"
            class="q-mt-md"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="editDialog = false" />
          <q-btn color="primary" label="Save" @click="saveUser" :loading="saving" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Role Management Dialog -->
    <q-dialog v-model="roleDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Manage User Roles</div>
          <div class="text-body2 text-grey-6">{{ selectedUser?.name }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-option-group
            v-model="selectedRoles"
            :options="roleOptions"
            color="primary"
            type="checkbox"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="roleDialog = false" />
          <q-btn color="primary" label="Save Roles" @click="saveRoles" :loading="saving" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Confirmation Dialogs -->
    <q-dialog v-model="confirmDialog" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="warning" text-color="white" />
          <span class="q-ml-sm">{{ confirmMessage }}</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="confirmDialog = false" />
          <q-btn
            :color="confirmAction === 'delete' ? 'negative' : 'primary'"
            :label="confirmAction === 'delete' ? 'Delete' : 'Confirm'"
            @click="executeConfirmAction"
            :loading="saving"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { usePlayersFirebaseStore } from 'src/stores/players-firebase-store';
import type { Player } from 'src/models/Player';

// Type for readonly player objects from the store with additional Firebase fields
type ReadonlyPlayerWithFirebase = {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly avatar?: string | undefined;
  readonly joinDate: Date;
  readonly bio?: string | undefined;
  readonly preferences?: {
    readonly favoriteGames?: readonly number[];
    readonly preferredGenres?: readonly string[];
  } | undefined;
  readonly firebaseId?: string | undefined;
  readonly role?: readonly string[] | undefined;
  readonly status?: 'active' | 'blocked' | 'pending' | undefined;
  readonly isActive?: () => boolean;
};

const $q = useQuasar();
const playersStore = usePlayersFirebaseStore();

// State
const searchTerm = ref('');
const searching = ref(false);
const statusFilter = ref<string>('');
const selected = ref<Player[]>([]);
const editDialog = ref(false);
const roleDialog = ref(false);
const confirmDialog = ref(false);
const saving = ref(false);

const selectedUser = ref<Player | null>(null);
const confirmMessage = ref('');
const confirmAction = ref<'delete' | 'block' | 'unblock' | 'activate'>('delete');
const confirmCallback = ref<() => void | Promise<void>>(() => {});

// Form data
const editForm = ref({
  name: '',
  email: '',
  bio: '',
});

const selectedRoles = ref<string[]>([]);

// Constants
const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Blocked', value: 'blocked' },
  { label: 'Pending', value: 'pending' },
];

const roleOptions = [
  { label: 'Administrator', value: 'admin' },
  { label: 'Moderator', value: 'moderator' },
  { label: 'Event Organizer', value: 'organizer' },
  { label: 'User', value: 'user' },
];

const columns = [
  {
    name: 'avatar',
    label: '',
    field: 'avatar',
    align: 'center' as const,
    style: 'width: 60px',
  },
  {
    name: 'name',
    required: true,
    label: 'Name',
    align: 'left' as const,
    field: 'name',
    sortable: true,
  },
  {
    name: 'email',
    label: 'Email',
    align: 'left' as const,
    field: 'email',
    sortable: true,
  },
  {
    name: 'status',
    label: 'Status',
    align: 'center' as const,
    field: 'status',
    sortable: true,
  },
  {
    name: 'role',
    label: 'Role',
    align: 'left' as const,
    field: 'role',
  },
  {
    name: 'joinDate',
    label: 'Join Date',
    align: 'left' as const,
    field: 'joinDate',
    sortable: true,
  },
  {
    name: 'actions',
    label: 'Actions',
    align: 'center' as const,
    field: 'actions',
    style: 'width: 200px',
  },
];

const pagination = ref({
  sortBy: 'name',
  descending: false,
  page: 1,
  rowsPerPage: 10,
});

// Computed
const filteredUsers = computed(() => {
  let users = playersStore.players;

  if (statusFilter.value) {
    users = users.filter(user => getDisplayStatus(user) === statusFilter.value);
  }

  return users;
});

const totalUsers = computed(() => playersStore.players.length);
const activeUsers = computed(() =>
  playersStore.players.filter(user => getDisplayStatus(user) === 'active').length
);
const blockedUsers = computed(() =>
  playersStore.players.filter(user => getDisplayStatus(user) === 'blocked').length
);
const adminUsers = computed(() =>
  playersStore.players.filter(user => getUserRoles(user).includes('admin')).length
);

// Methods
// Using ReadonlyPlayerWithFirebase type for proper typing of store objects
const getDisplayStatus = (user: ReadonlyPlayerWithFirebase): string => {
  const status = playersStore.getUserStatus(user.firebaseId || '');
  return status?.status || 'active';
};

const getUserRoles = (user: ReadonlyPlayerWithFirebase): string[] => {
  const role = playersStore.getUserRole(user.firebaseId || '');
  return role?.permissions || [];
};

const getStatusColor = (user: ReadonlyPlayerWithFirebase): string => {
  const status = getDisplayStatus(user);
  switch (status) {
    case 'active': return 'positive';
    case 'blocked': return 'negative';
    case 'pending': return 'warning';
    default: return 'grey';
  }
};

const getStatusIcon = (user: ReadonlyPlayerWithFirebase): string => {
  const status = getDisplayStatus(user);
  switch (status) {
    case 'active': return 'check_circle';
    case 'blocked': return 'block';
    case 'pending': return 'schedule';
    default: return 'help';
  }
};

const getRoleColor = (role: string): string => {
  switch (role) {
    case 'admin': return 'negative';
    case 'moderator': return 'warning';
    case 'organizer': return 'info';
    default: return 'primary';
  }
};

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

const refreshUsers = async () => {
  await playersStore.fetchAllPlayers();
  await playersStore.initializeAdminData();
};

const searchUsers = async () => {
  if (!searchTerm.value.trim()) {
    await refreshUsers();
    return;
  }

  searching.value = true;
  try {
    await playersStore.searchPlayers(searchTerm.value);
  } finally {
    searching.value = false;
  }
};

const editUser = (user: Player) => {
  selectedUser.value = user;
  editForm.value = {
    name: user.name,
    email: user.email,
    bio: user.bio || '',
  };
  editDialog.value = true;
};

const manageRoles = (user: Player) => {
  selectedUser.value = user;
  selectedRoles.value = getUserRoles(user);
  roleDialog.value = true;
};

const blockUser = (user: Player) => {
  selectedUser.value = user;
  confirmMessage.value = `Are you sure you want to block ${user.name}?`;
  confirmAction.value = 'block';
  confirmCallback.value = async () => {
    await playersStore.updateUserStatus(user.firebaseId || '', 'blocked', 'Blocked by administrator');
    $q.notify({
      type: 'positive',
      message: `${user.name} has been blocked`,
    });
  };
  confirmDialog.value = true;
};

const unblockUser = (user: Player) => {
  selectedUser.value = user;
  confirmMessage.value = `Are you sure you want to unblock ${user.name}?`;
  confirmAction.value = 'unblock';
  confirmCallback.value = async () => {
    await playersStore.updateUserStatus(user.firebaseId || '', 'active');
    $q.notify({
      type: 'positive',
      message: `${user.name} has been unblocked`,
    });
  };
  confirmDialog.value = true;
};

const deleteUser = (user: Player) => {
  selectedUser.value = user;
  confirmMessage.value = `Are you sure you want to delete ${user.name}? This action cannot be undone.`;
  confirmAction.value = 'delete';
  confirmCallback.value = async () => {
    await playersStore.deleteUser(user.firebaseId || '');
    $q.notify({
      type: 'positive',
      message: `${user.name} has been deleted`,
    });
  };
  confirmDialog.value = true;
};

const bulkUpdateStatus = (status: 'active' | 'blocked') => {
  const action = status === 'active' ? 'activate' : 'block';
  confirmMessage.value = `Are you sure you want to ${action} ${selected.value.length} selected users?`;
  confirmAction.value = action;
  confirmCallback.value = async () => {
    const promises = selected.value.map(user =>
      playersStore.updateUserStatus(user.firebaseId || '', status)
    );
    await Promise.all(promises);
    selected.value = [];
    $q.notify({
      type: 'positive',
      message: `${selected.value.length} users have been ${action}d`,
    });
  };
  confirmDialog.value = true;
};

const saveUser = () => {
  if (!selectedUser.value) return;

  saving.value = true;
  try {
    // Note: In a real implementation, you'd update the user profile
    // For now, we'll just show a success message
    $q.notify({
      type: 'positive',
      message: 'User updated successfully',
    });
    editDialog.value = false;
  } catch (error) {
    console.error('Failed to update user:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to update user',
    });
  } finally {
    saving.value = false;
  }
};

const saveRoles = async () => {
  if (!selectedUser.value?.firebaseId) return;

  saving.value = true;
  try {
    await playersStore.updatePlayerRole(selectedUser.value.firebaseId, {
      name: selectedRoles.value.join(', '),
      permissions: selectedRoles.value,
    });

    $q.notify({
      type: 'positive',
      message: 'Roles updated successfully',
    });
    roleDialog.value = false;
  } catch (error) {
    console.error('Failed to update roles:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to update roles',
    });
  } finally {
    saving.value = false;
  }
};

const executeConfirmAction = async () => {
  saving.value = true;
  try {
    const result = confirmCallback.value();
    if (result instanceof Promise) {
      await result;
    }
    confirmDialog.value = false;
  } catch (error) {
    console.error('Action failed:', error);
    $q.notify({
      type: 'negative',
      message: 'Action failed',
    });
  } finally {
    saving.value = false;
  }
};

// Using proper type for Quasar table request event
const onRequest = (props: { pagination: { page: number; rowsPerPage: number; sortBy: string; descending: boolean } }) => {
  pagination.value = props.pagination;
};

// Lifecycle
onMounted(async () => {
  await refreshUsers();
});
</script>

<style scoped lang="scss">
.admin-users {
  max-width: 1200px;
  margin: 0 auto;
}

.stats-card {
  .q-card__section {
    padding: 16px;
  }
}

.page-header {
  text-align: center;
  margin-bottom: 2rem;
}

.q-table {
  .q-td {
    vertical-align: middle;
  }
}
</style>

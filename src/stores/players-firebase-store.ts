import { defineStore } from 'pinia';
import { ref, computed, readonly } from 'vue';
import {
  collection,
  doc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from 'src/boot/firebase';
import { Player } from 'src/models/Player';
import { authService } from 'src/services/auth-service';

export interface PlayerRole {
  id: string;
  name: string;
  permissions: string[];
}

export interface UserStatus {
  id: string;
  status: 'active' | 'blocked' | 'pending';
  reason?: string;
  updatedAt: Date;
  updatedBy: string;
}

export const usePlayersFirebaseStore = defineStore('playersFirebase', () => {
  const players = ref<Player[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Admin-specific state
  const userRoles = ref<Map<string, PlayerRole>>(new Map());
  const userStatuses = ref<Map<string, UserStatus>>(new Map());

  // Getters
  const getPlayerById = computed(() => (id: number | string) => {
    return players.value.find((player) => player.id === id || player.id === Number(id));
  });

  const getPlayersByIds = computed(() => (ids: (number | string)[]) => {
    return players.value.filter(
      (player) => ids.includes(player.id) || ids.includes(player.id.toString()),
    );
  });

  const isCurrentUserAdmin = computed(() => {
    if (!authService.currentUser.value) return false;

    // Development override: Allow admin access for authenticated users if no admin roles exist
    if (process.env.NODE_ENV === 'development' && userRoles.value.size === 0) {
      console.warn('🔧 Development Mode: Granting admin access due to no admin roles configured');
      return true;
    }

    const role = userRoles.value.get(authService.currentUser.value.uid);
    return role?.permissions.includes('admin') || false;
  });

  const getPlayerByFirebaseId = computed(() => (firebaseId: string) => {
    return players.value.find(
      (player) => (player as Player & { firebaseId?: string }).firebaseId === firebaseId,
    );
  });

  // Actions
  const fetchAllPlayers = async () => {
    loading.value = true;
    error.value = null;

    try {
      const playersQuery = query(collection(db, 'players'), orderBy('name'));
      const snapshot = await getDocs(playersQuery);

      const playersData: Player[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const player = new Player({
          ...data,
          id: data.id || parseInt(doc.id.slice(-6), 36), // Fallback ID generation
          joinDate: data.joinDate instanceof Timestamp ? data.joinDate.toDate() : data.joinDate,
        });

        // Store Firebase ID for reference
        (player as Player & { firebaseId?: string }).firebaseId = doc.id;
        playersData.push(player);
      });

      players.value = playersData;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error fetching players';
      console.error('Error fetching players:', err);
    } finally {
      loading.value = false;
    }
  };

  const fetchPlayerRoles = () => {
    // Use real-time listener for user roles so admin permissions update automatically
    try {
      onSnapshot(collection(db, 'userRoles'), (snapshot) => {
        const rolesMap = new Map<string, PlayerRole>();

        snapshot.forEach((doc) => {
          const roleData = { id: doc.id, ...doc.data() } as PlayerRole;
          rolesMap.set(doc.id, roleData);
        });

        userRoles.value = rolesMap;
        console.log('✅ Real-time loaded', rolesMap.size, 'user roles');
      });
    } catch (err) {
      console.error('❌ Error setting up user roles listener:', err);
    }
  };
  const fetchUserStatuses = async () => {
    // Remove admin check to avoid circular dependency
    try {
      console.log('🔍 Fetching user statuses from Firebase...');
      const statusesSnapshot = await getDocs(collection(db, 'userStatuses'));
      const statusesMap = new Map<string, UserStatus>();

      statusesSnapshot.forEach((doc) => {
        const data = doc.data();
        const statusData = {
          id: doc.id,
          status: data.status,
          reason: data.reason,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
          updatedBy: data.updatedBy,
        };
        statusesMap.set(doc.id, statusData);
      });

      userStatuses.value = statusesMap;
      console.log('✅ Loaded', statusesMap.size, 'user statuses');
    } catch (err) {
      console.error('❌ Error fetching user statuses:', err);
    }
  };

  const updatePlayerRole = async (firebaseId: string, role: Omit<PlayerRole, 'id'>) => {
    if (!isCurrentUserAdmin.value) {
      throw new Error('Insufficient permissions');
    }

    try {
      await setDoc(doc(db, 'userRoles', firebaseId), {
        name: role.name,
        permissions: role.permissions,
        updatedAt: new Date(),
        updatedBy: authService.currentUser.value?.uid,
      });

      userRoles.value.set(firebaseId, { id: firebaseId, ...role });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error updating role';
      throw new Error(`Failed to update player role: ${message}`);
    }
  };

  const updateUserStatus = async (
    firebaseId: string,
    status: UserStatus['status'],
    reason?: string,
  ) => {
    if (!isCurrentUserAdmin.value) {
      throw new Error('Insufficient permissions');
    }

    try {
      const statusData = {
        status,
        reason: reason || undefined,
        updatedAt: new Date(),
        updatedBy: authService.currentUser.value?.uid,
      };

      await setDoc(doc(db, 'userStatuses', firebaseId), statusData);

      const statusUpdate: UserStatus = {
        id: firebaseId,
        status,
        updatedAt: new Date(),
        updatedBy: authService.currentUser.value?.uid || '',
      };

      if (reason) {
        statusUpdate.reason = reason;
      }

      userStatuses.value.set(firebaseId, statusUpdate);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error updating status';
      throw new Error(`Failed to update user status: ${message}`);
    }
  };

  const deleteUser = async (firebaseId: string) => {
    if (!isCurrentUserAdmin.value) {
      throw new Error('Insufficient permissions');
    }

    try {
      // Remove from players collection
      await deleteDoc(doc(db, 'players', firebaseId));

      // Remove from roles and statuses
      await deleteDoc(doc(db, 'userRoles', firebaseId));
      await deleteDoc(doc(db, 'userStatuses', firebaseId));

      // Update local state
      players.value = players.value.filter(
        (player) => (player as Player & { firebaseId?: string }).firebaseId !== firebaseId,
      );
      userRoles.value.delete(firebaseId);
      userStatuses.value.delete(firebaseId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error deleting user';
      throw new Error(`Failed to delete user: ${message}`);
    }
  };

  const searchPlayers = async (searchTerm: string, maxResults = 20) => {
    loading.value = true;
    error.value = null;

    try {
      // Firebase doesn't have full-text search, so we'll search by name prefix
      const searchQuery = query(
        collection(db, 'players'),
        where('name', '>=', searchTerm),
        where('name', '<=', searchTerm + '\uf8ff'),
        orderBy('name'),
        limit(maxResults),
      );

      const snapshot = await getDocs(searchQuery);
      const searchResults: Player[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        const player = new Player({
          ...data,
          id: data.id || parseInt(doc.id.slice(-6), 36),
          joinDate: data.joinDate instanceof Timestamp ? data.joinDate.toDate() : data.joinDate,
        });

        (player as Player & { firebaseId?: string }).firebaseId = doc.id;
        searchResults.push(player);
      });

      return searchResults;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error searching players';
      console.error('Error searching players:', err);
      return [];
    } finally {
      loading.value = false;
    }
  };

  const getUserRole = (firebaseId: string): PlayerRole | null => {
    return userRoles.value.get(firebaseId) || null;
  };

  const getUserStatus = (firebaseId: string): UserStatus | null => {
    return userStatuses.value.get(firebaseId) || null;
  };

  // Get current user's permissions for debugging
  const getCurrentUserPermissions = computed(() => {
    if (!authService.currentUser.value) return null;
    const role = userRoles.value.get(authService.currentUser.value.uid);
    return {
      uid: authService.currentUser.value.uid,
      email: authService.currentUser.value.email,
      role: role,
      permissions: role?.permissions || [],
      isAdmin: role?.permissions.includes('admin') || false,
      rolesLoaded: userRoles.value.size > 0,
      totalRolesInSystem: userRoles.value.size,
    };
  });

  const subscribeToPlayerUpdates = (callback?: () => void) => {
    const playersRef = collection(db, 'players');
    return onSnapshot(playersRef, (snapshot) => {
      const updatedPlayers: Player[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        const player = new Player({
          ...data,
          id: data.id || parseInt(doc.id.slice(-6), 36),
          joinDate: data.joinDate instanceof Timestamp ? data.joinDate.toDate() : data.joinDate,
        });

        (player as Player & { firebaseId?: string }).firebaseId = doc.id;
        updatedPlayers.push(player);
      });

      players.value = updatedPlayers;
      callback?.();
    });
  };

  // Initialize admin data when needed
  const initializeAdminData = async () => {
    // Always fetch roles and statuses to determine admin status
    fetchPlayerRoles(); // Remove await since it's no longer async
    await fetchUserStatuses();
  };

  return {
    // State
    players: readonly(players),
    loading: readonly(loading),
    error: readonly(error),
    userRoles: readonly(userRoles),
    userStatuses: readonly(userStatuses),

    // Getters
    getPlayerById,
    getPlayersByIds,
    getPlayerByFirebaseId,
    isCurrentUserAdmin,
    getUserRole,
    getUserStatus,
    getCurrentUserPermissions,

    // Actions
    fetchAllPlayers,
    searchPlayers,
    subscribeToPlayerUpdates,
    initializeAdminData,

    // Admin actions
    updatePlayerRole,
    updateUserStatus,
    deleteUser,
  };
});

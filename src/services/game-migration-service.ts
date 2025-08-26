import { useGamesFirebaseStore } from 'src/stores/games-firebase-store';
import { imageStorageService } from './image-storage-service';
import type { QVueGlobals } from 'quasar';

export interface MigrationResult {
  successful: number;
  total: number;
  errors: Array<{ gameId: number; error: string }>;
}

export interface RollbackResult {
  deleted: number;
  errors: Array<{ error: string }>;
}

class GameMigrationService {
  // Migration is complete - all methods return appropriate messages
  migrateGamesToFirebase($q?: QVueGlobals): MigrationResult {
    const result: MigrationResult = {
      successful: 0,
      total: 0,
      errors: [],
    };

    if ($q) {
      $q.notify({
        type: 'info',
        message: 'Migration has already been completed. All games are now in Firebase.',
        timeout: 3000,
      });
    }

    return result;
  }

  async testStorageConnectivity(): Promise<{ success: boolean; error?: string }> {
    return await imageStorageService.testStorageConnectivity();
  }

  clearAllGames($q?: QVueGlobals): void {
    if ($q) {
      $q.notify({
        type: 'warning',
        message: 'Clear function is disabled. Games are managed through Firebase Console.',
        timeout: 3000,
      });
    }
  }

  async checkMigrationStatus(): Promise<boolean> {
    const gamesStore = useGamesFirebaseStore();
    try {
      await gamesStore.loadGames();
      return gamesStore.games.length > 0;
    } catch (error) {
      console.error('Error checking migration status:', error);
      return false;
    }
  }

  rollbackMigration($q?: QVueGlobals): RollbackResult {
    const result: RollbackResult = {
      deleted: 0,
      errors: [],
    };

    if ($q) {
      $q.notify({
        type: 'warning',
        message:
          'Rollback function is disabled. Migration is complete and games are managed through Firebase Console.',
        timeout: 3000,
      });
    }

    return result;
  }
}

export const gameMigrationService = new GameMigrationService();

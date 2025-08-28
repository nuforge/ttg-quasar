import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from 'src/boot/firebase';
import { Player } from 'src/models/Player';
import { eventMigrationService } from './event-migration-service';
import playersData from 'src/assets/data/players.json';

export class DataMigrationService {
  /**
   * Migrate players from JSON to Firebase
   */
  async migratePlayers(): Promise<{
    total: number;
    successful: number;
    errors: string[];
  }> {
    const results = {
      total: 0,
      successful: 0,
      errors: [] as string[],
    };

    try {
      const players = Player.fromJSON(playersData);
      results.total = players.length;

      for (const player of players) {
        try {
          // Check if player already exists
          const existingQuery = query(
            collection(db, 'players'),
            where('email', '==', player.email),
          );
          const existingSnapshot = await getDocs(existingQuery);

          if (existingSnapshot.empty) {
            // Create new player document with a generated ID
            const playerId = `legacy_${player.id}_${Date.now()}`;

            // Sanitize data to avoid undefined values
            const playerData = {
              id: player.id,
              name: player.name || '',
              email: player.email || '',
              bio: player.bio || '', // Default to empty string if undefined
              joinDate: player.joinDate || new Date(),
              preferences: player.preferences || {},
              createdAt: new Date(),
              updatedAt: new Date(),
              migratedFrom: 'json',
              legacyId: player.id,
            };

            await setDoc(doc(db, 'players', playerId), playerData);

            results.successful++;
          } else {
            // Player already exists, skip
            console.log(`Player ${player.email} already exists, skipping`);
            results.successful++;
          }
        } catch (error) {
          const errorMessage = `Failed to migrate player ${player.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          results.errors.push(errorMessage);
          console.error(errorMessage);
        }
      }
    } catch (error) {
      const errorMessage = `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      results.errors.push(errorMessage);
      console.error(errorMessage);
    }

    return results;
  }

  /**
   * Check migration status
   */
  async checkMigrationStatus(): Promise<{
    isComplete: boolean;
    migratedCount: number;
    totalCount: number;
  }> {
    try {
      const totalCount = playersData.length;
      const migratedSnapshot = await getDocs(collection(db, 'players'));
      const migratedCount = migratedSnapshot.size;

      return {
        isComplete: migratedCount >= totalCount,
        migratedCount,
        totalCount,
      };
    } catch (error) {
      console.error('Error checking migration status:', error);
      return {
        isComplete: false,
        migratedCount: 0,
        totalCount: playersData.length,
      };
    }
  }

  /**
   * Migrate events from JSON to Firebase with Google Calendar sync
   */
  async migrateEvents(options?: {
    syncToGoogleCalendar?: boolean;
    skipExisting?: boolean;
    dryRun?: boolean;
    appBaseUrl?: string;
  }) {
    return await eventMigrationService.migrateEvents(options);
  }

  /**
   * Sync existing Firebase events to Google Calendar
   */
  async syncEventsToCalendar(appBaseUrl?: string) {
    return await eventMigrationService.syncExistingEventsToCalendar(appBaseUrl);
  }

  /**
   * Full migration - players first, then events
   */
  async migrateAll(options?: {
    syncEventsToCalendar?: boolean;
    appBaseUrl?: string;
    dryRun?: boolean;
  }) {
    const results = {
      players: { total: 0, successful: 0, errors: [] as string[] },
      events: {
        total: 0,
        successful: 0,
        skipped: 0,
        calendarSynced: 0,
        errors: [] as string[],
        warnings: [] as string[],
      },
    };

    console.log('🚀 Starting full data migration...\n');

    // Step 1: Migrate players first (events reference players)
    console.log('👥 Step 1: Migrating players...');
    results.players = await this.migratePlayers();

    // Step 2: Migrate events
    console.log('\n📅 Step 2: Migrating events...');
    results.events = await eventMigrationService.migrateEvents({
      syncToGoogleCalendar: options?.syncEventsToCalendar ?? true,
      skipExisting: true,
      dryRun: options?.dryRun ?? false,
      appBaseUrl: options?.appBaseUrl || 'https://your-app-domain.com',
    });

    console.log('\n🎉 Full migration completed!');
    console.log('📊 Final Summary:');
    console.log(`Players: ${results.players.successful}/${results.players.total} migrated`);
    console.log(
      `Events: ${results.events.successful}/${results.events.total} migrated, ${results.events.calendarSynced} synced to calendar`,
    );

    return results;
  }

  /**
   * Check migration status for all data types
   */
  async checkFullMigrationStatus() {
    const [playerStatus, eventStatus] = await Promise.all([
      this.checkMigrationStatus(),
      eventMigrationService.checkMigrationStatus(),
    ]);

    return {
      players: playerStatus,
      events: eventStatus,
      overall: {
        isComplete: playerStatus.isComplete && eventStatus.isComplete,
        totalItems: playerStatus.totalCount + eventStatus.totalCount,
        migratedItems: playerStatus.migratedCount + eventStatus.migratedCount,
      },
    };
  }
  async ensureDefaultAdmin(): Promise<boolean> {
    try {
      // Check if any admin users exist
      const adminQuery = query(
        collection(db, 'userRoles'),
        where('permissions', 'array-contains', 'admin'),
      );
      const adminSnapshot = await getDocs(adminQuery);

      if (adminSnapshot.empty) {
        console.log('No admin users found. Please create an admin user via /admin/setup');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking for admin users:', error);
      return false;
    }
  }
}

// Export singleton instance
export const dataMigrationService = new DataMigrationService();

import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from 'src/boot/firebase';
import { Player } from 'src/models/Player';
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

            await setDoc(doc(db, 'players', playerId), {
              id: player.id,
              name: player.name,
              email: player.email,
              bio: player.bio,
              joinDate: player.joinDate,
              preferences: player.preferences,
              createdAt: new Date(),
              updatedAt: new Date(),
              migratedFrom: 'json',
              legacyId: player.id,
            });

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
   * Create default admin user if none exists
   */
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

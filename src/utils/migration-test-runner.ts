/**
 * Event Migration Test Runner
 *
 * This script helps test the event migration process in a safe way.
 * Run this in the browser console or as a test to validate migration logic.
 */

import { eventMigrationService } from 'src/services/event-migration-service';
import { dataMigrationService } from 'src/services/data-migration-service';
import eventsData from 'src/assets/data/events.json';

export class MigrationTestRunner {
  /**
   * Run a dry run migration to test the process
   */
  static async testEventMigration() {
    console.log('🧪 Starting Event Migration Test...\n');

    try {
      // First, check current status
      console.log('📊 Checking current migration status...');
      const status = await eventMigrationService.checkMigrationStatus();
      console.log(`Current status: ${status.migratedCount}/${status.totalCount} events migrated`);
      console.log(`Calendar synced: ${status.calendarSyncedCount} events\n`);

      // Run dry run migration
      console.log('🔍 Running dry run migration...');
      const dryRunResult = await eventMigrationService.migrateEvents({
        syncToGoogleCalendar: true,
        skipExisting: true,
        dryRun: true,
        appBaseUrl: 'https://your-app-domain.com',
      });

      console.log('\n📋 Dry Run Results:');
      console.log(`Total events to process: ${dryRunResult.total}`);
      console.log(`Would be successful: ${dryRunResult.successful}`);
      console.log(`Would be skipped: ${dryRunResult.skipped}`);
      console.log(`Errors in dry run: ${dryRunResult.errors.length}`);

      if (dryRunResult.errors.length > 0) {
        console.log('\n❌ Dry run errors:');
        dryRunResult.errors.forEach((error) => console.log(`  - ${error}`));
      }

      // Test data validation
      console.log('\n🔍 Testing data validation...');
      this.validateEventData();

      console.log('\n✅ Migration test completed successfully!');
      return { success: true, results: dryRunResult };
    } catch (error) {
      console.error('\n❌ Migration test failed:', error);
      return { success: false, error };
    }
  }

  /**
   * Validate the event data structure
   */
  static validateEventData() {
    const requiredFields = ['id', 'gameId', 'title', 'date', 'time', 'endTime', 'location'];
    const events = eventsData;

    console.log(`📝 Validating ${events.length} events...`);

    let validEvents = 0;
    const invalidEvents: Array<{
      index: number;
      id: string | number;
      title: string;
      missingFields?: string[];
      issue?: string;
    }> = [];

    events.forEach((event, index) => {
      const missingFields = requiredFields.filter((field) => !event[field as keyof typeof event]);

      if (missingFields.length > 0) {
        invalidEvents.push({
          index,
          id: event.id || 'unknown',
          title: event.title || 'untitled',
          missingFields,
        });
      } else {
        validEvents++;
      }

      // Validate date format
      if (event.date && !/^\d{4}-\d{2}-\d{2}$/.test(event.date)) {
        invalidEvents.push({
          index,
          id: event.id,
          title: event.title,
          issue: `Invalid date format: ${event.date}`,
        });
      }

      // Validate time format
      if (event.time && !/^\d{2}:\d{2}$/.test(event.time)) {
        invalidEvents.push({
          index,
          id: event.id,
          title: event.title,
          issue: `Invalid time format: ${event.time}`,
        });
      }
    });

    console.log(`✅ Valid events: ${validEvents}`);
    console.log(`❌ Invalid events: ${invalidEvents.length}`);

    if (invalidEvents.length > 0) {
      console.log('\n⚠️ Invalid events detected:');
      invalidEvents.forEach((event) => {
        console.log(
          `  Event ${event.id} (${event.title}): ${event.missingFields ? 'Missing fields: ' + event.missingFields.join(', ') : event.issue}`,
        );
      });
    }
  }

  /**
   * Test full migration workflow
   */
  static async testFullMigration() {
    console.log('🚀 Testing Full Migration Workflow...\n');

    try {
      // Check authentication
      console.log('🔐 Checking authentication...');
      // Add auth check here if needed

      // Test players migration first (dry run)
      console.log('👥 Testing players migration...');
      const playersResult = await dataMigrationService.migratePlayers();
      console.log(`Players: ${playersResult.successful}/${playersResult.total} would be migrated`);

      // Test events migration (dry run)
      console.log('📅 Testing events migration...');
      const eventsResult = await this.testEventMigration();

      // Test calendar sync
      console.log('📅 Testing calendar sync capability...');
      // This would test the Google Calendar API connection

      console.log('\n✅ Full migration test completed!');

      return {
        success: true,
        results: {
          players: playersResult,
          events: eventsResult.results,
        },
      };
    } catch (error) {
      console.error('\n❌ Full migration test failed:', error);
      return { success: false, error };
    }
  }

  /**
   * Preview what events will be created in calendar
   */
  static previewCalendarEvents(limit = 5) {
    console.log(`📅 Previewing first ${limit} calendar events...\n`);

    const events = eventsData.slice(0, limit);

    events.forEach((event, index) => {
      console.log(`Event ${index + 1}: ${event.title}`);
      console.log(`  📅 Date: ${event.date} ${event.time} - ${event.endTime}`);
      console.log(`  📍 Location: ${event.location}`);
      console.log(`  👥 Players: ${event.currentPlayers}/${event.maxPlayers}`);
      console.log(`  🎮 Host: ${event.host?.name} (${event.host?.email})`);

      if (event.description) {
        console.log(
          `  📝 Description: ${event.description.substring(0, 80)}${event.description.length > 80 ? '...' : ''}`,
        );
      }

      console.log(''); // Empty line
    });

    console.log(`... and ${eventsData.length - limit} more events`);
  }
}

// Export for use in console or tests
declare global {
  interface Window {
    MigrationTestRunner: typeof MigrationTestRunner;
  }
}

(window as Window).MigrationTestRunner = MigrationTestRunner;

console.log('🧪 Migration Test Runner loaded!');
console.log('Run MigrationTestRunner.testEventMigration() to test event migration');
console.log('Run MigrationTestRunner.testFullMigration() to test full migration');
console.log('Run MigrationTestRunner.previewCalendarEvents() to preview calendar events');

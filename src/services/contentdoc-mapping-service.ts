/**
 * ContentDoc Mapping Service
 * Converts TTG Events and Games to ContentDoc format for CLCA integration
 */

import { ValidationService } from './validation-service';
import { logger } from 'src/utils/logger';
import type { Event } from 'src/models/Event';
import type { Game } from 'src/models/Game';
import type { ContentDoc, RSVPSummary, EventFeature, GameFeature } from 'src/schemas/contentdoc';

export class ContentDocMappingService {
  constructor(private validationService = new ValidationService()) {}

  /**
   * Convert TTG Event to ContentDoc format
   */
  async mapEventToContentDoc(event: Event): Promise<ContentDoc> {
    try {
      const contentDoc: ContentDoc = {
        id: `ttg:event:${event.id}`,
        title: event.title,
        description: event.description || undefined,
        status: this.mapEventStatus(event.status),
        tags: this.buildEventTags(event),
        features: {
          'feat:event/v1': this.buildEventFeature(event),
          ...(event.gameId &&
            event.gameName && {
              'feat:game/v1': this.buildGameFeatureFromEvent(event),
            }),
        },
        rsvpSummary: this.buildRSVPSummary(event),
        images: event.images?.map((img) => ({
          url: img.url,
          caption: img.caption,
          width: img.width,
          height: img.height,
        })),
        ownerSystem: 'ttg',
        originalId: `event:${event.id}`,
        ownerUrl: this.buildEventUrl(event),
        createdAt: this.toISOString(event.createdAt),
        updatedAt: this.toISOString(event.updatedAt),
      };

      // Validate the ContentDoc
      await this.validationService.validateContentDoc(contentDoc);

      logger.info('ContentDoc mapped successfully', {
        eventId: event.id,
        contentDocId: contentDoc.id,
      });

      return contentDoc;
    } catch (error) {
      logger.error('Failed to map event to ContentDoc', error as Error, {
        eventId: event.id,
      });
      throw error;
    }
  }

  /**
   * Convert TTG Game to ContentDoc format
   */
  async mapGameToContentDoc(game: Game): Promise<ContentDoc> {
    try {
      const contentDoc: ContentDoc = {
        id: `ttg:game:${game.id}`,
        title: game.title,
        description: game.description || undefined,
        status: game.approved ? 'published' : 'draft',
        tags: this.buildGameTags(game),
        features: {
          'feat:game/v1': this.buildGameFeature(game),
        },
        ownerSystem: 'ttg',
        originalId: `game:${game.id}`,
        ownerUrl: this.buildGameUrl(game),
        createdAt: this.toISOString(game.createdAt),
        updatedAt: this.toISOString(game.updatedAt),
      };

      await this.validationService.validateContentDoc(contentDoc);

      logger.info('Game ContentDoc mapped successfully', {
        gameId: game.id,
        contentDocId: contentDoc.id,
      });

      return contentDoc;
    } catch (error) {
      logger.error('Failed to map game to ContentDoc', error as Error, {
        gameId: game.id,
      });
      throw error;
    }
  }

  /**
   * Map TTG event status to ContentDoc status
   */
  private mapEventStatus(status: string): ContentDoc['status'] {
    switch (status) {
      case 'upcoming':
        return 'published';
      case 'completed':
        return 'archived';
      case 'cancelled':
        return 'deleted';
      case 'draft':
        return 'draft';
      default:
        return 'pending';
    }
  }

  /**
   * Build event-specific tags
   */
  private buildEventTags(event: Event): string[] {
    const tags = [
      'content-type:event',
      'system:ttg',
      `event-type:${event.eventType || 'game_night'}`,
      `status:${event.status}`,
    ];

    // Add game-specific tags
    if (event.gameId) {
      tags.push(`game-id:${event.gameId}`);
    }

    // Add genre tag if available
    if (event.game?.genre) {
      tags.push(`game-genre:${event.game.genre.toLowerCase()}`);
    }

    // Add location tag
    if (event.location) {
      tags.push(`location:${event.location.toLowerCase().replace(/\s+/g, '-')}`);
    }

    return tags.filter(Boolean);
  }

  /**
   * Build game-specific tags
   */
  private buildGameTags(game: Game): string[] {
    const tags = [
      'content-type:game',
      'system:ttg',
      `genre:${game.genre.toLowerCase()}`,
      `difficulty:${game.difficulty || 'medium'}`,
      `status:${game.status}`,
    ];

    // Add custom tags
    if (game.tags) {
      tags.push(...game.tags.map((tag) => `custom:${tag.toLowerCase()}`));
    }

    // Add player count category
    if (game.numberOfPlayers) {
      const playerCount = game.numberOfPlayers.toString();
      if (playerCount.includes('-')) {
        const [min, max] = playerCount.split('-').map((n) => parseInt(n.trim()));
        if (min <= 2 && max <= 4) {
          tags.push('player-count:small');
        } else if (min <= 4 && max <= 8) {
          tags.push('player-count:medium');
        } else {
          tags.push('player-count:large');
        }
      }
    }

    return tags.filter(Boolean);
  }

  /**
   * Build event feature structure
   */
  private buildEventFeature(event: Event): EventFeature {
    return {
      startTime: this.buildISOTimestamp(event.date, event.time),
      endTime: this.buildISOTimestamp(event.date, event.endTime || event.time),
      location: event.location,
      minPlayers: event.minPlayers,
      maxPlayers: event.maxPlayers,
    };
  }

  /**
   * Build game feature from event data
   */
  private buildGameFeatureFromEvent(event: Event): GameFeature {
    return {
      gameId: event.gameId!.toString(),
      gameName: event.gameName || event.game?.title || 'Unknown Game',
      genre: event.game?.genre,
      playerCount: event.maxPlayers || event.game?.numberOfPlayers,
    };
  }

  /**
   * Build game feature structure
   */
  private buildGameFeature(game: Game): GameFeature {
    return {
      gameId: game.id,
      gameName: game.title,
      genre: game.genre,
      playerCount: game.numberOfPlayers,
    };
  }

  /**
   * Build RSVP summary from event RSVPs
   */
  private buildRSVPSummary(event: Event): RSVPSummary {
    const rsvps = event.rsvps || [];
    return {
      yes: rsvps.filter((r) => r.status === 'confirmed').length,
      no: rsvps.filter((r) => r.status === 'declined').length,
      maybe: rsvps.filter((r) => r.status === 'maybe' || r.status === 'interested').length,
      waitlist: rsvps.filter((r) => r.status === 'waitlist').length,
      capacity: event.maxPlayers || null,
    };
  }

  /**
   * Build ISO timestamp from date and time strings
   */
  private buildISOTimestamp(date: string, time: string): string {
    try {
      const dateTime = new Date(`${date}T${time}`);
      if (isNaN(dateTime.getTime())) {
        throw new Error(`Invalid date/time: ${date}T${time}`);
      }
      return dateTime.toISOString();
    } catch (error) {
      logger.warn('Failed to parse date/time, using current time', {
        date,
        time,
        error: (error as Error).message,
      });
      return new Date().toISOString();
    }
  }

  /**
   * Convert various date formats to ISO string
   */
  private toISOString(date: Date | string | undefined): string {
    if (!date) return new Date().toISOString();

    if (date instanceof Date) {
      return date.toISOString();
    }

    if (typeof date === 'string') {
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }

    return new Date().toISOString();
  }

  /**
   * Build TTG event URL
   */
  private buildEventUrl(event: Event): string {
    const baseUrl = process.env.VITE_APP_BASE_URL || 'https://ttg.example.com';
    const eventId = event.firebaseDocId || event.id;
    const slug = this.createSlug(event.title);
    return `${baseUrl}/events/${eventId}/${slug}`;
  }

  /**
   * Build TTG game URL
   */
  private buildGameUrl(game: Game): string {
    const baseUrl = process.env.VITE_APP_BASE_URL || 'https://ttg.example.com';
    const slug = this.createSlug(game.title);
    return `${baseUrl}/games/${game.id}/${slug}`;
  }

  /**
   * Create URL-friendly slug from title
   */
  private createSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .replace(/[\s_-]+/g, '-') // Replace spaces/underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Trim hyphens
  }
}

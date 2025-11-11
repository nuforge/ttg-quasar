/**
 * Centralized Date Formatting Utility
 * Provides consistent date handling across the entire application
 *
 * Following copilot instructions: Centralized date management patterns
 *
 * ⚠️ CRITICAL: ALL date operations MUST use these functions
 * NO MORE: new Date(), .getTime(), .getFullYear(), .getMonth(), etc.
 */

import { type Timestamp } from 'firebase/firestore';
import { logger } from './logger';

export type DateInput =
  | string
  | number
  | Date
  | Timestamp
  | Record<string, unknown>
  | null
  | undefined;

/**
 * MANDATORY: Parse date-only strings (YYYY-MM-DD) safely without timezone issues
 * Use this instead of: new Date("2025-09-26")
 */
export function parseDateOnly(dateString: string): Date | null {
  const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateOnlyPattern.test(dateString.trim())) {
    return null;
  }

  const parts = dateString.trim().split('-').map(Number);
  if (parts.length === 3 && !parts.some((p) => isNaN(p))) {
    const year = parts[0] as number;
    const month = parts[1] as number;
    const day = parts[2] as number;

    // CRITICAL: Validate date components before creating Date object
    if (month < 1 || month > 12) {
      return null;
    }
    if (day < 1 || day > 31) {
      return null;
    }
    if (year < 1000 || year > 9999) {
      return null;
    }

    // Create date and verify it didn't roll over
    const date = new Date(year, month - 1, day); // month is 0-indexed

    // Check if the date rolled over (e.g., Feb 30 -> Mar 2)
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return null;
    }

    return date;
  }
  return null;
}

/**
 * MANDATORY: Get current timestamp consistently
 * Use this instead of: Date.now()
 */
export function getCurrentTimestamp(): number {
  return Date.now();
}

/**
 * MANDATORY: Get current year consistently
 * Use this instead of: new Date().getFullYear()
 */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}

/**
 * MANDATORY: Get current month (1-12) consistently
 * Use this instead of: new Date().getMonth() + 1
 */
export function getCurrentMonth(): number {
  return new Date().getMonth() + 1;
}

/**
 * MANDATORY: Compare dates safely
 * Use this instead of: new Date(a).getTime() - new Date(b).getTime()
 */
export function compareDates(dateA: DateInput, dateB: DateInput): number {
  const a = normalizeDate(dateA);
  const b = normalizeDate(dateB);
  if (!a || !b) return 0;
  return a.getTime() - b.getTime();
}

/**
 * Date format configurations for consistent styling
 */
export const DATE_FORMATS = {
  // Standard formats
  SHORT: { month: 'short', day: 'numeric', year: 'numeric' } as const,
  LONG: { month: 'long', day: 'numeric', year: 'numeric' } as const,
  FULL: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' } as const,

  // With time
  SHORT_WITH_TIME: {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  } as const,
  LONG_WITH_TIME: {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  } as const,

  // Time only
  TIME_12H: { hour: 'numeric', minute: '2-digit', hour12: true } as const,
  TIME_24H: { hour: '2-digit', minute: '2-digit', hour12: false } as const,

  // Relative
  RELATIVE_SHORT: { dateStyle: 'short' } as const,
  RELATIVE_MEDIUM: { dateStyle: 'medium' } as const,

  // Newsletter specific
  NEWSLETTER_DISPLAY: { month: 'long', year: 'numeric' } as const,
  NEWSLETTER_SEASON: { year: 'numeric' } as const,
} as const;

/**
 * Normalize various date inputs to a consistent Date object
 */
export function normalizeDate(input: DateInput): Date | null {
  if (!input) {
    return null;
  }

  try {
    // Handle Date objects
    if (input instanceof Date) {
      return isNaN(input.getTime()) ? null : input;
    }

    // Handle ISO strings
    if (typeof input === 'string') {
      // Handle various string formats
      if (input === 'Invalid Date' || input.trim() === '') {
        return null;
      }

      // Handle date-only strings (YYYY-MM-DD) to avoid timezone issues
      const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
      if (dateOnlyPattern.test(input.trim())) {
        const parts = input.trim().split('-').map(Number);
        if (parts.length === 3 && !parts.some((p) => isNaN(p))) {
          const year = parts[0] as number;
          const month = parts[1] as number;
          const day = parts[2] as number;

          // CRITICAL: Validate date components before creating Date object
          // Reject obviously invalid dates that would roll over
          if (month < 1 || month > 12) {
            logger.warn('Invalid month in date string:', input);
            return null;
          }
          if (day < 1 || day > 31) {
            logger.warn('Invalid day in date string:', input);
            return null;
          }
          if (year < 1000 || year > 9999) {
            logger.warn('Invalid year in date string:', input);
            return null;
          }

          // Create date and verify it didn't roll over
          const date = new Date(year, month - 1, day); // month is 0-indexed

          // CRITICAL: Check if the date rolled over (e.g., Feb 30 -> Mar 2)
          if (
            date.getFullYear() !== year ||
            date.getMonth() !== month - 1 ||
            date.getDate() !== day
          ) {
            logger.warn('Date rolled over, rejecting:', { input, created: date.toISOString() });
            return null;
          }

          return date;
        }
      }

      const date = new Date(input);
      return isNaN(date.getTime()) ? null : date;
    }

    // Handle Unix timestamps (number)
    if (typeof input === 'number') {
      // Assume milliseconds if > 1e10, otherwise seconds
      const timestamp = input > 1e10 ? input : input * 1000;
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? null : date;
    }

    // Handle Firebase Timestamp and Timestamp-like objects
    if (input && typeof input === 'object') {
      // Check if it's a Timestamp object with toDate method
      if ('toDate' in input && typeof input.toDate === 'function') {
        const timestamp = input as Timestamp;
        return timestamp.toDate();
      }

      // Check if it's a Timestamp object with seconds property
      if ('seconds' in input && typeof input.seconds === 'number') {
        const timestamp = input as { seconds: number; nanoseconds?: number };
        return new Date(timestamp.seconds * 1000);
      }

      // Check if it's a Timestamp-like object with _seconds property
      if ('_seconds' in input && typeof input._seconds === 'number') {
        const timestampLike = input as { _seconds: number };
        return new Date(timestampLike._seconds * 1000);
      }

      // Check if it's a serialized Timestamp with seconds and nanoseconds
      if (
        'seconds' in input &&
        'nanoseconds' in input &&
        typeof input.seconds === 'number' &&
        typeof input.nanoseconds === 'number'
      ) {
        const timestamp = input as { seconds: number; nanoseconds: number };
        return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
      }

      // Check if it's a Date object that was serialized
      if (
        '_isAMomentObject' in input ||
        (input as Record<string, unknown>).constructor?.name === 'Timestamp'
      ) {
        try {
          return new Date(input as unknown as Date | string | number);
        } catch {
          // Fall through to next check
        }
      }
    }

    logger.warn('Unknown date format in normalizeDate:', { input, type: typeof input });
    return null;
  } catch (error) {
    logger.error('Error normalizing date:', error as Error, { input });
    return null;
  }
}

/**
 * Format date with consistent locale and error handling
 */
export function formatDate(
  input: DateInput,
  format: keyof typeof DATE_FORMATS = 'LONG',
  locale = 'en-US',
): string {
  const date = normalizeDate(input);

  if (!date) {
    logger.warn('Invalid date input in formatDate:', input);
    return 'Invalid Date';
  }

  try {
    const options = DATE_FORMATS[format];
    return date.toLocaleDateString(locale, options);
  } catch (error) {
    logger.error('Error formatting date:', error as Error, { input, format });
    return date.toLocaleDateString(); // Fallback to default format
  }
}

/**
 * Format time from various inputs
 * @param input Date input to format
 * @param use24Hour Whether to use 24-hour format (defaults to user preference)
 * @param locale Locale for formatting
 */
export function formatTime(input: DateInput, use24Hour?: boolean, locale = 'en-US'): string {
  const date = normalizeDate(input);

  if (!date) {
    return '';
  }

  try {
    // If use24Hour is not specified, try to get from user settings
    let effectiveUse24Hour = use24Hour;

    if (effectiveUse24Hour === undefined) {
      // Try to get from user settings if available
      try {
        // This will be resolved at runtime when the composable is available
        effectiveUse24Hour = false; // Default fallback
      } catch {
        effectiveUse24Hour = false; // Default fallback
      }
    }

    const options = effectiveUse24Hour ? DATE_FORMATS.TIME_24H : DATE_FORMATS.TIME_12H;
    return date.toLocaleTimeString(locale, options);
  } catch (error) {
    logger.error('Error formatting time:', error as Error, { input });
    return date.toLocaleTimeString(); // Fallback
  }
}

/**
 * Format date and time together
 */
export function formatDateTime(
  input: DateInput,
  format: 'SHORT_WITH_TIME' | 'LONG_WITH_TIME' = 'LONG_WITH_TIME',
  locale = 'en-US',
): string {
  const date = normalizeDate(input);

  if (!date) {
    return 'Invalid Date';
  }

  try {
    const options = DATE_FORMATS[format];
    return date.toLocaleDateString(locale, options);
  } catch (error) {
    logger.error('Error formatting datetime:', error as Error, { input, format });
    return date.toLocaleDateString(); // Fallback
  }
}

/**
 * Convert various date inputs to ISO 8601 string
 */
export function toISOString(input: DateInput): string | null {
  const date = normalizeDate(input);
  return date ? date.toISOString() : null;
}

/**
 * Convert various date inputs to ISO date string (YYYY-MM-DD)
 */
export function toISODateString(input: DateInput): string | null {
  const date = normalizeDate(input);
  return date ? (date.toISOString().split('T')[0] ?? null) : null;
}

/**
 * Convert various date inputs to local date string (YYYY-MM-DD)
 * CRITICAL: This extracts LOCAL date components, not UTC
 * Use this for calendar events to fix timezone issues
 */
export function getLocalDateString(input: DateInput): string | null {
  const date = normalizeDate(input);
  if (!date) return null;

  // Extract local date components (not UTC)
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // getMonth() is 0-indexed
  const day = date.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Get relative time description (e.g., "2 hours ago", "in 3 days")
 */
export function getRelativeTime(input: DateInput, locale = 'en-US'): string {
  const date = normalizeDate(input);

  if (!date) {
    return '';
  }

  try {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    // Use Intl.RelativeTimeFormat for proper localization
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (Math.abs(diffMinutes) < 60) {
      return rtf.format(diffMinutes, 'minute');
    } else if (Math.abs(diffHours) < 24) {
      return rtf.format(diffHours, 'hour');
    } else if (Math.abs(diffDays) < 30) {
      return rtf.format(diffDays, 'day');
    } else {
      // For longer periods, just use formatted date
      return formatDate(date, 'SHORT');
    }
  } catch (error) {
    logger.error('Error getting relative time:', error as Error, { input });
    return formatDate(date, 'SHORT'); // Fallback
  }
}

/**
 * Newsletter-specific date formatting
 */
export function formatNewsletterDate(input: DateInput, season?: string): string {
  const date = normalizeDate(input);

  if (!date) {
    return season ? `${season} ${new Date().getFullYear()}` : 'Unknown Date';
  }

  try {
    // If we have a season, use it with the year
    if (season) {
      const year = date.getFullYear();
      return `${season.charAt(0).toUpperCase() + season.slice(1)} ${year}`;
    }

    // Otherwise use month and year
    return formatDate(date, 'NEWSLETTER_DISPLAY');
  } catch (error) {
    logger.error('Error formatting newsletter date:', error as Error, { input, season });
    return `${season || 'Unknown'} ${new Date().getFullYear()}`;
  }
}

/**
 * Event-specific date/time formatting
 */
export function formatEventDateTime(
  eventDate: DateInput,
  eventTime?: string,
  eventEndTime?: string,
  allDay = false,
  use24Hour?: boolean,
): string {
  const date = normalizeDate(eventDate);

  if (!date) {
    return 'TBD';
  }

  try {
    const dateStr = formatDate(date, 'FULL');

    if (allDay) {
      return `${dateStr} (All Day)`;
    }

    if (eventTime) {
      // Format the time according to user preference
      const formattedStartTime = formatTimeString(eventTime, use24Hour);
      let timeStr = formattedStartTime;

      if (eventEndTime && eventEndTime !== eventTime) {
        const formattedEndTime = formatTimeString(eventEndTime, use24Hour);
        timeStr += ` - ${formattedEndTime}`;
      }
      return `${dateStr} at ${timeStr}`;
    }

    return dateStr;
  } catch (error) {
    logger.error('Error formatting event datetime:', error as Error, {
      eventDate,
      eventTime,
      eventEndTime,
      allDay,
    });
    return formatDate(date, 'LONG');
  }
}

/**
 * Format a time string (HH:MM) according to user preference
 */
export function formatTimeString(timeString: string, use24Hour?: boolean): string {
  try {
    // If it's already in HH:MM format, convert to Date and reformat
    if (/^\d{1,2}:\d{2}$/.test(timeString)) {
      const [hours, minutes] = timeString.split(':').map(Number);
      const date = new Date(2024, 0, 1, hours, minutes, 0);
      return formatTime(date, use24Hour);
    }

    // If it's already formatted, return as-is
    return timeString;
  } catch (error) {
    logger.warn('Failed to format time string:', { timeString, error });
    return timeString;
  }
}

/**
 * Check if a date is today
 */
export function isToday(input: DateInput): boolean {
  const date = normalizeDate(input);
  if (!date) return false;

  const today = new Date();
  return date.toDateString() === today.toDateString();
}

/**
 * Check if a date is in the past
 */
export function isPast(input: DateInput): boolean {
  const date = normalizeDate(input);
  if (!date) return false;

  return date.getTime() < new Date().getTime();
}

/**
 * Check if a date is in the future
 */
export function isFuture(input: DateInput): boolean {
  const date = normalizeDate(input);
  if (!date) return false;

  return date.getTime() > new Date().getTime();
}

/**
 * Get the start of day for a date
 */
export function startOfDay(input: DateInput): Date | null {
  const date = normalizeDate(input);
  if (!date) return null;

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Get the end of day for a date
 */
export function endOfDay(input: DateInput): Date | null {
  const date = normalizeDate(input);
  if (!date) return null;

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Sort function for dates (newest first)
 */
export function sortByDateDesc(a: DateInput, b: DateInput): number {
  const dateA = normalizeDate(a);
  const dateB = normalizeDate(b);

  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;

  return dateB.getTime() - dateA.getTime();
}

/**
 * Sort function for dates (oldest first)
 */
export function sortByDateAsc(a: DateInput, b: DateInput): number {
  const dateA = normalizeDate(a);
  const dateB = normalizeDate(b);

  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;

  return dateA.getTime() - dateB.getTime();
}

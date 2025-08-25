import type { Timestamp } from 'firebase/firestore';

export type EventSubmissionStatus = 'pending' | 'approved' | 'rejected' | 'published';
export type EventType = 'game_night' | 'tournament' | 'social' | 'workshop' | 'other';

export interface EventSubmission {
  id?: string; // Firestore document ID

  // Event Details
  title: string;
  description: string;
  eventType: EventType;

  // Date & Time
  startDate: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  endDate: string; // YYYY-MM-DD format
  endTime: string; // HH:MM format

  // Location
  location: string;
  locationDetails?: string; // Additional location info

  // Capacity
  minPlayers?: number;
  maxPlayers?: number;
  estimatedAttendance?: number;

  // Game Info (if applicable)
  gameId?: number;
  gameName?: string;

  // Submission Info
  submittedBy: {
    userId: string;
    email: string;
    displayName?: string;
  };
  submittedAt: Timestamp | Date;

  // Approval Workflow
  status: EventSubmissionStatus;
  reviewedBy?: {
    userId: string;
    email: string;
    displayName?: string;
  };
  reviewedAt?: Timestamp | Date;
  reviewNotes?: string;

  // Calendar Integration
  calendarEventId?: string; // Google Calendar Event ID after publishing
  publicUrl?: string; // Public calendar link

  // Metadata
  tags?: string[];
  isRecurring?: boolean;
  recurringPattern?: string; // e.g., "weekly", "monthly"

  // Contact Info
  contactEmail?: string;
  contactPhone?: string;

  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface EventSubmissionFilter {
  status?: EventSubmissionStatus;
  eventType?: EventType;
  submittedBy?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface CreateEventSubmissionData {
  title: string;
  description: string;
  eventType: EventType;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  location: string;
  locationDetails?: string;
  minPlayers?: number;
  maxPlayers?: number;
  estimatedAttendance?: number;
  gameId?: number;
  gameName?: string;
  tags?: string[];
  isRecurring?: boolean;
  recurringPattern?: string;
  contactEmail?: string;
  contactPhone?: string;
}

import type { Timestamp } from 'firebase/firestore';

export interface FirebaseGame {
  id?: string; // Firestore document ID
  legacyId: number; // Original numeric ID for backward compatibility
  title: string;
  genre: string;
  numberOfPlayers: string;
  recommendedAge: string;
  playTime: string;
  components: string[];
  description: string;
  releaseYear?: number;
  image?: string;
  link?: string;
  // Firebase-specific fields
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  createdBy?: string; // User ID who created/imported the game
  approved: boolean;
  approvedBy?: string; // Admin user ID who approved
  approvedAt?: Timestamp;
  status: 'active' | 'inactive' | 'pending';
  tags?: string[]; // Additional search tags
  difficulty?: string; // Game difficulty level
  publisher?: string; // Game publisher
}

export class Game {
  id: string; // Now using Firebase document ID
  legacyId: number; // Keep original numeric ID for compatibility
  title: string;
  genre: string;
  numberOfPlayers: string;
  recommendedAge: string;
  playTime: string;
  components: string[];
  description: string;
  releaseYear?: number;
  image?: string;
  link?: string;
  // Firebase-specific fields
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  status: 'active' | 'inactive' | 'pending';
  tags?: string[];
  difficulty?: string;
  publisher?: string;

  constructor(
    id: string,
    legacyId: number,
    title: string,
    genre: string,
    numberOfPlayers: string,
    recommendedAge: string,
    playTime: string,
    components: string[],
    description: string,
    releaseYear?: number,
    image?: string,
    link?: string,
    createdAt?: Date,
    updatedAt?: Date,
    createdBy?: string,
    approved: boolean = true,
    approvedBy?: string,
    approvedAt?: Date,
    status: 'active' | 'inactive' | 'pending' = 'active',
    tags?: string[],
    difficulty?: string,
    publisher?: string,
  ) {
    this.id = id;
    this.legacyId = legacyId;
    this.title = title;
    this.genre = genre;
    this.numberOfPlayers = numberOfPlayers;
    this.recommendedAge = recommendedAge;
    this.playTime = playTime;
    this.components = components;
    this.description = description;
    if (releaseYear !== undefined) this.releaseYear = releaseYear;
    if (image !== undefined) this.image = image;
    if (link !== undefined) this.link = link;
    if (createdAt !== undefined) this.createdAt = createdAt;
    if (updatedAt !== undefined) this.updatedAt = updatedAt;
    if (createdBy !== undefined) this.createdBy = createdBy;
    this.approved = approved;
    if (approvedBy !== undefined) this.approvedBy = approvedBy;
    if (approvedAt !== undefined) this.approvedAt = approvedAt;
    this.status = status;
    if (tags !== undefined) this.tags = tags;
    if (difficulty !== undefined) this.difficulty = difficulty;
    if (publisher !== undefined) this.publisher = publisher;
  }

  get url(): string {
    const urlFriendlyTitle = this.title;
    return `/${this.legacyId}/${urlFriendlyTitle}`;
  }

  // Legacy support - create from old JSON structure
  static fromJSON(json: {
    id?: number;
    title: string;
    genre: string;
    numberOfPlayers: string;
    recommendedAge: string;
    playTime: string;
    components: string[];
    description: string;
    releaseYear?: number;
    image?: string;
    link?: string;
  }): Game {
    return new Game(
      json.id?.toString() || Date.now().toString(), // Convert to string ID
      json.id || 0, // Keep legacy ID
      json.title,
      json.genre,
      json.numberOfPlayers,
      json.recommendedAge,
      json.playTime,
      json.components,
      json.description,
      json.releaseYear,
      json.image,
      json.link,
    );
  }

  // Helper to convert Firebase Timestamp or Date objects to Date
  private static convertTimestamp(
    timestamp: Timestamp | Date | string | number | undefined,
  ): Date | undefined {
    if (!timestamp) return undefined;
    if (timestamp instanceof Date) return timestamp;
    if (
      typeof timestamp === 'object' &&
      'toDate' in timestamp &&
      typeof timestamp.toDate === 'function'
    ) {
      return timestamp.toDate();
    }
    if (typeof timestamp === 'string' || typeof timestamp === 'number') return new Date(timestamp);
    return undefined;
  }

  // Create from Firebase data
  static fromFirebase(id: string, data: FirebaseGame): Game {
    return new Game(
      id,
      data.legacyId,
      data.title,
      data.genre,
      data.numberOfPlayers,
      data.recommendedAge,
      data.playTime,
      data.components,
      data.description,
      data.releaseYear,
      data.image,
      data.link,
      Game.convertTimestamp(data.createdAt),
      Game.convertTimestamp(data.updatedAt),
      data.createdBy,
      data.approved,
      data.approvedBy,
      Game.convertTimestamp(data.approvedAt),
      data.status,
      data.tags,
      data.difficulty,
      data.publisher,
    );
  }

  // Convert to Firebase format
  toFirebase(): FirebaseGame {
    return {
      legacyId: this.legacyId,
      title: this.title,
      genre: this.genre,
      numberOfPlayers: this.numberOfPlayers,
      recommendedAge: this.recommendedAge,
      playTime: this.playTime,
      components: this.components,
      description: this.description,
      ...(this.releaseYear !== undefined && { releaseYear: this.releaseYear }),
      ...(this.image !== undefined && { image: this.image }),
      ...(this.link !== undefined && { link: this.link }),
      approved: this.approved,
      ...(this.approvedBy !== undefined && { approvedBy: this.approvedBy }),
      status: this.status,
      ...(this.tags !== undefined && { tags: this.tags }),
      ...(this.difficulty !== undefined && { difficulty: this.difficulty }),
      ...(this.publisher !== undefined && { publisher: this.publisher }),
      // Timestamps will be handled by Firebase
    };
  }
}

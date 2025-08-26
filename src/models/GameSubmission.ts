import type { Timestamp } from 'firebase/firestore';

export interface GameSubmissionData {
  title: string;
  genre: string;
  numberOfPlayers: string;
  recommendedAge: string;
  playTime: string;
  components: string[];
  description: string;
  releaseYear?: number;
  image?: string; // Could be a URL or file upload reference
  link?: string;
  tags?: string[];
  difficulty?: string;
  publisher?: string;
}

export interface FirebaseGameSubmission extends GameSubmissionData {
  id?: string;
  submittedBy: {
    userId: string;
    userName: string;
    userEmail: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string; // Admin user ID
  reviewNotes?: string; // Admin notes about approval/rejection
  gameId?: string; // ID of the created game if approved
}

export class GameSubmission {
  id: string;
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
  tags?: string[];
  difficulty?: string;
  publisher?: string;
  submittedBy: {
    userId: string;
    userName: string;
    userEmail: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
  gameId?: string;

  constructor(
    id: string,
    data: GameSubmissionData,
    submittedBy: { userId: string; userName: string; userEmail: string },
    status: 'pending' | 'approved' | 'rejected' = 'pending',
    submittedAt: Date,
    reviewedAt?: Date,
    reviewedBy?: string,
    reviewNotes?: string,
    gameId?: string,
  ) {
    this.id = id;
    this.title = data.title;
    this.genre = data.genre;
    this.numberOfPlayers = data.numberOfPlayers;
    this.recommendedAge = data.recommendedAge;
    this.playTime = data.playTime;
    this.components = data.components;
    this.description = data.description;
    if (data.releaseYear !== undefined) this.releaseYear = data.releaseYear;
    if (data.image !== undefined) this.image = data.image;
    if (data.link !== undefined) this.link = data.link;
    if (data.tags !== undefined) this.tags = data.tags;
    if (data.difficulty !== undefined) this.difficulty = data.difficulty;
    if (data.publisher !== undefined) this.publisher = data.publisher;
    this.submittedBy = submittedBy;
    this.status = status;
    this.submittedAt = submittedAt;
    if (reviewedAt !== undefined) this.reviewedAt = reviewedAt;
    if (reviewedBy !== undefined) this.reviewedBy = reviewedBy;
    if (reviewNotes !== undefined) this.reviewNotes = reviewNotes;
    if (gameId !== undefined) this.gameId = gameId;
  }

  static fromFirebase(id: string, data: FirebaseGameSubmission): GameSubmission {
    return new GameSubmission(
      id,
      data,
      data.submittedBy,
      data.status,
      data.submittedAt.toDate(),
      data.reviewedAt?.toDate(),
      data.reviewedBy,
      data.reviewNotes,
      data.gameId,
    );
  }

  toFirebase(): FirebaseGameSubmission {
    return {
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
      ...(this.tags !== undefined && { tags: this.tags }),
      ...(this.difficulty !== undefined && { difficulty: this.difficulty }),
      ...(this.publisher !== undefined && { publisher: this.publisher }),
      submittedBy: this.submittedBy,
      status: this.status,
      submittedAt: this.submittedAt as unknown as Timestamp, // Firebase will handle timestamp conversion
      ...(this.reviewedAt && { reviewedAt: this.reviewedAt as unknown as Timestamp }),
      ...(this.reviewedBy && { reviewedBy: this.reviewedBy }),
      ...(this.reviewNotes && { reviewNotes: this.reviewNotes }),
      ...(this.gameId && { gameId: this.gameId }),
    };
  }

  // Convert to game data for creating approved game
  toGameData(): GameSubmissionData {
    const data: GameSubmissionData = {
      title: this.title,
      genre: this.genre,
      numberOfPlayers: this.numberOfPlayers,
      recommendedAge: this.recommendedAge,
      playTime: this.playTime,
      components: this.components,
      description: this.description,
    };

    if (this.releaseYear !== undefined) data.releaseYear = this.releaseYear;
    if (this.image !== undefined) data.image = this.image;
    if (this.link !== undefined) data.link = this.link;
    if (this.tags !== undefined) data.tags = this.tags;
    if (this.difficulty !== undefined) data.difficulty = this.difficulty;
    if (this.publisher !== undefined) data.publisher = this.publisher;

    return data;
  }
}

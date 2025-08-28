export class Player {
  id: number;
  name: string;
  email: string;
  avatar?: string | undefined;
  joinDate: Date; // Changed from string to Date
  bio?: string | undefined;
  preferences?: {
    favoriteGames?: number[];
    preferredGenres?: string[];
  };
  // Firebase fields (optional for backward compatibility)
  firebaseId?: string | undefined;
  role?: string[] | undefined;
  status?: 'active' | 'blocked' | 'pending';

  constructor(playerData: Partial<Omit<Player, 'joinDate'> & { joinDate?: string | Date }>) {
    this.id = playerData.id || 0;
    this.name = playerData.name || '';
    this.email = playerData.email || '';
    this.avatar = playerData.avatar || undefined;

    // Convert joinDate to a Date object
    if (playerData.joinDate) {
      // Handle both string dates and Date objects
      this.joinDate =
        playerData.joinDate instanceof Date ? playerData.joinDate : new Date(playerData.joinDate);
    } else {
      // Default to today
      this.joinDate = new Date();
    }

    this.bio = playerData.bio || undefined;
    this.preferences = playerData.preferences || {};

    // Optional Firebase fields
    this.firebaseId = playerData.firebaseId || undefined;
    this.role = playerData.role || undefined;
    this.status = playerData.status || 'active';
  }

  // Helper methods
  getInitials(): string {
    return this.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  // Format join date for display
  getFormattedJoinDate(): string {
    return this.joinDate.toLocaleDateString();
  }

  // Check if user has admin privileges
  isAdmin(): boolean {
    return this.role?.includes('admin') || false;
  }

  // Check if user is active
  isActive(): boolean {
    return this.status === 'active';
  }

  // Define type for JSON player data
  static fromJSON(
    playersData: Array<Partial<Omit<Player, 'joinDate'> & { joinDate?: string | Date }>>,
  ): Player[] {
    // The constructor will handle proper Date conversion
    return playersData.map((playerData) => new Player(playerData));
  }
}

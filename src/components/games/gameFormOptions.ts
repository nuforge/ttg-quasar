/**
 * Shared options for game form components
 * Used by GameSubmissionDialog, GameFormDialog, and admin components
 */

export const GAME_GENRES = [
  'Strategy',
  'Party',
  'Family',
  'Card Game',
  'Board Game',
  'Cooperative',
  'Competitive',
  'Role-Playing',
  'Abstract',
  'Puzzle',
  'Trivia',
  'Bluffing',
  'Adventure',
  'Fantasy',
  'Sci-Fi',
  'Historical',
  'Economic',
  'War',
  'Racing',
  'Sports',
  'Educational',
  "Children's",
] as const;

export const GAME_DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const;

export const GAME_COMPONENTS = [
  'Board',
  'Cards',
  'Dice',
  'Pieces',
  'Tokens',
  'Tiles',
  'Miniatures',
  'Meeples',
  'Cubes',
  'Counters',
  'Timer',
  'Spinner',
  'Rulebook',
  'Player Boards',
  'Score Pad',
  'Money',
  'Resource Tokens',
  'Markers',
  'Standees',
  'App Required',
] as const;

export const GAME_TAGS = [
  'family-friendly',
  'party-game',
  'strategy',
  'cooperative',
  'competitive',
  'quick-play',
  'long-game',
  'two-player',
  'multiplayer',
  'solo-play',
  'deck-building',
  'worker-placement',
  'area-control',
  'tile-laying',
  'roll-and-move',
  'hidden-role',
  'social-deduction',
  'engine-building',
  'resource-management',
  'negotiation',
  'auction',
  'memory',
  'dexterity',
  'real-time',
  'legacy',
] as const;

// Type exports for type-safe usage
export type GameGenre = (typeof GAME_GENRES)[number];
export type GameDifficulty = (typeof GAME_DIFFICULTIES)[number];
export type GameComponent = (typeof GAME_COMPONENTS)[number];
export type GameTag = (typeof GAME_TAGS)[number];


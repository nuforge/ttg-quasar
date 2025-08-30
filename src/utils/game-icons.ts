// src/utils/game-icons.ts
type IconType = 'mdi' | 'game';

export type IconMapping = {
  [key: string]: {
    icon: string;
    type: IconType;
  };
};

type Genre =
  | 'RPG'
  | 'CCG'
  | 'Strategy'
  | 'Coop'
  | 'Party'
  | 'Classic Strategy'
  | 'Cooperative Strategy'
  | 'Family Strategy'
  | 'Role-Playing Game'
  | 'Tile Placement'
  | 'Collectible Card Game'
  | 'Card Game'
  | 'Abstract Strategy'
  | 'Board Game'
  | 'Journey Game'
  | 'Social Deduction'
  | 'Dice Game'
  | 'Cooperative Miniatures'
  | 'Deck Building'
  | 'Drafting Card Game'
  | 'Party Game'
  | 'Party Card Game'
  | 'Bluffing'
  | 'Word Game'
  | 'Deduction Card Game'
  | 'Storytelling Card Game'
  | 'Mystery'
  | 'Party Word Game'
  | 'Word Card Game'
  | 'Creative Card Game'
  | 'Pattern Matching'
  | 'Cooperative Adventure'
  | 'Cooperative Card Game'
  | 'Puzzle';

type Mechanic = 'cards' | 'dice' | 'pawns' | 'timer';
type AgeRange = '6+' | '7+' | '8+' | '10+' | '12+' | '13+' | '14+' | '15+' | '16+' | '18+';

export const IconRules = {
  players: {
    '1': { icon: 'mdi-account', type: 'mdi' },
    '1+': { icon: 'mdi-account-plus', type: 'mdi' },
    '2': { icon: 'mdi-account-multiple', type: 'mdi' },
    '2+': { icon: 'mdi-account-multiple-outline', type: 'mdi' },
    '2-4': { icon: 'mdi-account-multiple', type: 'mdi' },
    '2-5': { icon: 'mdi-account-multiple', type: 'mdi' },
    '2-6': { icon: 'mdi-account-multiple', type: 'mdi' },
    '2-8': { icon: 'mdi-account-multiple', type: 'mdi' },
    '3': { icon: 'mdi-account-group', type: 'mdi' },
    '3+': { icon: 'mdi-account-group-outline', type: 'mdi' },
    '3-4': { icon: 'mdi-account-group', type: 'mdi' },
    '3-5': { icon: 'mdi-account-group', type: 'mdi' },
    '3-6': { icon: 'mdi-account-group', type: 'mdi' },
    '3-8': { icon: 'mdi-account-group', type: 'mdi' },
    '3-10': { icon: 'mdi-account-group', type: 'mdi' },
    '4': { icon: 'mdi-account-group', type: 'mdi' },
    '4+': { icon: 'mdi-account-group-outline', type: 'mdi' },
    '4-12': { icon: 'mdi-account-group', type: 'mdi' },
    '5+': { icon: 'mdi-account-group-outline', type: 'mdi' },
    '5-10': { icon: 'mdi-account-group', type: 'mdi' },
    '6+': { icon: 'mdi-account-group-outline', type: 'mdi' },
    '1-5': { icon: 'mdi-account-multiple', type: 'mdi' },
    '1-6': { icon: 'mdi-account-multiple', type: 'mdi' },
  } as IconMapping,

  genres: {
    // RPG & Adventure
    RPG: { icon: 'mdi-sword', type: 'mdi' },
    'Role-Playing Game': { icon: 'mdi-drama-masks', type: 'mdi' },

    // Card Games
    CCG: { icon: 'mdi-cards', type: 'mdi' },
    'Collectible Card Game': { icon: 'mdi-cards-variant', type: 'mdi' },
    'Card Game': { icon: 'mdi-cards', type: 'mdi' },
    'Deck Building': { icon: 'mdi-cards-outline', type: 'mdi' },
    'Drafting Card Game': { icon: 'mdi-card-multiple', type: 'mdi' },
    'Party Card Game': { icon: 'mdi-cards-playing-outline', type: 'mdi' },
    'Deduction Card Game': { icon: 'mdi-card-search', type: 'mdi' },
    'Storytelling Card Game': { icon: 'mdi-card-text', type: 'mdi' },
    'Word Card Game': { icon: 'mdi-card-text-outline', type: 'mdi' },
    'Creative Card Game': { icon: 'mdi-lightbulb-on', type: 'mdi' },
    'Cooperative Card Game': { icon: 'mdi-handshake', type: 'mdi' },

    // Strategy Games
    Strategy: { icon: 'mdi-chess-knight', type: 'mdi' },
    'Classic Strategy': { icon: 'mdi-chess-king', type: 'mdi' },
    'Cooperative Strategy': { icon: 'mdi-handshake', type: 'mdi' },
    'Family Strategy': { icon: 'mdi-home-heart', type: 'mdi' },
    'Abstract Strategy': { icon: 'mdi-pentagon', type: 'mdi' },

    // Board Games
    'Board Game': { icon: 'mdi-checkerboard', type: 'mdi' },
    'Tile Placement': { icon: 'mdi-shape-square-plus', type: 'mdi' },
    'Journey Game': { icon: 'mdi-map-marker-path', type: 'mdi' },
    'Cooperative Adventure': { icon: 'mdi-compass-outline', type: 'mdi' },
    'Cooperative Miniatures': { icon: 'mdi-human-handsup', type: 'mdi' },

    // Social & Party Games
    Coop: { icon: 'mdi-account-group', type: 'mdi' },
    Party: { icon: 'mdi-party-popper', type: 'mdi' },
    'Party Game': { icon: 'mdi-party-popper', type: 'mdi' },
    'Social Deduction': { icon: 'mdi-account-question', type: 'mdi' },
    Bluffing: { icon: 'mdi-eye-off', type: 'mdi' },
    Mystery: { icon: 'mdi-magnify', type: 'mdi' },

    // Word & Pattern Games
    'Word Game': { icon: 'mdi-alphabetical-variant', type: 'mdi' },
    'Party Word Game': { icon: 'mdi-comment-text', type: 'mdi' },
    'Pattern Matching': { icon: 'mdi-puzzle', type: 'mdi' },
    Puzzle: { icon: 'mdi-puzzle-outline', type: 'mdi' },

    // Dice Games
    'Dice Game': { icon: 'mdi-dice-multiple', type: 'mdi' },
  } as IconMapping,

  mechanics: {
    cards: { icon: 'mdi-cards', type: 'mdi' },
    dice: { icon: 'mdi-dice-multiple', type: 'mdi' },
    pawns: { icon: 'mdi-chess-pawn', type: 'mdi' },
    timer: { icon: 'mdi-timer-sand', type: 'mdi' },
  } as IconMapping,

  age: {
    '3+': { icon: 'mdi-numeric-3-box', type: 'mdi' },
    '6+': { icon: 'mdi-numeric-6-box', type: 'mdi' },
    '7+': { icon: 'mdi-numeric-7-box', type: 'mdi' },
    '8+': { icon: 'mdi-numeric-8-box', type: 'mdi' },
    '10+': { icon: 'mdi-numeric-1-box', type: 'mdi' },
    '12+': { icon: 'mdi-numeric-1-box', type: 'mdi' },
    '13+': { icon: 'mdi-numeric-1-box', type: 'mdi' },
    '14+': { icon: 'mdi-numeric-1-box', type: 'mdi' },
    '15+': { icon: 'mdi-numeric-1-box', type: 'mdi' },
    '16+': { icon: 'mdi-numeric-1-box', type: 'mdi' },
    '18+': { icon: 'mdi-alert-circle', type: 'mdi' },
  } as IconMapping,

  components: {
    // Standard components
    Cards: { icon: 'mdi-cards', type: 'mdi' },
    Dice: { icon: 'mdi-dice-multiple', type: 'mdi' },
    Board: { icon: 'mdi-checkerboard', type: 'mdi' },
    Pieces: { icon: 'mdi-chess-pawn', type: 'mdi' },
    Books: { icon: 'mdi-book-open-page-variant', type: 'mdi' },
    Tiles: { icon: 'mdi-grid', type: 'mdi' },
    Miniatures: { icon: 'mdi-human-handsdown', type: 'mdi' },
    Clay: { icon: 'mdi-pottery', type: 'mdi' },

    // Additional variations that might appear
    Card: { icon: 'mdi-cards', type: 'mdi' },
    Die: { icon: 'mdi-dice-1', type: 'mdi' },
    Piece: { icon: 'mdi-chess-pawn', type: 'mdi' },
    Book: { icon: 'mdi-book-open-page-variant', type: 'mdi' },
    Tile: { icon: 'mdi-grid', type: 'mdi' },
    Miniature: { icon: 'mdi-human-handsdown', type: 'mdi' },
    Token: { icon: 'mdi-circle-slice-8', type: 'mdi' },
    Tokens: { icon: 'mdi-circle-slice-8', type: 'mdi' },
    Marker: { icon: 'mdi-map-marker', type: 'mdi' },
    Markers: { icon: 'mdi-map-marker', type: 'mdi' },
    Meeple: { icon: 'mdi-human-handsup', type: 'mdi' },
    Meeples: { icon: 'mdi-human-handsup', type: 'mdi' },
  } as IconMapping,
};

// Improved fallback logic with pattern matching
export function getGameIcon(
  category: keyof typeof IconRules,
  value: string,
): { icon: string; type: IconType } {
  // Handle null/undefined inputs
  if (!category || !value) {
    return { icon: 'mdi-help-circle', type: 'mdi' };
  }

  const rules = IconRules[category];

  // Handle unknown categories
  if (!rules) {
    return { icon: 'mdi-help-circle', type: 'mdi' };
  }

  // Direct match first
  const directMatch = (rules as Record<string, { icon: string; type: IconType }>)[value];
  if (directMatch) {
    return directMatch;
  }

  // Fallback logic for better coverage
  const lowerValue = value?.toLowerCase() || '';

  if (category === 'genres') {
    // Strategy fallbacks
    if (lowerValue.includes('strategy')) {
      return { icon: 'mdi-chess-knight', type: 'mdi' };
    }
    // Card game fallbacks
    if (lowerValue.includes('card')) {
      return { icon: 'mdi-cards', type: 'mdi' };
    }
    // Cooperative fallbacks
    if (lowerValue.includes('cooperative') || lowerValue.includes('coop')) {
      return { icon: 'mdi-handshake', type: 'mdi' };
    }
    // Party fallbacks
    if (lowerValue.includes('party')) {
      return { icon: 'mdi-party-popper', type: 'mdi' };
    }
    // RPG fallbacks
    if (
      lowerValue.includes('rpg') ||
      lowerValue.includes('role-playing') ||
      lowerValue.includes('roleplaying')
    ) {
      return { icon: 'mdi-drama-masks', type: 'mdi' };
    }
    // Word game fallbacks
    if (lowerValue.includes('word')) {
      return { icon: 'mdi-alphabetical-variant', type: 'mdi' };
    }
    // Dice game fallbacks
    if (lowerValue.includes('dice')) {
      return { icon: 'mdi-dice-multiple', type: 'mdi' };
    }
    // Board game fallbacks
    if (lowerValue.includes('board')) {
      return { icon: 'mdi-checkerboard', type: 'mdi' };
    }
  }

  if (category === 'components') {
    // Component fallbacks based on partial matches
    if (lowerValue.includes('card')) {
      return { icon: 'mdi-cards', type: 'mdi' };
    }
    if (lowerValue.includes('dice') || lowerValue.includes('die')) {
      return { icon: 'mdi-dice-multiple', type: 'mdi' };
    }
    if (lowerValue.includes('board')) {
      return { icon: 'mdi-checkerboard', type: 'mdi' };
    }
    if (
      lowerValue.includes('piece') ||
      lowerValue.includes('pawn') ||
      lowerValue.includes('figure')
    ) {
      return { icon: 'mdi-chess-pawn', type: 'mdi' };
    }
    if (
      lowerValue.includes('book') ||
      lowerValue.includes('manual') ||
      lowerValue.includes('rulebook')
    ) {
      return { icon: 'mdi-book-open-page-variant', type: 'mdi' };
    }
    if (lowerValue.includes('tile')) {
      return { icon: 'mdi-grid', type: 'mdi' };
    }
    if (
      lowerValue.includes('miniature') ||
      lowerValue.includes('mini') ||
      lowerValue.includes('figure')
    ) {
      return { icon: 'mdi-human-handsdown', type: 'mdi' };
    }
    if (lowerValue.includes('token') || lowerValue.includes('counter')) {
      return { icon: 'mdi-circle-slice-8', type: 'mdi' };
    }
    if (lowerValue.includes('meeple')) {
      return { icon: 'mdi-human-handsup', type: 'mdi' };
    }
  }

  if (category === 'players') {
    // Player count fallbacks - extract numbers for better matching
    const hasPlus = value.includes('+');
    const numbers = value.match(/\d+/g)?.map(Number) || [];

    if (numbers.length === 0) {
      return { icon: 'mdi-account-group-outline', type: 'mdi' };
    }

    const maxPlayers = Math.max(...numbers);

    if (hasPlus || maxPlayers >= 6) {
      return { icon: 'mdi-account-group-outline', type: 'mdi' };
    } else if (maxPlayers >= 3) {
      return { icon: 'mdi-account-group', type: 'mdi' };
    } else if (maxPlayers >= 2) {
      return { icon: 'mdi-account-multiple', type: 'mdi' };
    } else {
      return { icon: 'mdi-account', type: 'mdi' };
    }
  }

  if (category === 'age') {
    // Age fallbacks
    const ageMatch = value.match(/(\d+)\+/);
    if (ageMatch && ageMatch[1]) {
      const age = parseInt(ageMatch[1]);
      if (age >= 18) {
        return { icon: 'mdi-alert-circle', type: 'mdi' };
      } else if (age >= 12) {
        return { icon: 'mdi-numeric-1-box', type: 'mdi' };
      } else if (age >= 8) {
        return { icon: 'mdi-numeric-8-box', type: 'mdi' };
      } else {
        return { icon: 'mdi-numeric-6-box', type: 'mdi' };
      }
    }
  }

  // Default fallback icons by category
  const categoryDefaults: Record<string, { icon: string; type: IconType }> = {
    players: { icon: 'mdi-account-group-outline', type: 'mdi' },
    genres: { icon: 'mdi-gamepad-variant', type: 'mdi' },
    components: { icon: 'mdi-cube', type: 'mdi' },
    age: { icon: 'mdi-numeric-1-box', type: 'mdi' },
    mechanics: { icon: 'mdi-cog', type: 'mdi' },
  };

  return categoryDefaults[category] || { icon: 'mdi-gamepad-variant', type: 'mdi' };
}

export function getCategoryForComponent(component: string): string | null {
  const lowerComponent = component.toLowerCase();
  const componentMap: Record<string, string> = {
    card: 'Cards',
    dice: 'Dice',
    board: 'Board',
    piece: 'Pieces',
    pawn: 'Pieces',
    miniature: 'Pieces',
    token: 'Pieces',
    meeple: 'Pieces',
    book: 'Books',
    rulebook: 'Books',
    tile: 'Tiles',
  };

  for (const [key, value] of Object.entries(componentMap)) {
    if (lowerComponent.includes(key.toLowerCase())) {
      return value;
    }
  }
  return null;
}

// Utility type for component props
export type GameIconName = Genre | Mechanic | AgeRange;

// src/utils/game-icons.ts
type IconType = 'mdi' | 'game';

export type IconMapping = {
  [key: string]: {
    icon: string;
    type: IconType;
  };
};

type PlayerRange = '1' | '2' | '3-5' | '6+';
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
  | 'Collectible Card Game';
type Mechanic = 'cards' | 'dice' | 'pawns' | 'timer';
type AgeRange = '6+' | '7+' | '8+' | '10+' | '12+' | '13+';

export const IconRules = {
  players: {
    '1': { icon: 'mdi-account', type: 'mdi' },
    '2': { icon: 'mdi-account-multiple-outline', type: 'mdi' },
    '2-4': { icon: 'mdi-account-multiple', type: 'mdi' },
    '2-5': { icon: 'mdi-account-group-outline', type: 'mdi' },
    '3+': { icon: 'mdi-account-group', type: 'mdi' },
    '3-4': { icon: 'mdi-account-group', type: 'mdi' },
    '3-5': { icon: 'mdi-account-group', type: 'mdi' },
    '6+': { icon: 'mdi-account-supervisor', type: 'mdi' },
  } as IconMapping,

  genres: {
    RPG: { icon: 'mdi-sword', type: 'mdi' },
    'Role-Playing Game': { icon: 'mdi-sword', type: 'mdi' },
    CCG: { icon: 'mdi-cards', type: 'mdi' },
    'Collectible Card Game': { icon: 'mdi-cards', type: 'mdi' },
    Strategy: { icon: 'mdi-chess-knight', type: 'mdi' },
    'Classic Strategy': { icon: 'mdi-chess-king', type: 'mdi' },
    'Cooperative Strategy': { icon: 'mdi-handshake', type: 'mdi' },
    'Family Strategy': { icon: 'mdi-home-variant', type: 'mdi' },
    Coop: { icon: 'mdi-account-group', type: 'mdi' },
    Party: { icon: 'mdi-party-popper', type: 'mdi' },
    'Tile Placement': { icon: 'mdi-shape-square-plus', type: 'mdi' },
  } as IconMapping,

  mechanics: {
    cards: { icon: 'mdi-cards', type: 'mdi' },
    dice: { icon: 'mdi-dice-multiple', type: 'mdi' },
    pawns: { icon: 'mdi-chess-pawn', type: 'mdi' },
    timer: { icon: 'mdi-timer-sand', type: 'mdi' },
  } as IconMapping,

  age: {
    '6+': { icon: 'mdi-numeric-6-plus', type: 'mdi' },
    '7+': { icon: 'mdi-numeric-7-plus', type: 'mdi' },
    '8+': { icon: 'mdi-numeric-8-plus', type: 'mdi' },
    '10+': { icon: 'mdi-numeric-10-plus', type: 'mdi' },
    '12+': { icon: 'mdi-numeric-10-plus', type: 'mdi' },
    '13+': { icon: 'mdi-numeric-10-plus', type: 'mdi' },
  } as IconMapping,

  components: {
    Cards: { icon: 'mdi-cards', type: 'mdi' },
    Dice: { icon: 'mdi-dice-multiple', type: 'mdi' },
    Board: { icon: 'mdi-tablet', type: 'mdi' },
    'Game Board': { icon: 'mdi-tablet', type: 'mdi' },
    Tiles: { icon: 'mdi-shape-square-plus', type: 'mdi' },
    'Land Tiles': { icon: 'mdi-shape-square-plus', type: 'mdi' },
    Miniatures: { icon: 'mdi-chess-pawn', type: 'mdi' },
    Tokens: { icon: 'mdi-coin', type: 'mdi' },
    Chessboard: { icon: 'mdi-chess-board', type: 'mdi' },
    Pieces: { icon: 'mdi-chess-queen', type: 'mdi' },
    Pawns: { icon: 'mdi-chess-pawn', type: 'mdi' },
    Meeples: { icon: 'mdi-human', type: 'mdi' },
    Rulebook: { icon: 'mdi-book-open-variant', type: 'mdi' },
    'Core Rulebook': { icon: 'mdi-book-open-variant', type: 'mdi' },
    Rulebooks: { icon: 'mdi-book-open-variant', type: 'mdi' },
  } as IconMapping,
};

export function getGameIcon(
  category: keyof typeof IconRules,
  value: string,
): { icon: string; type: IconType } {
  const rules = IconRules[category];
  const result = (rules as Record<string, { icon: string; type: IconType }>)[value];

  return result || { icon: 'mdi-help-circle', type: 'mdi' };
}

export function getCategoryForComponent(component: string): string | null {
  const lowerComponent = component.toLowerCase();
  for (const [key] of Object.entries(IconRules.components)) {
    if (lowerComponent.includes(key.toLowerCase())) {
      return key;
    }
  }
  return null;
}

// Utility type for component props
export type GameIconName = PlayerRange | Genre | Mechanic | AgeRange;

// Component implementation
import { defineComponent, h } from 'vue';
import type { PropType } from 'vue';

export const GameIcon = defineComponent({
  props: {
    name: {
      type: String as PropType<GameIconName>,
      required: true,
      validator: (value: string) =>
        Object.keys(IconRules.players).includes(value) ||
        Object.keys(IconRules.genres).includes(value) ||
        Object.keys(IconRules.mechanics).includes(value) ||
        Object.keys(IconRules.age).includes(value),
    },
    size: {
      type: String as PropType<'sm' | 'md' | 'lg'>,
      default: 'md',
    },
  },

  setup(props) {
    const getIcon = () => {
      let category: keyof typeof IconRules = 'mechanics';
      if (props.name in IconRules.players) category = 'players';
      if (props.name in IconRules.genres) category = 'genres';
      if (props.name in IconRules.age) category = 'age';

      return getGameIcon(category, props.name);
    };

    const icon = getIcon();

    return {
      icon,
      sizeClass: `size-${props.size}`,
    };
  },

  render() {
    if (this.icon.type === 'mdi') {
      return h('q-icon', {
        name: this.icon.icon,
        class: ['game-icon', this.sizeClass],
      });
    } else {
      return h('img', {
        src: `/game-icons/${this.icon.icon}.svg`,
        class: ['game-icon', this.sizeClass],
        alt: this.icon.icon,
      });
    }
  },
});

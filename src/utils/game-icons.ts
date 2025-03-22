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
  | 'Collectible Card Game';
type Mechanic = 'cards' | 'dice' | 'pawns' | 'timer';
type AgeRange = '6+' | '7+' | '8+' | '10+' | '12+' | '13+';

export const IconRules = {
  players: {
    '1': { icon: 'mdi-account', type: 'mdi' },
    '2': { icon: 'mdi-account-multiple', type: 'mdi' },
    '2+': { icon: 'mdi-account-multiple-outline', type: 'mdi' },
    '2-4': { icon: 'mdi-account-multiple', type: 'mdi' },
    '2-5': { icon: 'mdi-account-multiple', type: 'mdi' },
    '3': { icon: 'mdi-account-group', type: 'mdi' },
    '3+': { icon: 'mdi-account-group-outline', type: 'mdi' },
    '3-4': { icon: 'mdi-account-group', type: 'mdi' },
    '3-5': { icon: 'mdi-account-group', type: 'mdi' },
    '6+': { icon: 'mdi-account-group-outline', type: 'mdi' },
  } as IconMapping,

  genres: {
    RPG: { icon: 'mdi-sword', type: 'mdi' },
    'Role-Playing Game': { icon: 'mdi-drama-masks', type: 'mdi' },
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
    '3+': { icon: 'mdi-numeric-3', type: 'mdi' },
    '6+': { icon: 'mdi-numeric-6', type: 'mdi' },
    '8+': { icon: 'mdi-numeric-8', type: 'mdi' },
    '10+': { icon: 'mdi-numeric-9-plus', type: 'mdi' },
    '12+': { icon: 'mdi-numeric-9-plus', type: 'mdi' },
    '18+': { icon: 'mdi-numeric-9-plus', type: 'mdi' },
  } as IconMapping,

  components: {
    Cards: { icon: 'mdi-cards', type: 'mdi' },
    Dice: { icon: 'mdi-dice-multiple', type: 'mdi' },
    Board: { icon: 'mdi-checkerboard', type: 'mdi' },
    Pieces: { icon: 'mdi-chess-pawn', type: 'mdi' },
    Books: { icon: 'mdi-book-open-page-variant', type: 'mdi' },
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

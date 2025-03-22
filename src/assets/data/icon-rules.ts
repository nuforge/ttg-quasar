// src/utils/game-icons.js
export const ICON_RULES = {
  players: {
    exact: {
      1: 'mdi-account',
      2: 'mdi-account-duo',
      3: 'mdi-account-multiple',
      4: 'mdi-account-multiple',
      5: 'mdi-account-multiple',
    },
    range: {
      '2-4': 'mdi-account-group',
      '5+': 'mdi-account-supervisor',
    },
  },
  genres: {
    RPG: 'mdi-sword-cross',
    CCG: 'mdi-cards',
    Strategy: 'mdi-chess-queen',
    Coop: 'mdi-account-group',
  },
  mechanics: {
    cards: 'mdi-cards',
    dice: 'mdi-dice-multiple',
    pawns: 'mdi-chess-pawn',
    timer: 'mdi-timer-sand',
  },
};

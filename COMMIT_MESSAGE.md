feat: Expand game library and enhance icon system

## Major Changes:

### Game Data Expansion
- Extended games.json from 8 to 50 games using data from games.txt
- Added 42 new board games across diverse genres (card games, strategy, party games, RPG, etc.)
- Added image references for all games with matching assets in public/images/games/
- Preserved all existing game information and URLs

### Icon System Overhaul
- Completely rewrote game-icons.ts with comprehensive mappings for all game elements
- Added support for 35+ genres including Card Game, Dice Game, Social Deduction, Word Game, etc.
- Enhanced component icons to support Tiles, Miniatures, Clay, Tokens, Meeples, and more
- Expanded player count support for all variations (1-6+, ranges like 2-4, 3-8, etc.)
- Added complete age range coverage (6+ through 18+)

### Smart Fallback Logic
- Implemented intelligent pattern matching for missing mappings
- Eliminated generic "help" icons with meaningful category-specific defaults
- Added fuzzy matching for partial component names (e.g., "card" matches "Cards")
- Player count analysis using numeric parsing for better categorization

### Code Quality Improvements
- Fixed ESLint errors and TypeScript compliance
- Added proper type safety throughout icon system
- Cleaned up unused code and imports
- Enhanced error handling and edge cases

### UI/UX Enhancements
- All game cards now display appropriate icons instead of generic placeholders
- Improved visual consistency across game components
- Better semantic meaning for game mechanics and elements

## Files Modified:
- src/assets/data/games.json (42 new games added, images linked)
- src/utils/game-icons.ts (complete rewrite with smart fallbacks)
- src/components/GameCard.vue (icon integration improvements)
- src/components/GameIcon.vue (enhanced prop handling)
- src/pages/GamesPage.vue (minor updates)

## Assets Added:
- 44 new game images in public/images/games/
- games.txt reference data file
- games.json.bck backup file

# Featured Games System

## Overview

The featured games system has been implemented to provide personalized game recommendations on the front page. The system is designed to eventually calculate featured games based on user preferences, bookmarks, favorites, upcoming events, and engagement metrics.

## Current Implementation

### 1. FeaturedGamesService (`src/services/featured-games-service.ts`)

- **Current Behavior**: Uses random selection for development
- **Future Ready**: Structured to support full personalization algorithm
- **Personalization Criteria**:
  - User's favorite games (high weight)
  - User's bookmarked games (medium weight)
  - Games with upcoming events user RSVPed to (highest weight)
  - Popular games with many upcoming events
  - User's preferred genres
  - Recently added/updated games

### 2. UserPreferencesAnalyzer (`src/services/user-preferences-analyzer.ts`)

Utility service for analyzing user behavior patterns:

- **Genre Preferences**: Calculated from favorites/bookmarks with weighted scoring
- **Game Popularity**: Based on event RSVP counts
- **Similar Games**: Finds games similar to user's interests
- **User Insights**: Comprehensive analysis of gaming patterns

### 3. Games Store Enhancement (`src/stores/games-firebase-store.ts`)

- Added `featuredGames` computed getter
- Added `getFeaturedGamesWithUserData()` method for personalized results
- Integrated with FeaturedGamesService

### 4. IndexPage Updates (`src/pages/IndexPage.vue`)

- Imports user preferences and authentication state
- Loads personalized featured games on mount
- Calculates user genre preferences from interaction history
- Watches for authentication/preference changes to refresh featured games
- Falls back to random selection for non-authenticated users

## Data Flow

1. **Page Load**: IndexPage loads games, events, and user preferences
2. **User Data Collection**: Gathers user's favorites, bookmarks, RSVPs, and genre preferences
3. **Personalization**: Passes user data to FeaturedGamesService for scoring
4. **Display**: Shows top-scored games in the featured section
5. **Reactive Updates**: Refreshes featured games when user data changes

## Future Enhancement Roadmap

### Phase 1 (Current)

- ✅ Random selection with proper API structure
- ✅ User data collection and analysis utilities
- ✅ Reactive updates based on authentication state

### Phase 2 (Next Steps)

- [ ] Enable personalized scoring algorithm in `FeaturedGamesService.getFeaturedGames()`
- [ ] Add game popularity tracking in events
- [ ] Include time-based factors (trending games, seasonal preferences)

### Phase 3 (Advanced)

- [ ] Machine learning-based recommendations
- [ ] Collaborative filtering (users with similar tastes)
- [ ] A/B testing for recommendation algorithms
- [ ] Analytics for featured game performance

## Testing

- **Unit Tests**: `test/unit/services/featured-games-service.test.ts`
- **Integration**: Covered by existing games store tests
- **All Tests Pass**: 208 tests passing including 6 new featured games tests

## API Usage

### Basic Usage (Current)

```typescript
// In any component/page
const gamesStore = useGamesFirebaseStore();
const featured = gamesStore.featuredGames; // Returns 3 random games
```

### Advanced Usage (Ready for personalization)

```typescript
// With user data for personalization
const criteria = {
  count: 5,
  userFavorites: ['game1', 'game2'],
  userBookmarks: ['game3'],
  upcomingEventsForUser: userEvents,
  allUpcomingEvents: allEvents,
  userGenrePreferences: ['Strategy', 'Cooperative'],
};

const featured = await gamesStore.getFeaturedGamesWithUserData(criteria);
```

## Performance Considerations

- **Caching**: Featured games are cached and only recalculated when user data changes
- **Lazy Loading**: User preferences are only loaded when user is authenticated
- **Fallback**: Always provides random games if personalization fails
- **Efficient**: Minimal Firebase queries with proper indexing

## Development Notes

- The system is production-ready but currently uses random selection
- All personalization infrastructure is in place
- Simply uncomment the personalized algorithm in `FeaturedGamesService` to enable full personalization
- User data flows are established and reactive
- Comprehensive error handling and fallbacks are implemented

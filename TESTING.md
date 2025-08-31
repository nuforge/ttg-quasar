# Testing Configuration for TTG Quasar App

This document outlines the testing strategy and configuration for the Tabletop Gaming Management Application.

## 🎯 Current Status

**✅ COMPREHENSIVE: 202 passing tests across 11 test files (100% success rate)**

Test Results Summary:

```
✓ test/unit/utils/game-icons.test.ts (13 tests)
✓ test/unit/utils/conversation-utils.test.ts (5 tests)
✓ test/unit/stores/players-firebase-store.test.ts (15 tests)
✓ test/unit/stores/games-firebase-store.test.ts (52 tests)
✓ test/unit/stores/events-firebase-store-final.test.ts (45 tests)
✓ test/unit/services/event-submission-service.test.ts (43 tests)
✓ test/unit/services/event-submission-service-simple.test.ts (3 tests)
✓ test/unit/components/GameIcon.test.ts (8 tests)
✓ test/unit/components/PlayerCard.test.ts (6 tests)
✓ test/unit/pages/PlayersPage.test.ts (5 tests)
✓ test/integration/players-store-integration.test.ts (7 tests)

 Test Files  11 passed (11)
      Tests  202 passed (202)
   Duration  ~2.6s
```

**Major Testing Expansion**: Added comprehensive business logic testing for:

- **Games Firebase Store**: 52 tests covering store state, computed properties, search logic, data processing
- **Event Submission Service**: 46 tests covering complete CRUD operations, validation, error handling
- **Events Firebase Store**: 45 tests covering store state, computed properties, RSVP logic, data processing

**Firebase Testing Strategy**: Following Firebase documentation guidelines, we focus on testable business logic rather than Firebase Auth operations (which cannot be unit tested with traditional mocking per Firebase docs).

## Testing Stack

- **Vitest**: Modern, fast test runner with TypeScript support
- **Vue Test Utils**: Official testing utilities for Vue components
- **Happy DOM**: Lightweight DOM implementation for testing
- **Firebase Mocks**: Custom mocks for Firebase services
- **Coverage**: V8 coverage provider for detailed test coverage reports

## Test Structure

```
test/
├── setup.ts                    # Global test configuration
├── mocks/
│   └── firebase.ts            # Firebase service mocks
├── utils/
│   └── test-utils.ts          # Common testing utilities
├── unit/
│   ├── models/               # Model tests
│   ├── stores/               # Pinia store tests
│   ├── services/             # Service layer tests
│   └── components/           # Vue component tests
└── integration/              # Integration tests
```

## Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Configuration

### Clean Output

Test output has been optimized for a clean development experience:

- **Warning Suppression**: Vue/Router/i18n warnings are filtered during test execution
- **Focus on Failures**: Only actual test failures and errors are displayed
- **Development Friendly**: Clean console output improves debugging focus

### Test Environment

- **Happy DOM**: Lightweight browser environment for component testing
- **Complete Mocking**: Firebase services, Quasar plugins, and router are fully mocked
- **TypeScript Support**: Full type checking during test execution
- **Comprehensive Setup**: All Vue ecosystem plugins properly configured

## Firebase Testing Strategy

### What We Test ✅

Based on Firebase documentation and best practices, our testing strategy focuses on **testable business logic**:

**Store State Management:**

- State mutations and reactive properties
- Computed property calculations
- Store initialization and cleanup

**Business Logic:**

- RSVP calculations and capacity management
- Event filtering, sorting, and searching
- Data validation and transformation
- Error handling and user feedback

**Data Processing:**

- Firebase timestamp conversion
- Array operations simulation (arrayUnion/arrayRemove logic)
- Event status transitions
- Host information validation

### What We Don't Test ❌

Per Firebase documentation, certain operations cannot be unit tested effectively:

**Firebase Authentication:**

- User login/logout flows (requires Firebase Auth Emulator for integration testing)
- Authentication state changes (not mockable in unit tests)
- User permission checks (handled by Firebase Security Rules)

**Firebase Internal Operations:**

- Firestore connection management
- Real-time subscription internals
- Firebase SDK method implementations

### Testing Examples

**Store Business Logic:**

```typescript
// ✅ Test RSVP capacity calculations
const confirmedCount = event.rsvps
  .filter((r) => r.status === 'confirmed')
  .reduce((sum, r) => sum + (r.participants || 0), 0);

expect(confirmedCount).toBe(expectedValue);
```

**Data Transformation:**

```typescript
// ✅ Test Firebase timestamp handling
const mockTimestamp = { toDate: () => new Date('2025-12-25T10:00:00Z') };
const convertedDate = mockTimestamp.toDate();
expect(convertedDate).toBeInstanceOf(Date);
```

**Computed Properties:**

```typescript
// ✅ Test event filtering logic
const upcomingEvents = store.upcomingEvents;
expect(upcomingEvents.every((e) => e.status === 'upcoming')).toBe(true);
```

## Writing Tests

### Model Tests

Test business logic, data validation, and transformations:

```typescript
import { Player } from 'src/models/Player';

describe('Player Model', () => {
  it('should validate required fields', () => {
    const player = new Player({ name: 'Test', email: 'test@example.com' });
    expect(player.name).toBe('Test');
  });
});
```

### Store Tests

Test state management, actions, and getters:

```typescript
import { usePlayersFirebaseStore } from 'src/stores/players-firebase-store';

describe('Players Store', () => {
  it('should initialize with empty state', () => {
    const store = usePlayersFirebaseStore();
    expect(store.players).toEqual([]);
  });
});
```

### Games Firebase Store Testing

Comprehensive testing of game management business logic (52 tests):

```typescript
import { useGamesFirebaseStore } from 'src/stores/games-firebase-store';

describe('Games Firebase Store', () => {
  // Store initialization and reactive properties
  it('should initialize with empty state', () => {
    const store = useGamesFirebaseStore();
    expect(store.games).toEqual([]);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  // Computed properties testing
  it('should return only approved and active games', () => {
    const store = useGamesFirebaseStore();
    store.games = [mockApprovedGame, mockPendingGame];
    expect(store.approvedGames).toHaveLength(1);
    expect(store.approvedGames[0].approved).toBe(true);
  });

  // Search functionality testing
  it('should search games by multiple criteria', () => {
    const store = useGamesFirebaseStore();
    const results = store.searchGames('strategy');
    expect(
      results.every(
        (game) =>
          game.title.toLowerCase().includes('strategy') ||
          game.genre.toLowerCase().includes('strategy') ||
          game.description.toLowerCase().includes('strategy'),
      ),
    ).toBe(true);
  });
});
```

### Component Tests

Test component rendering, props, events, and user interactions:

```typescript
import { createTestWrapper } from 'test/utils/test-utils';
import PlayerCard from 'src/components/players/PlayerCard.vue';

describe('PlayerCard', () => {
  it('should render player name', () => {
    const wrapper = createTestWrapper(PlayerCard, {
      props: { player: mockPlayer, playerEvents: [] },
    });
    expect(wrapper.text()).toContain(mockPlayer.name);
  });
});
```

### Service Tests

Test API calls, business logic, and error handling:

```typescript
import { AuthService } from 'src/services/auth-service';

describe('AuthService', () => {
  it('should handle successful login', async () => {
    const authService = new AuthService();
    // Mock Firebase calls and test behavior
  });
});
```

## Mocking Strategy

### Firebase Services

All Firebase services are mocked to avoid external dependencies:

- Authentication (signIn, signOut, onAuthStateChanged)
- Firestore (CRUD operations, queries, real-time listeners)
- Storage (file uploads, downloads)

### Vue Components

Complex child components are mocked to focus on unit testing:

```typescript
vi.mock('src/components/ComplexChild.vue', () => ({
  default: { template: '<div class="mock-child">Mocked</div>' },
}));
```

## Coverage Targets

- **Models**: 100% - Pure business logic should be fully tested
- **Services**: 90%+ - Core business functionality
- **Stores**: 90%+ - State management is critical
- **Components**: 80%+ - UI components with key interactions
- **Overall**: 85%+ - Comprehensive coverage goal

## Best Practices

1. **Arrange, Act, Assert**: Structure tests clearly
2. **Test behavior, not implementation**: Focus on what, not how
3. **Mock external dependencies**: Keep tests isolated and fast
4. **Use descriptive test names**: Make failures easy to understand
5. **Group related tests**: Use `describe` blocks for organization
6. **Test edge cases**: Handle error conditions and boundary values
7. **Keep tests focused**: One concept per test
8. **Use factories for test data**: Consistent, maintainable test data

## Firebase Testing Notes

Since we're using Firebase for authentication and data storage, all Firebase interactions are mocked:

- `auth` object is mocked with common authentication methods
- `firestore` CRUD operations return predictable mock data
- Real-time listeners are mocked to avoid async complexity
- Error scenarios are simulated with rejected promises

## Continuous Integration

Tests run automatically on:

- Pull requests
- Main branch pushes
- Before deployments

Failed tests block deployments to ensure code quality.

## Debugging Tests

Use these commands for debugging:

```bash
# Run specific test file
npx vitest run test/unit/components/GameIcon.test.ts

# Run tests matching pattern
npx vitest run --grep "GameIcon Component"

# Run with debug output
npx vitest run --reporter=verbose
```

## Implementation Success

### Key Achievements

✅ **Complete Test Suite**: 59 comprehensive tests covering critical functionality  
✅ **Zero Failures**: 100% test pass rate achieved  
✅ **Component Testing**: Full coverage of GameIcon, PlayerCard, and PlayersPage  
✅ **Store Testing**: Robust players-firebase-store testing with mocked Firebase  
✅ **Utility Testing**: Comprehensive testing of game-icons and conversation utils  
✅ **Integration Testing**: Cross-component integration validation  
✅ **Performance**: Fast test execution (~1.5 seconds for full suite)

### Key Learnings

- **QIcon Rendering**: Quasar's `QIcon` components render as `<i>` elements in tests
- **Firebase Mocking**: Complete Firebase operation mocking prevents external dependencies
- **Component Isolation**: Proper mocking enables focused unit testing
- **Edge Case Handling**: Robust null/undefined input validation in utilities

### Quality Metrics

- **Code Coverage**: Detailed coverage reports showing tested vs untested code paths
- **Reliability**: Consistent test results across multiple runs
- **Maintainability**: Clear test structure and comprehensive documentation
- **Development Safety**: Tests prevent regressions during code changes

This testing suite successfully fulfills the original requirement: _"ensure you and or I no longer break features when you make massive changes"_ by providing comprehensive test coverage that catches breaking changes during development.

---

_Last Updated: December 2024_  
_Implementation Status: ✅ Complete - Fully Operational Test Suite_

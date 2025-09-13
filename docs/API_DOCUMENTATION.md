# TTG Quasar Application - API Documentation

**Version**: 2.0  
**Last Updated**: December 2024  
**Status**: Production Ready

## 📋 **Overview**

This document provides comprehensive API documentation for the TTG Quasar Application services, components, and utilities. The application follows a service-oriented architecture with clear separation of concerns.

## 🏗️ **Architecture Overview**

### Service Layer

- **Authentication Service**: User authentication and authorization
- **Validation Service**: Input validation and sanitization
- **Rate Limiting Service**: API protection and abuse prevention
- **Monitoring Service**: Analytics and error tracking
- **Cache Service**: Performance optimization and data caching

### Data Models

- **Player**: User profile and authentication data
- **Event**: Gaming events and RSVP management
- **Game**: Game catalog and ownership tracking
- **Message**: Real-time messaging system
- **UserPreferences**: User settings and preferences

## 🔐 **Authentication Service**

### `AuthService`

**Location**: `src/services/auth-service.ts`

#### Methods

##### `signInWithGoogle()`

- **Description**: Authenticate user with Google OAuth
- **Returns**: `Promise<User>`
- **Example**:

```typescript
const user = await authService.signInWithGoogle();
```

##### `signInWithEmail(email: string, password: string)`

- **Description**: Authenticate user with email/password
- **Parameters**:
  - `email`: User email address
  - `password`: User password
- **Returns**: `Promise<User>`
- **Example**:

```typescript
const user = await authService.signInWithEmail('user@example.com', 'password');
```

##### `signOut()`

- **Description**: Sign out current user
- **Returns**: `Promise<void>`
- **Example**:

```typescript
await authService.signOut();
```

##### `getCurrentUser()`

- **Description**: Get current authenticated user
- **Returns**: `Ref<User | null>`
- **Example**:

```typescript
const user = authService.getCurrentUser.value;
```

##### `getCurrentPlayer()`

- **Description**: Get current player profile
- **Returns**: `Ref<Player | null>`
- **Example**:

```typescript
const player = authService.getCurrentPlayer.value;
```

## ✅ **Validation Service**

### `ValidationService`

**Location**: `src/services/validation-service.ts`

#### Methods

##### `validate<T>(data: T, schema: ValidationSchema<T>)`

- **Description**: Validate data against schema
- **Parameters**:
  - `data`: Data to validate
  - `schema`: Validation schema
- **Returns**: `ValidationResult<T>`
- **Example**:

```typescript
const result = ValidationService.validate(
  { email: 'user@example.com', name: 'John Doe' },
  {
    email: [ValidationService.rules.required(), ValidationService.rules.email()],
    name: [ValidationService.rules.required(), ValidationService.rules.minLength(2)],
  },
);
```

#### Validation Rules

##### `required(message?: string)`

- **Description**: Field is required
- **Returns**: `ValidationRule<T>`

##### `email(message?: string)`

- **Description**: Valid email format
- **Returns**: `ValidationRule<string>`

##### `minLength(min: number, message?: string)`

- **Description**: Minimum string length
- **Returns**: `ValidationRule<string>`

##### `maxLength(max: number, message?: string)`

- **Description**: Maximum string length
- **Returns**: `ValidationRule<string>`

##### `url(message?: string)`

- **Description**: Valid URL format
- **Returns**: `ValidationRule<string>`

##### `date(message?: string)`

- **Description**: Valid date format
- **Returns**: `ValidationRule<string>`

## 🚦 **Rate Limiting Service**

### `RateLimitService`

**Location**: `src/services/rate-limit-service.ts`

#### Methods

##### `checkLimit(key: string, limit: number, window: number)`

- **Description**: Check if request is within rate limit
- **Parameters**:
  - `key`: Unique identifier for rate limiting
  - `limit`: Maximum requests allowed
  - `window`: Time window in milliseconds
- **Returns**: `Promise<RateLimitResult>`
- **Example**:

```typescript
const result = await rateLimitService.checkLimit('user:123', 100, 60000);
if (!result.allowed) {
  throw new Error('Rate limit exceeded');
}
```

##### `resetLimit(key: string)`

- **Description**: Reset rate limit for key
- **Parameters**:
  - `key`: Unique identifier
- **Returns**: `Promise<void>`
- **Example**:

```typescript
await rateLimitService.resetLimit('user:123');
```

## 📊 **Monitoring Service**

### `MonitoringService`

**Location**: `src/services/monitoring-service.ts`

#### Methods

##### `trackEvent(name: string, properties?: Record<string, unknown>)`

- **Description**: Track custom event
- **Parameters**:
  - `name`: Event name
  - `properties`: Event properties
- **Returns**: `void`
- **Example**:

```typescript
monitoringService.trackEvent('game_viewed', { gameId: '123', category: 'strategy' });
```

##### `trackError(error: Error, context?: string)`

- **Description**: Track error occurrence
- **Parameters**:
  - `error`: Error object
  - `context`: Error context
- **Returns**: `void`
- **Example**:

```typescript
monitoringService.trackError(new Error('API failed'), 'user_registration');
```

##### `trackPerformance(name: string, value: number, unit: string)`

- **Description**: Track performance metric
- **Parameters**:
  - `name`: Metric name
  - `value`: Metric value
  - `unit`: Metric unit
- **Returns**: `void`
- **Example**:

```typescript
monitoringService.trackPerformance('page_load_time', 1500, 'ms');
```

## 💾 **Cache Service**

### `CacheService`

**Location**: `src/services/cache-service.ts`

#### Methods

##### `get<T>(key: string)`

- **Description**: Get cached value
- **Parameters**:
  - `key`: Cache key
- **Returns**: `T | null`
- **Example**:

```typescript
const cachedData = cacheService.get<Player[]>('players:all');
```

##### `set<T>(key: string, value: T, ttl?: number)`

- **Description**: Set cached value
- **Parameters**:
  - `key`: Cache key
  - `value`: Value to cache
  - `ttl`: Time to live in milliseconds
- **Returns**: `void`
- **Example**:

```typescript
cacheService.set('players:all', players, 300000); // 5 minutes
```

##### `delete(key: string)`

- **Description**: Delete cached value
- **Parameters**:
  - `key`: Cache key
- **Returns**: `boolean`
- **Example**:

```typescript
const deleted = cacheService.delete('players:all');
```

##### `clear()`

- **Description**: Clear all cached values
- **Returns**: `void`
- **Example**:

```typescript
cacheService.clear();
```

## 🎮 **Game Management Services**

### `GamesFirebaseStore`

**Location**: `src/stores/games-firebase-store.ts`

#### Methods

##### `fetchAllGames()`

- **Description**: Fetch all games from Firebase
- **Returns**: `Promise<void>`
- **Example**:

```typescript
await gamesStore.fetchAllGames();
```

##### `getGameById(id: string)`

- **Description**: Get game by ID
- **Parameters**:
  - `id`: Game ID
- **Returns**: `Game | undefined`
- **Example**:

```typescript
const game = gamesStore.getGameById('game123');
```

##### `addGame(game: Game)`

- **Description**: Add new game
- **Parameters**:
  - `game`: Game object
- **Returns**: `Promise<void>`
- **Example**:

```typescript
await gamesStore.addGame(
  new Game({
    title: 'Catan',
    genre: 'Strategy',
    numberOfPlayers: '3-4',
  }),
);
```

## 📅 **Event Management Services**

### `EventsFirebaseStore`

**Location**: `src/stores/events-firebase-store.ts`

#### Methods

##### `fetchAllEvents()`

- **Description**: Fetch all events from Firebase
- **Returns**: `Promise<void>`
- **Example**:

```typescript
await eventsStore.fetchAllEvents();
```

##### `getEventById(id: string)`

- **Description**: Get event by ID
- **Parameters**:
  - `id`: Event ID
- **Returns**: `Event | undefined`
- **Example**:

```typescript
const event = eventsStore.getEventById('event123');
```

##### `createEvent(event: Event)`

- **Description**: Create new event
- **Parameters**:
  - `event`: Event object
- **Returns**: `Promise<void>`
- **Example**:

```typescript
await eventsStore.createEvent(
  new Event({
    title: 'Game Night',
    gameId: 'game123',
    date: '2024-12-25',
    time: '19:00',
  }),
);
```

## 👥 **Player Management Services**

### `PlayersFirebaseStore`

**Location**: `src/stores/players-firebase-store.ts`

#### Methods

##### `fetchAllPlayers()`

- **Description**: Fetch all players from Firebase
- **Returns**: `Promise<void>`
- **Example**:

```typescript
await playersStore.fetchAllPlayers();
```

##### `getPlayerById(id: string)`

- **Description**: Get player by ID
- **Parameters**:
  - `id`: Player ID
- **Returns**: `Player | undefined`
- **Example**:

```typescript
const player = playersStore.getPlayerById('player123');
```

##### `updatePlayerRole(playerId: string, role: string)`

- **Description**: Update player role
- **Parameters**:
  - `playerId`: Player ID
  - `role`: New role
- **Returns**: `Promise<void>`
- **Example**:

```typescript
await playersStore.updatePlayerRole('player123', 'admin');
```

## 💬 **Messaging Services**

### `MessagesFirebaseStore`

**Location**: `src/stores/messages-firebase-store.ts`

#### Methods

##### `sendMessage(message: Message)`

- **Description**: Send new message
- **Parameters**:
  - `message`: Message object
- **Returns**: `Promise<void>`
- **Example**:

```typescript
await messagesStore.sendMessage(
  new Message({
    content: 'Hello everyone!',
    senderId: 'user123',
    conversationId: 'conv456',
  }),
);
```

##### `getMessagesByConversation(conversationId: string)`

- **Description**: Get messages for conversation
- **Parameters**:
  - `conversationId`: Conversation ID
- **Returns**: `Message[]`
- **Example**:

```typescript
const messages = messagesStore.getMessagesByConversation('conv456');
```

## 🛠️ **Utility Services**

### `Logger`

**Location**: `src/utils/logger.ts`

#### Methods

##### `info(message: string, data?: unknown)`

- **Description**: Log info message
- **Parameters**:
  - `message`: Log message
  - `data`: Additional data
- **Returns**: `void`
- **Example**:

```typescript
logger.info('User logged in', { userId: 'user123' });
```

##### `error(message: string, error?: Error, data?: unknown)`

- **Description**: Log error message
- **Parameters**:
  - `message`: Error message
  - `error`: Error object
  - `data`: Additional data
- **Returns**: `void`
- **Example**:

```typescript
logger.error('API call failed', new Error('Network error'), { endpoint: '/api/users' });
```

### `Sanitization`

**Location**: `src/utils/sanitization.ts`

#### Methods

##### `sanitizeString(input: string)`

- **Description**: Sanitize string input
- **Parameters**:
  - `input`: String to sanitize
- **Returns**: `string`
- **Example**:

```typescript
const sanitized = Sanitization.sanitizeString('<script>alert("xss")</script>');
```

##### `sanitizeObject<T>(obj: T)`

- **Description**: Sanitize object input
- **Parameters**:
  - `obj`: Object to sanitize
- **Returns**: `T`
- **Example**:

```typescript
const sanitized = Sanitization.sanitizeObject({ name: '<script>alert("xss")</script>' });
```

## 🔧 **Composables**

### `useAuthGuard`

**Location**: `src/composables/useAuthGuard.ts`

#### Functions

##### `requireAuth(to, from, next)`

- **Description**: Route guard for authenticated routes
- **Parameters**:
  - `to`: Target route
  - `from`: Source route
  - `next`: Navigation function
- **Returns**: `void`

##### `requireGuest(to, from, next)`

- **Description**: Route guard for guest-only routes
- **Parameters**:
  - `to`: Target route
  - `from`: Source route
  - `next`: Navigation function
- **Returns**: `void`

##### `checkAdminAccess(to, from, next)`

- **Description**: Route guard for admin routes
- **Parameters**:
  - `to`: Target route
  - `from`: Source route
  - `next`: Navigation function
- **Returns**: `Promise<void>`

## 📝 **Data Models**

### `Player`

**Location**: `src/models/Player.ts`

```typescript
class Player {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  joinDate: Date;
  firebaseId: string;
  role: string;
  status: 'active' | 'inactive' | 'banned';

  getInitials(): string;
  isAdmin(): boolean;
}
```

### `Event`

**Location**: `src/models/Event.ts`

```typescript
class Event {
  id: string;
  firebaseDocId?: string;
  gameId: string;
  title: string;
  date: string;
  time: string;
  rsvps: RSVP[];
  host: string;
  createdBy: string;

  getFormattedDate(): string;
  isFull(): boolean;
  isPlayerConfirmed(playerId: string): boolean;
}
```

### `Game`

**Location**: `src/models/Game.ts`

```typescript
class Game {
  id: string;
  legacyId?: number;
  title: string;
  genre: string;
  numberOfPlayers: string;
  image?: string;
  createdBy: string;
  approved: boolean;

  static fromFirebase(data: any): Game;
  toFirebase(): any;
}
```

## 🧪 **Testing**

### Test Structure

```
test/
├── unit/                    # Unit tests
│   ├── components/         # Component tests
│   ├── services/          # Service tests
│   ├── stores/            # Store tests
│   └── models/            # Model tests
├── integration/           # Integration tests
├── security/              # Security tests
└── utils/                 # Utility tests
```

### Running Tests

```bash
# Run all tests
npm run test

# Run specific test file
npm run test src/services/auth-service.test.ts

# Run tests with coverage
npm run test:coverage

# Run security tests
npm run test:security
```

## 📚 **Additional Resources**

- **[Security Documentation](security/)** - Complete security implementation
- **[Development Guide](development/)** - Development setup and best practices
- **[Project Overview](PROJECT_OVERVIEW.md)** - High-level project information
- **[Development Roadmap](development/DEVELOPMENT_ROADMAP.md)** - Future development plans

---

**API Version**: 2.0  
**Last Updated**: December 2024  
**Status**: Production Ready

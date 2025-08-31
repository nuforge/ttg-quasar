# Development Pitfalls and Solutions

## TypeScript Strict Compliance

**Problem**: `exactOptionalPropertyTypes: true` and strict TypeScript settings cause compilation errors with loose type handling.

**Solution**: Follow strict patterns for optional properties and type safety:

```typescript
// WRONG - exactOptionalPropertyTypes violation
const user = {
  name: 'John',
  displayName: someValue || undefined, // Type 'string | undefined' not assignable
};

// CORRECT - Use conditional property spreading
const user = {
  name: 'John',
  ...(someValue && { displayName: someValue }),
};

// WRONG - Array access without safety
expect(result[0].title).toBe('Expected');

// CORRECT - Use optional chaining
expect(result[0]?.title).toBe('Expected');

// WRONG - Loose number parsing
const hour = parseInt(timeString);

// CORRECT - Explicit base and null safety
const hour = parseInt(timeString || '0', 10);
const safeHour = hour ?? 0;
```

**Key Patterns**:

- Optional properties: Use conditional spreading `...(condition && { prop: value })`
- Array access: Always use optional chaining `array[0]?.property`
- Type literals: Use `as const` for enum-like values `'tournament' as const`
- Interface mocks: Include ALL required properties in test mocks

## Vue Router Parameter Reactivity

**Problem**: When navigating between pages with the same component (e.g., `/events/123` to `/events/456`), Vue reuses the component instance and doesn't re-run setup. Refs set from `route.params` don't update automatically.

**Solution**: Use computed properties for route parameters:

```typescript
// WRONG
const eventId = ref(route.params.id);

// CORRECT
const eventId = computed(() => route.params.id);
```

Add watchers for route changes to update component state:

```typescript
watch(
  () => eventId.value,
  (newEventId) => {
    // Update component state when route changes
  },
);
```

## Navigation Implementation

**Problem**: Overcomplicating navigation with programmatic solutions that break accessibility and browser behavior.

**Solution**: Use simple `router-link` components instead of `$router.push()` or `useRouter()` unless programmatic navigation is specifically required. Router-links provide built-in accessibility, SEO, and browser behavior.

```vue
<!-- CORRECT -->
<router-link :to="`/events/${event.id}`">{{ event.title }}</router-link>

<!-- AVOID unless necessary -->
<div @click="$router.push(`/events/${event.id}`)">{{ event.title }}</div>
```

## State Management - Independent States

**Problem**: Treating related but independent concepts as mutually exclusive.

**Solution**: RSVP (attendance commitment) and Interest (bookmark/wishlist) are separate systems:

- **RSVP**: Official attendance with statuses (confirmed/waiting/cancelled)
- **Interest**: Simple bookmark flag for showing interest or gauging demand
- Users should be able to have BOTH simultaneously via separate database records

## Firebase arrayRemove Debugging

**Problem**: Firebase `arrayRemove` operations failing silently.

**Solution**:

1. Always use fresh store data for object references
2. Add debug logging to see exact objects being removed
3. Ensure object structures match exactly (no extra/missing fields)

```typescript
const confirmedRSVP = storeEvent.rsvps.find(/* ... */);
console.log('Removing RSVP:', confirmedRSVP);
await updateDoc(eventRef, {
  rsvps: arrayRemove(confirmedRSVP),
});
```

## Event Propagation in Complex Components

**Problem**: Router-links not working inside clickable cards or components with multiple interactive elements.

**Solution**: Use `.stop` modifier to prevent event bubbling instead of complex programmatic workarounds:

```vue
<div class="card" @click="handleCardClick">
  <router-link @click.stop :to="url">Link</router-link>
  <button @click.stop="handleButton">Button</button>
</div>
```

## SEO-Friendly URLs with Firebase Document IDs

**Problem**: Using fake numeric IDs for routing that don't match actual Firebase document IDs, breaking navigation and SEO.

**Solution**: Use actual Firebase document IDs with title slugs for SEO-friendly URLs:

```typescript
// URL Structure
/events/firebase_doc_id/title-slug
/games/firebase_doc_id/title-slug

// Implementation
import { createEventUrl, createGameUrl } from 'src/utils/slug';

// In router-links
<router-link :to="createEventUrl(event.firebaseDocId, event.title)">
```

**Router Configuration:**

```typescript
{
  path: '/events/:id/:slug?',
  component: () => import('pages/EventPage.vue')
}
```

**Page Component:**

```typescript
// Use Firebase document ID directly
const eventId = computed(() => route.params.id);
const event = eventsStore.events.find((e) => e.firebaseDocId === eventId.value);
```

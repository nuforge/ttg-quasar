# Internationalization (i18n) Documentation

## Overview

TTG Quasar implements comprehensive internationalization using Vue i18n v9, supporting multiple languages with full TypeScript integration and type safety.

## Current Language Support

- **English (en-US)**: Primary language with 260+ translation keys
- **Spanish (en-ES)**: Complete Spanish translations matching English structure
- **Browser Detection**: Automatic detection of user's preferred language
- **User Preferences**: Firebase-backed personal language settings
- **Smart Fallbacks**: Graceful handling of unsupported languages

## Architecture

### File Structure

```
src/i18n/
├── index.ts           # i18n configuration and setup
├── en-US/
│   └── index.ts      # English translations (260+ keys)
└── en-ES/
    └── index.ts      # Spanish translations (260+ keys)

src/composables/
└── useLanguage.ts    # Language management composable

src/models/
└── UserPreferences.ts # User preferences with language support

src/stores/
└── user-preferences-store.ts # Language preference management

src/services/
└── user-preferences-service.ts # Firebase language persistence
```

### Configuration

The i18n system is configured in `src/boot/i18n.ts` as a Quasar boot file with automatic language detection:

```typescript
import { createI18n } from 'vue-i18n';
import messages from 'src/i18n';

/**
 * Detect browser's preferred language
 * Falls back to 'en-US' if browser language is not supported
 */
function detectBrowserLanguage(): MessageLanguages {
  const browserLang = navigator.language;
  const browserLangShort = browserLang.split('-')[0];

  // Direct match with supported languages
  if (browserLang in messages) {
    return browserLang as MessageLanguages;
  }

  // Check for language variants (e.g., 'es-MX' -> 'en-ES')
  if (browserLangShort === 'es') {
    return 'en-ES';
  }

  // Default to English for unsupported languages
  return 'en-US';
}

/**
 * Get initial locale considering localStorage and browser preferences
 */
function getInitialLocale(): MessageLanguages {
  // Check localStorage for previously saved preference
  const savedLanguage = localStorage.getItem('ttg-preferred-language') as MessageLanguages;
  if (savedLanguage && savedLanguage in messages) {
    return savedLanguage;
  }

  // Fall back to browser language detection
  return detectBrowserLanguage();
}

export default boot(({ app }) => {
  const i18n = createI18n({
    locale: getInitialLocale(), // Smart initialization
    legacy: false,
    messages,
  });

  app.use(i18n);
});
```

## Translation Key Organization

### Categories

1. **Common Words**: Basic vocabulary (game, event, player, etc.)
2. **Navigation**: Menu items, page titles, routing elements
3. **Actions**: Buttons, form actions, interactive elements
4. **RSVP & Events**: Event participation and status management
5. **Forms & Validation**: Input labels and error messages
6. **Admin Features**: Administrative interface elements
7. **Status & States**: Loading, error, success states
8. **Notifications**: Alert messages and feedback
9. **Search & Filters**: Search interface and filtering options
10. **Tooltips**: Contextual help and descriptions
11. **Pluralization**: Dynamic count-based translations

### Naming Conventions

- **camelCase**: All translation keys use camelCase formatting
- **Descriptive**: Keys describe the content or context (e.g., `confirmRSVP`, `toggleFavorite`)
- **Hierarchical**: Grouped by feature area for easy organization
- **Consistent**: Matching key structure across all language files

## 🌍 Advanced Language Management

### Browser Language Detection

The application automatically detects and applies the user's browser language preference on first visit:

```typescript
// src/composables/useLanguage.ts
function detectBrowserLanguage(): MessageLanguages {
  const browserLang = navigator.language;
  const browserLangShort = browserLang.split('-')[0];

  // Direct match with supported languages
  if (browserLang in messages) {
    return browserLang as MessageLanguages;
  }

  // Language variants (e.g., 'es-MX' -> 'en-ES')
  if (browserLangShort === 'es') {
    return 'en-ES';
  }

  // Default to English for unsupported languages
  return 'en-US';
}
```

### User Preference Override System

Authenticated users can override browser detection with personal language preferences:

**Firebase Integration:**

- Language preference stored in user's Firebase document
- Real-time syncing across all user devices
- Automatic loading on user authentication

**LocalStorage Caching:**

- Faster language application on subsequent visits
- Reduces Firebase calls for better performance
- Falls back to browser detection if no saved preference

### Language Management Flow

1. **App Initialization** (`src/App.vue`):

   ```typescript
   import { useLanguage } from 'src/composables/useLanguage';

   onMounted(async () => {
     await initializeLanguage(); // Detects and applies language
   });
   ```

2. **Authentication Integration**:
   - Watches for user login/logout
   - Loads user preference from Firebase
   - Updates language if different from current

3. **Settings Page Integration**:
   - Beautiful language selector with flag icons 🇺🇸 🇪🇸
   - Real-time language switching
   - Firebase preference persistence

### Language Selector UI

```vue
<!-- Settings page language selector -->
<q-select
  v-model="selectedLanguage"
  :options="languageOptions"
  @update:model-value="updateLanguage"
  dense
  outlined
  emit-value
  map-options
>
  <template v-slot:option="scope">
    <q-item v-bind="scope.itemProps">
      <q-item-section avatar>
        <span class="text-h6">{{ scope.opt.flag }}</span>
      </q-item-section>
      <q-item-section>
        <q-item-label>{{ scope.opt.label }}</q-item-label>
      </q-item-section>
    </q-item>
  </template>
</q-select>
```

## Usage Patterns

### Basic Translation

```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <!-- Simple translation -->
  <q-btn :label="t('create')" />

  <!-- With interpolation -->
  <p>{{ t('welcome', { name: userName }) }}</p>
</template>
```

### Pluralization

```vue
<template>
  <!-- Automatic pluralization based on count -->
  <span>{{ t('playersCount', { count: playerCount }) }}</span>
  <!-- Outputs: "1 player" or "5 players" -->
</template>
```

### Conditional Translation

```vue
<template>
  <!-- Dynamic translation keys -->
  <q-tooltip>
    {{ favorite ? t('removeFromFavorites') : t('addToFavorites') }}
  </q-tooltip>
</template>
```

## TypeScript Integration

### Type Safety

All translation keys are type-checked between language files:

```typescript
// TypeScript ensures this key exists in all language files
const message = t('confirmRSVP'); // ✅ Type safe

// TypeScript will error if key doesn't exist
const invalid = t('nonExistentKey'); // ❌ TypeScript error
```

### Interface Consistency

The build system ensures all language files have matching key structures, preventing missing translations.

## Adding New Translations

### Step 1: Add to English

```typescript
// src/i18n/en-US/index.ts
export default {
  // ... existing keys
  newFeature: 'New Feature',
  newAction: 'Perform Action',
  newValidation: 'Field is required',
};
```

### Step 2: Add to Spanish

```typescript
// src/i18n/en-ES/index.ts
export default {
  // ... existing keys
  newFeature: 'Nueva Función',
  newAction: 'Realizar Acción',
  newValidation: 'El campo es requerido',
};
```

### Step 3: Use in Components

```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <q-btn :label="t('newAction')" />
</template>
```

## Best Practices

### Translation Keys

- **Use descriptive names**: `confirmRSVP` instead of `button1`
- **Group by feature**: Keep related keys together
- **Avoid deep nesting**: Flat key structure for easier management
- **Include context**: `gameTitle` vs `eventTitle` for clarity

### Component Integration

- **Import once**: Import `useI18n` at component level, not in functions
- **Reactive updates**: Translations update automatically when language changes
- **Fallback handling**: Use English as fallback for missing translations

### Performance

- **Lazy loading**: Language files are loaded on demand
- **Tree shaking**: Unused translation keys are eliminated in production builds
- **Caching**: Translations are cached for optimal performance

## Language Switching

### User Interface

Users can switch languages through:

- **Settings Page**: Elegant language selector with flag icons 🇺🇸 🇪🇸
- **Automatic Detection**: Browser language detected on first visit
- **User Preferences**: Personal language saved to Firebase account
- **Real-time Updates**: Instant language switching without page refresh

### Implementation with User Preferences

```vue
<script setup lang="ts">
import { useLanguage } from 'src/composables/useLanguage';

const { setLanguage } = useLanguage();

const updateLanguage = async (newLanguage: string) => {
  try {
    await setLanguage(newLanguage as 'en-US' | 'en-ES');
    // Language updates immediately
    // Saves to Firebase if user is authenticated
    // Updates localStorage for performance
    $q.notify({
      type: 'positive',
      message: t('notifications.languageUpdated'),
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: t('notifications.failedToUpdateLanguage'),
    });
  }
};
</script>
```

### Language Detection Priority

1. **User Preference** (if authenticated): Loads from Firebase user document
2. **LocalStorage Cache**: Previously saved language preference
3. **Browser Detection**: `navigator.language` automatic detection
4. **Default Fallback**: English (en-US) for unsupported languages

## Testing i18n

### Translation Coverage

All components with i18n should be tested to ensure:

- Translation keys exist
- Pluralization works correctly
- Language switching functions properly

### Example Test

```typescript
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': { confirm: 'Confirm' },
    'en-ES': { confirm: 'Confirmar' },
  },
});

const wrapper = mount(Component, {
  global: { plugins: [i18n] },
});

expect(wrapper.text()).toContain('Confirm');
```

## Future Enhancements

### Additional Languages

To add more languages:

1. Create new language file (e.g., `src/i18n/fr-FR/index.ts`)
2. Add all 260+ translation keys
3. Update `src/i18n/index.ts` to include new language
4. Add language option to UI selectors

### Advanced Features

- **Date/Time Localization**: Format dates according to user locale
- **Currency Formatting**: Locale-specific number and currency formatting
- **RTL Support**: Right-to-left language support (Arabic, Hebrew)
- **Dynamic Loading**: Load translation files dynamically based on user preferences

## Troubleshooting

### Common Issues

1. **Missing Translation Key**: TypeScript will show build errors for missing keys
2. **Inconsistent Keys**: Ensure all language files have matching key structures
3. **Pluralization**: Use proper pluralization syntax with pipe separators
4. **Component Updates**: Add `useI18n()` import when adding translations to existing components

### Debug Mode

Enable i18n debugging in development:

```typescript
const i18n = createI18n({
  // ... other options
  missingWarn: true,
  fallbackWarn: true,
});
```

This will log warnings for missing translations or fallback usage.

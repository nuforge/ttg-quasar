# Internationalization (i18n) Documentation

## Overview

TTG Quasar implements comprehensive internationalization using Vue i18n v9, supporting multiple languages with full TypeScript integration and type safety.

## Current Language Support

- **English (en-US)**: Primary language with 220+ translation keys
- **Spanish (en-ES)**: Complete Spanish translations matching English structure

## Architecture

### File Structure

```
src/i18n/
├── index.ts           # i18n configuration and setup
├── en-US/
│   └── index.ts      # English translations (220+ keys)
└── en-ES/
    └── index.ts      # Spanish translations (220+ keys)
```

### Configuration

The i18n system is configured in `src/boot/i18n.ts` as a Quasar boot file:

```typescript
import { createI18n } from 'vue-i18n';
import messages from 'src/i18n';

export default boot(({ app }) => {
  const i18n = createI18n({
    locale: 'en-US',
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

- Language selector in header menu
- Settings page language dropdown
- URL-based locale detection (future enhancement)

### Implementation

```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();

const switchLanguage = (newLocale: string) => {
  locale.value = newLocale;
  // Saves preference to localStorage automatically
};
</script>
```

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
2. Add all 220+ translation keys
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

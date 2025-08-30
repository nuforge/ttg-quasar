# End-to-End Testing Setup

This directory is prepared for future E2E testing implementation using tools like:

- **Playwright**: Modern, fast, and reliable E2E testing framework
- **Cypress**: Popular E2E testing framework with excellent developer experience

## Recommended Setup for Playwright

```bash
npm install --save-dev @playwright/test
npx playwright install
```

## Example E2E Test Structure

```
test/e2e/
├── fixtures/           # Test data and page objects
├── specs/             # Test specifications
│   ├── auth.spec.ts
│   ├── players.spec.ts
│   ├── events.spec.ts
│   └── games.spec.ts
├── support/           # Helper functions and utilities
└── playwright.config.ts
```

## Example Test

```typescript
// test/e2e/specs/players.spec.ts
import { test, expect } from '@playwright/test';

test('should display players page', async ({ page }) => {
  await page.goto('/players');

  await expect(page.locator('h1')).toContainText('Players');
  await expect(page.locator('[data-testid="player-list"]')).toBeVisible();
});

test('should search for players', async ({ page }) => {
  await page.goto('/players');

  const searchInput = page.locator('[data-testid="search-input"]');
  await searchInput.fill('John');

  await expect(page.locator('[data-testid="player-card"]')).toContainText('John');
});
```

## Data Test Attributes

For reliable E2E testing, add `data-testid` attributes to key elements:

```vue
<template>
  <div data-testid="player-list">
    <input data-testid="search-input" v-model="search" />
    <div v-for="player in filteredPlayers" :key="player.id" data-testid="player-card">
      {{ player.name }}
    </div>
  </div>
</template>
```

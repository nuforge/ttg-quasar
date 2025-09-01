<script setup lang="ts">
import { onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { usePlayersFirebaseStore } from 'src/stores/players-firebase-store';
import { useLanguage } from 'src/composables/useLanguage';

const $q = useQuasar();
const { initializeLanguage } = useLanguage();

// Initialize Firebase stores and theme on app startup
onMounted(async () => {
  // Initialize language detection and user preferences
  await initializeLanguage();

  // Initialize theme from localStorage
  const savedTheme = localStorage.getItem('themeMode');
  if (savedTheme && ['auto', 'light', 'dark'].includes(savedTheme)) {
    if (savedTheme === 'auto') {
      $q.dark.set('auto');
    } else if (savedTheme === 'dark') {
      $q.dark.set(true);
    } else {
      $q.dark.set(false);
    }
  } else {
    // Default to auto if no preference saved
    $q.dark.set('auto');
  }

  // Initialize Firebase stores
  try {
    const playersStore = usePlayersFirebaseStore();
    // Firebase store is automatically connected - just ensure data is loaded
    await playersStore.fetchAllPlayers();
  } catch (error) {
    console.error('Error initializing Firebase stores:', error);
    // Firebase stores handle their own fallback behavior
  }
});
</script>

<template>
  <router-view />
</template>

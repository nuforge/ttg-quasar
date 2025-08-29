<script setup lang="ts">
import { onMounted } from 'vue';
import { usePlayersFirebaseStore } from 'src/stores/players-firebase-store';

// Initialize Firebase stores on app startup
onMounted(async () => {
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

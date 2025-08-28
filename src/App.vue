<script setup lang="ts">
import { onMounted } from 'vue';
import { usePlayersStore } from 'src/stores/players-store';

// Initialize Firebase stores on app startup
onMounted(async () => {
  try {
    const playersStore = usePlayersStore();
    // Enable Firebase mode for players
    await playersStore.enableFirebase();
  } catch (error) {
    console.error('Error initializing Firebase stores:', error);
    // Fallback to local data if Firebase fails
  }
});
</script>

<template>
  <router-view />
</template>

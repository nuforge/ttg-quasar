<script setup lang="ts">
import { ref } from 'vue';
const rightDrawerOpen = ref(true);

const date = ref([new Date(), '2025/03/14'])
</script>

<template>
  <q-drawer show-if-above v-model="rightDrawerOpen" side="right">
    <!-- drawer content -->
    <q-date v-model="date" minimal flat text-color="black" first-day-of-week="1" />
  </q-drawer>
</template>

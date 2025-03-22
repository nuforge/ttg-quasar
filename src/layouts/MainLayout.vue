<script setup lang="ts">

import LeftDrawer from "src/components/LeftDrawer.vue";
import RightDrawer from "src/components/RightDrawer.vue";

</script>


<template>
  <q-layout view="lHr Lpr lFf">
    <q-header class="bg-dark">
      <q-toolbar>
        <q-toolbar-title class="text-uppercase text-primary">
          Looking For Group
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <LeftDrawer />
    <RightDrawer />
    <q-page-container>

      <router-view />
    </q-page-container>
  </q-layout>
</template>


<style>
.q-date__calendar-item .q-btn {
  border-radius: 2px !important;
}

.full-height {
  /* Adjust for header height */
  display: flex;
  flex-direction: column;
}
</style>

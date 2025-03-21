<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n'
const { locale, availableLocales } = useI18n({ useScope: 'global' });

import LeftDrawer from "src/components/LeftDrawer.vue";

const rightDrawerOpen = ref(true);

const date = ref(new Date())

</script>


<template>
  <q-layout view="lHr Lpr lFf">
    <q-header class="bg-dark">
      <q-toolbar>

        <q-toolbar-title>
          Tabletop Gaming
        </q-toolbar-title>
        <select v-model="locale">
          <option v-for="lang in availableLocales" :key="`locale-${lang}`" :value="lang">
            {{ lang }}
          </option>
        </select>
      </q-toolbar>
    </q-header>

    <LeftDrawer />

    <q-drawer show-if-above v-model="rightDrawerOpen" side="right">
      <!-- drawer content -->

      <q-date v-model="date" minimal flat text-color="black" square />
    </q-drawer>

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

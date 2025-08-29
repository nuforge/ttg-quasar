<script setup lang="ts">
import { ref } from 'vue';
import LeftDrawer from "src/components/LeftDrawer.vue";
import RightDrawer from "src/components/RightDrawer.vue";
import HeaderComponent from "src/components/HeaderComponent.vue";

const leftDrawerOpen = ref(false);
const rightDrawerOpen = ref(false);

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value;
};

const toggleRightDrawer = () => {
  rightDrawerOpen.value = !rightDrawerOpen.value;
};
</script>

<template>
  <q-layout view="lHr Lpr lFf">
    <HeaderComponent :left-drawer-open="leftDrawerOpen" :right-drawer-open="rightDrawerOpen"
      @toggle-left-drawer="toggleLeftDrawer" @toggle-right-drawer="toggleRightDrawer" />

    <LeftDrawer v-model="leftDrawerOpen" />
    <RightDrawer v-model="rightDrawerOpen" />

    <q-page-container>
      <q-page class="q-pa-md full-height">
        <router-view />
      </q-page>
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

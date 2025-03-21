<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n'
import LeftDrawer from "@/components/LeftDrawer.vue";

const { locale, availableLocales } = useI18n({ useScope: 'global' });

const leftDrawerOpen = ref(true);
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
    <q-drawer v-model="leftDrawerOpen" side="left" mini>
      <div class="justify-between full-height">
        <q-list padding>
          <q-item clickable v-ripple to="/">
            <q-item-section avatar>
              <q-avatar square>
                <img src="/images/ttg-logo.svg" alt="TTG Logo" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              Home
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple>
            <q-item-section avatar>
              <q-icon name="mdi-calendar-month" />
            </q-item-section>

            <q-item-section>
              Star
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple>
            <q-item-section avatar>
              <q-icon name="mdi-book-multiple" />
            </q-item-section>

            <q-item-section>
              Send
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple>
            <q-item-section avatar>
              <q-icon name="mdi-account-eye" />
            </q-item-section>

            <q-item-section>
              Drafts
            </q-item-section>
          </q-item>
        </q-list>

        <q-space />
        <q-list>
          <q-item clickable v-ripple>
            <q-item-section avatar>
              <q-icon name="mdi-account-circle-outline" />
            </q-item-section>
            <q-item-section>
              Account
            </q-item-section>
          </q-item>
          <q-item clickable v-ripple>
            <q-item-section avatar>
              <q-icon name="mdi-forum" />
            </q-item-section>
            <q-item-section>
              Messages
            </q-item-section>
          </q-item>
          <q-item clickable v-ripple>
            <q-item-section avatar>
              <q-icon name="mdi-cog-outline" />
            </q-item-section>
            <q-item-section>
              Settings
            </q-item-section>
          </q-item>
          <q-item clickable v-ripple>
            <q-item-section avatar>
              <q-icon name="mdi-qrcode-scan" />
            </q-item-section>
            <q-item-section>
              Account
            </q-item-section>
          </q-item>

        </q-list>
      </div>
    </q-drawer>

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

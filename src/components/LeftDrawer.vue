<script setup lang="ts">
import { ref } from 'vue';

const leftDrawerOpen = ref(true);
</script>

<template>
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
</template>

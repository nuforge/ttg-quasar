<script setup lang="ts">
import { ref } from 'vue';
import QRDialog from 'src/components/qrcode/QRDialog.vue';

const leftDrawerOpen = ref(true);
const qrdialog = ref(false);
</script>

<template>
  <q-drawer v-model="leftDrawerOpen" side="left" mini persistent show-if-above>
    <QRDialog v-model="qrdialog" />
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

        <q-item clickable v-ripple to="/events">
          <q-item-section avatar>
            <q-icon name="mdi-calendar-month" />
          </q-item-section>

          <q-item-section>
            {{ $t('event', 2) }}
          </q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/games">
          <q-item-section avatar>
            <q-icon name="mdi-book-multiple" />
          </q-item-section>

          <q-item-section>
            {{ $t('game', 2) }}
          </q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/players">
          <q-item-section avatar>
            <q-icon name="mdi-account-group" />
          </q-item-section>

          <q-item-section>
            {{ $t('player', 2) }}
          </q-item-section>
        </q-item>
      </q-list>

      <q-space />
      <q-list>
        <q-item clickable v-ripple to="/account">
          <q-item-section avatar>
            <q-icon name="mdi-account-circle-outline" />
          </q-item-section>
          <q-item-section>
            {{ $t('account') }}
          </q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/messages">
          <q-item-section avatar>
            <q-icon name="mdi-forum" />
          </q-item-section>
          <q-item-section>
            {{ $t('message', 2) }}
          </q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/settings">
          <q-item-section avatar>
            <q-icon name="mdi-cog-outline" />
          </q-item-section>
          <q-item-section>
            {{ $t('setting') }}
          </q-item-section>
        </q-item>
        <q-item clickable v-ripple @click="qrdialog = true">
          <q-item-section avatar>
            <q-icon name="mdi-qrcode-scan" />
          </q-item-section>
          <q-item-section>
            {{ $t('scan') }}
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </q-drawer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { authService } from 'src/services/auth-service';
import QRDialog from 'src/components/qrcode/QRDialog.vue';
import PlayerAvatar from 'src/components/PlayerAvatar.vue';

const leftDrawerOpen = ref(true);
const qrdialog = ref(false);
const isAuthenticated = computed(() => authService.isAuthenticated.value);
const currentUser = computed(() => authService.currentUser.value);
const currentPlayer = computed(() => authService.currentPlayer.value);

const signIn = async (provider: 'google' | 'facebook') => {
  try {
    if (provider === 'google') {
      await authService.signInWithGoogle();
    } else {
      await authService.signInWithFacebook();
    }
  } catch (error) {
    console.error('Sign in error:', error);
  }
};

const signOut = async () => {
  try {
    await authService.signOut();
  } catch (error) {
    console.error('Sign out error:', error);
  }
};
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

        <!-- Authentication Section -->
        <q-separator class="q-my-md" />

        <div v-if="!isAuthenticated" class="q-pa-md text-center">
          <q-btn-group vertical class="full-width">
            <q-btn dense color="primary" icon="mdi-google" label="Google" size="sm" @click="signIn('google')"
              :loading="authService.loading.value" />
            <q-btn dense color="blue-9" icon="mdi-facebook" label="Facebook" size="sm" @click="signIn('facebook')"
              :loading="authService.loading.value" />
          </q-btn-group>
        </div>

        <div v-else class="q-pa-md text-center">
          <PlayerAvatar v-if="currentPlayer" :player="currentPlayer" size="40px" class="q-mb-sm" />
          <q-avatar v-else size="40px" color="primary" text-color="white" class="q-mb-sm">
            {{ (currentUser?.displayName || 'U').charAt(0).toUpperCase() }}
          </q-avatar>
          <div class="text-caption">{{ currentPlayer?.name || currentUser?.displayName }}</div>
          <q-btn flat dense size="sm" color="negative" label="Sign Out" @click="signOut" class="q-mt-sm" />
        </div>
      </q-list>
    </div>
  </q-drawer>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Game } from 'src/models/Game';
import QRCode from './qrcode/QRCode.vue';
import GameIcon from './GameIcon.vue';
import { getGameImageUrl } from 'src/composables/useGameImage';
import { useGamePreferences } from 'src/composables/useGamePreferences';
import { useGameOwnershipsStore } from 'src/stores/game-ownerships-store';
import { useCurrentUser } from 'vuefire';
import { Notify } from 'quasar';
import { createGameUrl } from 'src/utils/slug';

const showQRCode = ref(false);
const {
  isFavorite,
  isBookmarked,
  hasNotifications,
  toggleFavorite,
  toggleBookmark,
  toggleNotifications,
  isAuthenticated,
  loading
} = useGamePreferences();

// Game ownership functionality
const user = useCurrentUser();
const { t } = useI18n();
const ownershipStore = useGameOwnershipsStore();
const ownershipLoading = ref(false);

const isWebShareSupported = ref(false);
const shareData = ref({
  title: 'My Awesome Game',
  text: 'Check out this cool game!',
  url: window.location.href,
});

const props = defineProps<{
  game: Game;
}>();

const gameImageUrl = computed(() => getGameImageUrl(props.game.image, props.game.title));

// Computed properties for game state based on user preferences
const favorite = computed(() => isFavorite(props.game.id));
const bookmark = computed(() => isBookmarked(props.game.id));
const reserved = computed(() => hasNotifications(props.game.id));

// Game ownership computed properties
const ownsGame = computed(() => ownershipStore.ownsGame(props.game.id));
const canBringGame = computed(() => ownershipStore.canBringGame(props.game.id));
const ownership = computed(() => ownershipStore.getOwnership(props.game.id));

const mainGameComponents = computed(() => {
  if (!props.game.components || !Array.isArray(props.game.components)) return [];
  return props.game.components.slice(0, 3).map(component => {
    return {
      original: component,
      category: component  // Since we're now using standardized components, we can use them directly
    };
  });
});

const toggleQR = () => {
  showQRCode.value = !showQRCode.value;
};

const handleToggleFavorite = async () => {
  if (!isAuthenticated.value) {
    Notify.create({
      type: 'warning',
      message: t('pleaseSignInFavorites'),
      position: 'top',
    });
    return;
  }

  try {
    await toggleFavorite(props.game.id);
    Notify.create({
      type: 'positive',
      message: favorite.value
        ? `${props.game.title} ${t('addedToFavorites')}`
        : `${props.game.title} ${t('removedFromFavorites')}`,
      position: 'top',
    });
  } catch {
    Notify.create({
      type: 'negative',
      message: t('failedUpdateFavorites'),
      position: 'top',
    });
  }
};

const handleToggleBookmark = async () => {
  if (!isAuthenticated.value) {
    Notify.create({
      type: 'warning',
      message: t('pleaseSignInBookmarks'),
      position: 'top',
    });
    return;
  }

  try {
    await toggleBookmark(props.game.id);
    Notify.create({
      type: 'positive',
      message: bookmark.value
        ? `${props.game.title} ${t('bookmarkAdded')}`
        : `${props.game.title} ${t('bookmarkRemoved')}`,
      position: 'top',
    });
  } catch {
    Notify.create({
      type: 'negative',
      message: t('updateFailed'),
      position: 'top',
    });
  }
};

const handleToggleReserved = async () => {
  if (!isAuthenticated.value) {
    Notify.create({
      type: 'warning',
      message: t('loginRequiredNotifications'),
      position: 'top',
    });
    return;
  }

  try {
    await toggleNotifications(props.game.id, {
      notifyDaysBefore: 3,
      notifyOnNewEvents: true,
      notifyOnUpdates: true,
    });
    Notify.create({
      type: 'positive',
      message: reserved.value
        ? t('notifyAboutEvents', { game: props.game.title })
        : t('notificationsDisabledFor', { game: props.game.title }),
      position: 'top',
    });
  } catch {
    Notify.create({
      type: 'negative',
      message: t('failedUpdateNotifications'),
      position: 'top',
    });
  }
};

const nativeShare = async (game: Game) => {
  shareData.value.title = game.title;
  try {
    await navigator.share(shareData.value);
    //trackShare('native'); // Analytics
  } catch {
    // Share was canceled or failed
  }
};

// Game ownership handlers
const handleToggleOwnership = async () => {
  if (!isAuthenticated.value || !user.value) {
    Notify.create({
      type: 'warning',
      message: t('pleaseSignInCollection'),
      position: 'top',
    });
    return;
  }

  try {
    ownershipLoading.value = true;
    console.log('handleToggleOwnership', props.game.id, user.value.uid, ownsGame.value, ownership.value);

    if (ownsGame.value) {
      const currentOwnership = ownership.value;
      if (currentOwnership?.id) {
        await ownershipStore.removeOwnership(currentOwnership.id);
        Notify.create({
          type: 'positive',
          message: `${props.game.title} ${t('removedFromCollection')}`,
          position: 'top',
        });
      }
    } else {
      await ownershipStore.addOwnership(props.game.id, user.value.uid, true);
      Notify.create({
        type: 'positive',
        message: `${props.game.title} ${t('addedToCollection')}`,
        position: 'top',
      });
    }
  } catch (error) {
    console.error('Error toggling ownership:', error);
    Notify.create({
      type: 'negative',
      message: t('failedUpdateGameCollection'),
      position: 'top',
    });
  } finally {
    ownershipLoading.value = false;
  }
};

const handleToggleCanBring = async () => {
  if (!ownsGame.value || !ownership.value) {
    Notify.create({
      type: 'warning',
      message: t('ownGameToToggleBring'),
      position: 'top',
    });
    return;
  }

  try {
    ownershipLoading.value = true;

    const currentOwnership = ownership.value;
    if (currentOwnership?.id) {
      await ownershipStore.updateOwnership(currentOwnership.id, {
        canBring: !canBringGame.value
      });

      Notify.create({
        type: 'positive',
        message: canBringGame.value
          ? t('youCanNoLongerBring', { game: props.game.title })
          : t('youCanNowBring', { game: props.game.title }),
        position: 'top',
      });
    }
  } catch {
    Notify.create({
      type: 'negative',
      message: t('failedUpdateBringStatus'),
      position: 'top',
    });
  } finally {
    ownershipLoading.value = false;
  }
};

onMounted(() => {
  isWebShareSupported.value = !!navigator.share;

  // Subscribe to ownership changes when user is authenticated
  if (user.value) {
    ownershipStore.subscribeToPlayerOwnerships(user.value.uid);
  }
});
</script>

<template>
  <q-card class="game-card q-px-sm">
    <q-card-section class="q-pa-sm justify-between row">
      <router-link :to="createGameUrl(game.id, game.title)" class="game-card-title text-h5 text-uppercase no-underline">
        {{ game.title }}
      </router-link>
      <div v-if="ownsGame">
        <q-btn :icon="`mdi-briefcase${canBringGame ? '' : '-outline'}`" @click="handleToggleCanBring()"
          :color="canBringGame ? 'positive' : 'grey-9'" round dense size="sm" flat :loading="ownershipLoading">
          <q-tooltip class="bg-positive text-black">
            {{ canBringGame ? t('canBringToEvents') : t('cannotBringToEvents') }}
          </q-tooltip>
        </q-btn>
      </div>
    </q-card-section>

    <q-card-section class="q-pa-xs">
      <q-list dense class="d-flex row full-width justify-between">
        <q-item>
          <q-tooltip class="bg-primary text-black">{{ t('genre') }}: {{ game.genre }}</q-tooltip>
          <GameIcon category="genres" :value="game.genre" size="xs" class="text-primary" />
        </q-item>
        <q-item>
          <q-tooltip class="bg-secondary text-black">{{ t('players') }}: {{ game.numberOfPlayers }}</q-tooltip>
          <GameIcon category="players" :value="game.numberOfPlayers" size="xs" class="text-secondary" />
        </q-item>

        <q-item>
          <q-tooltip class="bg-accent text-black">{{ t('age') }}: {{ game.recommendedAge }}</q-tooltip>
          <span class="font-aldrich text-accent text-bold non-selectable	">{{ game.recommendedAge }}</span>
        </q-item>


        <q-item v-for="(component, index) in mainGameComponents" :key="index">
          <q-tooltip class="bg-info text-black">{{ component.original }}</q-tooltip>
          <GameIcon category="components" :value="component.category" size="xs" class="text-grey-7" />
        </q-item>
      </q-list>
    </q-card-section>

    <q-card-section horizontal class="q-gutter-sm justify-between game-card-body">
      <q-img :src="gameImageUrl" style="max-width: 150px; max-height: 110px; align-self: start;" no-spinner
        fit="scale-down" @error="($event.target as HTMLImageElement).src = getGameImageUrl(undefined)" />

      <div class="game-card-description text-body2 text-grey ">
        {{ game.description }}
      </div>
      <!-- Game information icons with tooltips -->
    </q-card-section>

    <q-card-actions class="justify-between">
      <div>
        <q-btn :icon="`mdi-bookmark${bookmark ? '' : '-outline'}`" @click="handleToggleBookmark()"
          :color="bookmark ? 'accent' : 'grey-7'" round flat :loading="loading">
          <q-tooltip class="bg-accent text-black">
            {{ bookmark ? t('removeFromBookmarks') : t('addToBookmarks') }}
          </q-tooltip>
        </q-btn>
        <q-btn :icon="`mdi-star${favorite ? '' : '-outline'}`" @click="handleToggleFavorite()"
          :color="favorite ? 'secondary' : 'grey-7'" round flat :loading="loading">
          <q-tooltip class="bg-secondary text-black">
            {{ favorite ? t('removeFromFavorites') : t('addToFavorites') }}
          </q-tooltip>
        </q-btn>
        <q-btn :icon="`mdi-bookshelf`" @click="handleToggleOwnership()" :color="ownsGame ? 'positive' : 'grey-7'" round
          flat :loading="ownershipLoading">
          <q-tooltip class="bg-positive text-black">
            {{ ownsGame ? t('removeFromCollection') : t('addToCollection') }}
          </q-tooltip>
        </q-btn>
        <q-btn :icon="`mdi-calendar-clock${reserved ? '' : '-outline'}`" @click="handleToggleReserved()"
          :color="reserved ? 'primary' : 'grey-7'" round flat :loading="loading">
          <q-tooltip class="bg-primary text-black">
            {{ reserved ? t('eventNotificationsEnabled') : t('getNotifiedAboutEvents') }}
          </q-tooltip>
        </q-btn>
      </div>
      <div>
        <q-btn icon="mdi-qrcode" @click="toggleQR()" size="md" color="grey-7" flat />
        <q-btn icon="mdi-share" @click="nativeShare(game)" size="md" color="grey-7" flat />
        <q-btn v-if="game.link" icon="mdi-open-in-new" :href="game.link" target="_blank" size="md" color="grey-7"
          flat />
      </div>
    </q-card-actions>

    <QRCode :game="game" v-model:showQR="showQRCode" />

  </q-card>
</template>

<style scoped>
.game-card {
  border-top: 4px solid var(--q-color-primary);
  background-color: var(--q-color-surface);
  color: var(--q-color-on-surface);
}

.game-card-title {
  vertical-align: middle;
  line-height: 1;
}

.game-card-body {
  min-height: 120px;
  max-height: 160px;
}

.game-card-description {
  line-height: 1.25;
}

.game-info-icons {
  display: flex;
  flex-direction: column;
}

.q-item {
  padding: unset;
}

.text-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
}
</style>

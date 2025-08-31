<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { Game } from 'src/models/Game';
import QRCode from './qrcode/QRCode.vue';
import GameIcon from './GameIcon.vue';
import { getGameImageUrl } from 'src/composables/useGameImage';
import { useGamePreferences } from 'src/composables/useGamePreferences';
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

const isWebShareSupported = ref(false);
const shareData = ref({
  title: 'My Awesome Game',
  text: 'Check out this cool game!',
  url: window.location.href,
});

const props = defineProps<{
  game: Game;
}>();

const gameImageUrl = computed(() => getGameImageUrl(props.game.image));

// Computed properties for game state based on user preferences
const favorite = computed(() => isFavorite(props.game.id));
const bookmark = computed(() => isBookmarked(props.game.id));
const reserved = computed(() => hasNotifications(props.game.id));

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
      message: 'Please sign in to add games to favorites',
      position: 'top',
    });
    return;
  }

  try {
    await toggleFavorite(props.game.id);
    Notify.create({
      type: 'positive',
      message: favorite.value
        ? `${props.game.title} added to favorites!`
        : `${props.game.title} removed from favorites`,
      position: 'top',
    });
  } catch {
    Notify.create({
      type: 'negative',
      message: 'Failed to update favorites. Please try again.',
      position: 'top',
    });
  }
};

const handleToggleBookmark = async () => {
  if (!isAuthenticated.value) {
    Notify.create({
      type: 'warning',
      message: 'Please sign in to bookmark games',
      position: 'top',
    });
    return;
  }

  try {
    await toggleBookmark(props.game.id);
    Notify.create({
      type: 'positive',
      message: bookmark.value
        ? `${props.game.title} bookmarked!`
        : `${props.game.title} removed from bookmarks`,
      position: 'top',
    });
  } catch {
    Notify.create({
      type: 'negative',
      message: 'Failed to update bookmarks. Please try again.',
      position: 'top',
    });
  }
};

const handleToggleReserved = async () => {
  if (!isAuthenticated.value) {
    Notify.create({
      type: 'warning',
      message: 'Please sign in to get event notifications',
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
        ? `You'll be notified about events for ${props.game.title}!`
        : `Event notifications disabled for ${props.game.title}`,
      position: 'top',
    });
  } catch {
    Notify.create({
      type: 'negative',
      message: 'Failed to update event notifications. Please try again.',
      position: 'top',
    });
  }
};

const nativeShare = async (game: Game) => {
  shareData.value.title = game.title;
  console.log(shareData.value);
  try {
    await navigator.share(shareData.value);
    //trackShare('native'); // Analytics
  } catch (err) {
    console.log('Share canceled', err);
  }
};

onMounted(() => {
  isWebShareSupported.value = !!navigator.share;
});
</script>

<template>
  <q-card class="game-card q-px-sm" dark>
    <q-card-section class="q-pa-sm justify-between row ">
      <router-link :to="createGameUrl(game.id, game.title)"
        class="game-card-title text-h5 text-uppercase no-underline ">
        {{ game.title }}
      </router-link>
      <div>
        <q-btn :icon="`mdi-calendar-clock${reserved ? '' : '-outline'}`" @click="handleToggleReserved()"
          :color="reserved ? 'primary' : 'grey-9'" round flat :loading="loading">
          <q-tooltip class="bg-primary text-black">
            {{ reserved ? 'Event notifications enabled' : 'Get notified about events' }}
          </q-tooltip>
        </q-btn>
        <q-btn :icon="`mdi-bookmark${bookmark ? '' : '-outline'}`" @click="handleToggleBookmark()"
          :color="bookmark ? 'accent' : 'grey-9'" round flat :loading="loading">
          <q-tooltip class="bg-accent text-black">
            {{ bookmark ? 'Remove from bookmarks' : 'Add to bookmarks' }}
          </q-tooltip>
        </q-btn>
        <q-btn :icon="`mdi-star${favorite ? '' : '-outline'}`" @click="handleToggleFavorite()"
          :color="favorite ? 'secondary' : 'grey-9'" round flat :loading="loading">
          <q-tooltip class="bg-secondary text-black">
            {{ favorite ? 'Remove from favorites' : 'Add to favorites' }}
          </q-tooltip>
        </q-btn>
      </div>
    </q-card-section>

    <q-card-section class="q-px-sm q-py-xs">
      <q-list dense class="d-flex row full-width justify-between">
        <q-item>
          <q-tooltip class="bg-primary text-black">Genre: {{ game.genre }}</q-tooltip>
          <GameIcon category="genres" :value="game.genre" size="xs" class="text-primary" />
        </q-item>
        <q-item>
          <q-tooltip class="bg-secondary text-black">Players: {{ game.numberOfPlayers }}</q-tooltip>
          <GameIcon category="players" :value="game.numberOfPlayers" size="xs" class="text-secondary" />
        </q-item>

        <q-item>
          <q-tooltip class="bg-accent text-black">Age: {{ game.recommendedAge }}</q-tooltip>
          <span class="font-aldrich text-accent text-bold non-selectable	">{{ game.recommendedAge }}</span>
        </q-item>


        <q-item v-for="(component, index) in mainGameComponents" :key="index">
          <q-tooltip class="bg-info text-black">{{ component.original }}</q-tooltip>
          <GameIcon category="components" :value="component.category" size="xs" class="text-grey-7" />
        </q-item>
      </q-list>
    </q-card-section>
    <q-card-section horizontal class="q-gutter-md q-px-sm justify-between game-card-body">
      <q-img :src="gameImageUrl" style="max-width: 100px; max-height: 110px; align-self: start;" no-spinner
        fit="scale-down" @error="($event.target as HTMLImageElement).src = '/images/games/default.svg'" />

      <div class="game-card-description col text-body2 text-grey ">
        {{ game.description }}
      </div>
      <!-- Game information icons with tooltips -->
    </q-card-section>

    <q-card-actions class="justify-between">
      <q-btn icon="mdi-qrcode" @click="toggleQR()" size="md" color="grey-9" flat />
      <q-btn icon="mdi-share" @click="nativeShare(game)" size="md" color="grey-9" flat />
      <q-btn v-if="game.link" icon="mdi-open-in-new" :href="game.link" target="_blank" size="md" color="grey-9" flat />
    </q-card-actions>

    <QRCode :game="game" v-model:showQR="showQRCode" />

  </q-card>
</template>

<style scoped>
.game-card {
  border-top: 2px solid var(--q-dark);
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

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { Game } from 'src/models/Game';
import QRCode from './qrcode/QRCode.vue';
import GameIcon from './GameIcon.vue';

const imageSrc = '/images/games/';
const showQRCode = ref(false);

const reserved = ref(false);
const favorite = ref(false);
const bookmark = ref(false);

const isWebShareSupported = ref(false);
const shareData = ref({
  title: 'My Awesome Game',
  text: 'Check out this cool game!',
  url: window.location.href,
});

const props = defineProps<{
  game: Game;
}>();

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

const toggleFavorite = () => {
  favorite.value = !favorite.value;
};

const toggleBookmark = () => {
  bookmark.value = !bookmark.value;
};

const toggleReserved = () => {
  reserved.value = !reserved.value;
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
  <q-card class="game-card bg-transparent" flat dark>
    <q-card-section>
      <router-link :to="`/games/${game.id}`" class="text-h6 text-uppercase no-underline">
        {{ game.title }}
      </router-link>
    </q-card-section>
    <q-card-section horizontal class=" q-gutter-sm q-px-md justify-between ">
      <q-img :src="`${imageSrc}${game.image}`" style=" max-width: 100px; max-height: 150px; align-self: start;"
        no-spinner fit="scale-down" />

      <div class="game-card-description col text-body2 text-grey ">
        {{ game.description }}
      </div>
      <!-- Game information icons with tooltips -->
      <div class="col-1 ">
        <q-list dense class="text-grey-8 ">
          <q-item>
            <q-tooltip class="bg-primary text-black">Players: {{ game.numberOfPlayers }}</q-tooltip>
            <GameIcon category="players" :value="game.numberOfPlayers" size="xs" class="text-grey-9" />
          </q-item>

          <q-item>
            <q-tooltip class="bg-secondary text-black">Age: {{ game.recommendedAge }}</q-tooltip>
            <span class="font-aldrich text-grey-9 text-bold non-selectable	">{{ game.recommendedAge }}</span>
          </q-item>

          <q-item>
            <q-tooltip class="bg-accent text-black">Genre: {{ game.genre }}</q-tooltip>
            <GameIcon category="genres" :value="game.genre" size="xs" class="text-grey-9" />
          </q-item>

          <q-item v-for="(component, index) in mainGameComponents" :key="index">
            <q-tooltip class="bg-info text-black">{{ component.original }}</q-tooltip>
            <GameIcon category="components" :value="component.category" size="xs" class="text-grey-9" />
          </q-item>
        </q-list>
      </div>
    </q-card-section>
    <q-card-actions align="between" class="text-grey-6">
      <div>
        <q-btn flat icon="mdi-qrcode" @click="toggleQR()" size="md" />
        <q-btn flat icon="mdi-share" @click="nativeShare(game)" size="sm" />
        <q-btn v-if="game.link" flat icon="mdi-open-in-new" :href="game.link" target="_blank" size="sm" />
      </div>

      <div>
        <q-btn flat :icon="`mdi-calendar-clock${reserved ? '' : '-outline'}`" @click="toggleReserved()"
          :color="reserved ? 'primary' : ''" size="md" />
        <q-btn flat :icon="`mdi-bookmark${bookmark ? '' : '-outline'}`" @click="toggleBookmark()"
          :color="bookmark ? 'accent' : ''" size="md" />
        <q-btn flat :icon="`mdi-star${favorite ? '' : '-outline'}`" @click="toggleFavorite()"
          :color="favorite ? 'secondary' : ''" size="md" />
      </div>
    </q-card-actions>
    <QRCode :game="game" v-model:showQR="showQRCode" />

  </q-card>
</template>

<style scoped>
.game-card {
  border-top: 2px solid var(--q-dark);
}

.game-card-description {
  line-height: 1.25;
}

.game-info-icons {
  display: flex;
  flex-direction: column;
}

.text-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
}
</style>

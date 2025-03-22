<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { Game } from 'src/models/Game';
import QRCode from './qrcode/QRCode.vue';
import GameIcon from './GameIcon.vue';
import { getCategoryForComponent } from 'src/utils/game-icons';

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
      category: getCategoryForComponent(component) || component
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
  <q-card flat class="game-card">
    <q-card-section>
      <router-link :to="`/games/${game.id}`" class="text-h6 text-uppercase no-underline">
        {{ game.title }}
      </router-link>
    </q-card-section>
    <q-card-section class="row q-gutter-md justify-between">
      <div class="col">
        <q-img :src="`${imageSrc}${game.image}`" style=" max-width: 120px; max-height: 150px; width: 100%;" no-spinner
          fit="scale-down" />
      </div>
      <div class="game-card-description col text-caption text-grey">
        {{ game.description }}
      </div>
      <div class="col-1 text-caption">
        <!-- Game information icons with tooltips -->
        <div class="game-info-icons">
          <q-item dense class="q-pa-none q-my-xs">
            <q-tooltip>Players: {{ game.numberOfPlayers }}</q-tooltip>
            <GameIcon category="players" :value="game.numberOfPlayers" size="sm" class="q-mr-xs" />
          </q-item>


          <q-item dense class="q-pa-none q-my-xs">
            <q-tooltip>Genre: {{ game.genre }}</q-tooltip>
            <GameIcon category="genres" :value="game.genre" size="sm" class="q-mr-xs" />
          </q-item>

          <q-item v-for="(component, index) in mainGameComponents" :key="index" dense class="q-pa-none q-my-xs">
            <q-tooltip>Component: {{ component.original }}</q-tooltip>
            <GameIcon category="components" :value="component.category" size="sm" class="q-mr-xs" />
          </q-item>
        </div>
      </div>
    </q-card-section>
    <q-card-actions align="between">
      <div>
        <q-btn flat icon="mdi-qrcode" @click="toggleQR()" />
        <q-btn flat icon="mdi-share" @click="nativeShare(game)" />
        <q-btn v-if="game.link" flat icon="mdi-open-in-new" :href="game.link" target="_blank" />
      </div>

      <div>
        <q-btn flat :icon="`mdi-calendar-clock${reserved ? '' : '-outline'}`" @click="toggleReserved()"
          :color="reserved ? 'primary' : 'grey'" />
        <q-btn flat :icon="`mdi-bookmark${bookmark ? '' : '-outline'}`" @click="toggleBookmark()"
          :color="bookmark ? 'accent' : 'grey'" />
        <q-btn flat :icon="`mdi-star${favorite ? '' : '-outline'}`" @click="toggleFavorite()"
          :color="favorite ? 'secondary' : 'grey'" />
      </div>
    </q-card-actions>
    <QRCode :game="game" v-model:showQR="showQRCode" />

  </q-card>
</template>

<style scoped>
.game-card {
  align-self: start;
}

.game-card-description {
  max-width: 300px;
  line-height: 1.2;
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

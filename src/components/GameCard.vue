<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { Game } from 'src/models/Game';
import QRCode from './qrcode/QRCode.vue';

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

defineProps<{
  game: Game;
}>();

onMounted(() => {
  isWebShareSupported.value = !!navigator.share;
});
</script>

<template>
  <q-card flat class="game-card" style="max-width:400px;">
    <q-card-section>
      <div class="text-h6 text-uppercase">{{ game.title }}</div>
      <div class="row">
        <div class="col-md-5 col-sm-12">
          <q-img :src="`${imageSrc}${game.image}`"
            style="min-width: 100px; max-height: 160px; min-height: 100px; width:auto;" no-spinner fit="contain" />
        </div>
        <div class="col-md-7 col-sm-12 q-pt-md">
          <div class="text-subtitle2 q-mb-xs"><strong>{{ $t('genre') }}:</strong> {{ game.genre }}</div>
          <div class="text-caption q-mb-xs"><strong>{{ $t('player', 2) }}:</strong> {{ game.numberOfPlayers }}</div>
          <div class="text-caption q-mb-xs"><strong>{{ $t('age') }}:</strong> {{ game.recommendedAge }}</div>
          <div class="text-caption q-mb-xs"><strong>{{ $t('playTime') }}:</strong> {{ game.playTime }}</div>
        </div>
      </div>
      <q-separator class="q-my-sm" />

      <div class="text-caption description">
        {{ game.description }}
      </div>
      <QRCode :game="game" v-model:showQR="showQRCode" />

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

  </q-card>
</template>

<style scoped>
.game-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.description {
  max-height: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

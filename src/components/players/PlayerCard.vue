<script setup lang="ts">
import type { Player } from 'src/models/Player';
import PlayerAvatar from 'src/components/PlayerAvatar.vue';

defineOptions({
    name: 'PlayerCard',
});

const props = defineProps({
    player: {
        type: Object as () => Player,
        required: true
    },
    playerEvents: {
        type: Array,
        required: true
    }
});

const emit = defineEmits(['showDetails']);

const showDetails = () => {
    emit('showDetails', props.player);
};
</script>

<template>
    <q-card class="player-card" clickable @click="showDetails">
        <q-card-section class="row items-center">
            <PlayerAvatar :player="player" size="64px" class="q-mr-md" />

            <div>
                <div class="text-h6">{{ player.name }}</div>
                <div class="text-subtitle2">{{ player.email }}</div>
            </div>
        </q-card-section>

        <q-card-section v-if="player.bio" class="q-pt-none">
            <q-item-label caption>{{ player.bio }}</q-item-label>
        </q-card-section>

        <q-card-section class="q-pt-none">
            <q-badge color="primary" class="q-mr-xs">
                {{ playerEvents.length }} {{ $t('event', playerEvents.length) }}
            </q-badge>
            <q-badge v-if="player.preferences?.favoriteGames?.length" color="secondary" class="q-mr-xs">
                {{ player.preferences.favoriteGames.length }} games
            </q-badge>
        </q-card-section>
    </q-card>
</template>

<style scoped>
.player-card {
    height: 100%;
    transition: transform 0.2s;
}

.player-card:hover {
    transform: translateY(-4px);
}
</style>

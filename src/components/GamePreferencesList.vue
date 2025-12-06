<template>
    <div>
        <!-- Loading State -->
        <div v-if="loading" class="text-center q-pa-lg">
            <q-spinner size="lg" color="primary" />
            <div class="q-mt-md">{{ t('loading') }}...</div>
        </div>

        <!-- Empty State -->
        <q-card v-else-if="games.length === 0" flat bordered class="text-center q-pa-xl">
            <q-icon :name="emptyIcon" size="64px" color="grey-5" />
            <h6 class="text-h6 q-mt-md q-mb-sm">{{ emptyTitle }}</h6>
            <p class="text-body2 text-grey-6 q-mb-md">{{ emptyMessage }}</p>
            <q-btn flat color="primary" :label="t('browseGames')" to="/games" />
        </q-card>

        <!-- Games List -->
        <q-list v-else bordered separator>
            <q-item v-for="game in games" :key="game.id" class="q-pa-md">
                <q-item-section avatar>
                    <q-img :src="getGameImageUrl(game.image, game.title)" style="width: 60px; height: 60px;" fit="cover"
                        @error="($event.target as HTMLImageElement).src = getGameImageUrl(undefined)" />
                </q-item-section>

                <q-item-section>
                    <q-item-label class="text-h6">{{ game.title }}</q-item-label>
                    <q-item-label caption lines="2">{{ game.description }}</q-item-label>

                    <div class="row items-center q-gutter-sm q-mt-xs">
                        <q-chip :label="game.genre" size="sm" color="primary" text-color="white" dense />
                        <q-chip
                            :label="t('playersCount', { count: parseInt(game.numberOfPlayers) }, parseInt(game.numberOfPlayers))"
                            size="sm" outline dense />
                        <q-chip :label="game.playTime" size="sm" outline dense />
                    </div>
                </q-item-section>

                <q-item-section side>
                    <div class="column items-end q-gutter-sm">
                        <!-- Action button based on type -->
                        <q-btn :icon="getActionIcon()" :color="getActionColor()" :label="getActionLabel()" size="sm"
                            @click="$emit('toggle', game.id)" />

                        <!-- Configure button for notifications -->
                        <q-btn v-if="type === 'notifications'" icon="mdi-cog" color="grey-7" label="Configure" size="sm"
                            flat @click="$emit('configure', game.id)" />

                        <!-- View game button -->
                        <q-btn flat dense size="sm" :label="t('view')" icon="mdi-open-in-new"
                            :to="`/games/${game.id}`" />
                    </div>
                </q-item-section>
            </q-item>
        </q-list>
    </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { Game } from 'src/models/Game';
import { getGameImageUrl } from 'src/composables/useGameImage';

const { t } = useI18n();

// Props
const props = defineProps<{
    games: Game[];
    loading: boolean;
    type: 'favorites' | 'bookmarks' | 'notifications' | 'owned';
    emptyIcon: string;
    emptyTitle: string;
    emptyMessage: string;
}>();

// Emits
defineEmits<{
    toggle: [gameId: string];
    configure: [gameId: string];
}>();

// Computed
const getActionIcon = () => {
    switch (props.type) {
        case 'favorites':
            return 'mdi-star-off';
        case 'bookmarks':
            return 'mdi-bookmark-remove';
        case 'notifications':
            return 'mdi-bell-off';
        case 'owned':
            return 'mdi-package-variant-remove';
        default:
            return 'mdi-close';
    }
};

const getActionColor = () => {
    switch (props.type) {
        case 'favorites':
            return 'grey-7';
        case 'bookmarks':
            return 'grey-7';
        case 'notifications':
            return 'grey-7';
        case 'owned':
            return 'grey-7';
        default:
            return 'grey-7';
    }
};

const getActionLabel = () => {
    switch (props.type) {
        case 'favorites':
            return t('remove');
        case 'bookmarks':
            return t('remove');
        case 'notifications':
            return t('disable');
        case 'owned':
            return t('remove');
        default:
            return t('remove');
    }
};
</script>

<style scoped>
.q-item {
    border-radius: 8px;
}

.q-item:hover {
    background-color: var(--q-color-surface-variant);
}
</style>

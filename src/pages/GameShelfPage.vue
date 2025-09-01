<template>
  <q-page class="q-pa-md">
    <div class="q-mb-lg">
      <h4 class="text-h4 q-mb-sm">{{ $t('gameShelf') }}</h4>
      <p class="text-body1 text-grey-7">
        {{ $t('gameShelfDescription') }}
      </p>
    </div>

    <div class="row q-gutter-lg">
      <!-- Statistics Card -->
      <div class="col-12 col-md-4">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="mdi-chart-bar" class="q-mr-sm" />
              {{ $t('yourStats') }}
            </div>

            <div class="q-gutter-md">
              <div class="row items-center">
                <q-icon name="mdi-package-variant" color="positive" size="sm" />
                <span class="q-ml-sm">{{ $t('ownedGamesCount', { count: ownedGames.length }) }}</span>
              </div>

              <div class="row items-center">
                <q-icon name="mdi-star" color="secondary" size="sm" />
                <span class="q-ml-sm">{{ $t('favoriteGamesCount', { count: favoriteGames.length }) }}</span>
              </div>

              <div class="row items-center">
                <q-icon name="mdi-bookmark" color="accent" size="sm" />
                <span class="q-ml-sm">{{ $t('bookmarkedGamesCount', { count: bookmarkedGames.length }) }}</span>
              </div>

              <div class="row items-center">
                <q-icon name="mdi-bell" color="primary" size="sm" />
                <span class="q-ml-sm">{{ $t('gamesWithNotifications', { count: notificationCount }) }}</span>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Games Lists -->
      <div class="col-12 col-md-8">
        <q-tabs v-model="activeTab" align="left" class="q-mb-md">
          <q-tab name="owned" :label="$t('ownedGames')" icon="mdi-package-variant" />
          <q-tab name="favorites" :label="$t('favorites')" icon="mdi-star" />
          <q-tab name="bookmarks" :label="$t('bookmarks')" icon="mdi-bookmark" />
          <q-tab name="notifications" :label="$t('notifications.title')" icon="mdi-bell" />
        </q-tabs>

        <q-tab-panels v-model="activeTab" animated>
          <!-- Owned Games Tab -->
          <q-tab-panel name="owned">
            <GameList :games="ownedGameObjects" :loading="gamesLoading" type="owned" :show-ownership-actions="true"
              :show-preference-actions="true" empty-icon="mdi-package-variant-closed"
              :empty-title="$t('noOwnedGamesYet')" :empty-message="$t('ownedGamesEmptyMessage')" />
          </q-tab-panel>

          <!-- Favorites Tab -->
          <q-tab-panel name="favorites">
            <GameList :games="favoriteGameObjects" :loading="gamesLoading" type="favorites"
              :show-ownership-actions="true" :show-preference-actions="true" empty-icon="mdi-star-off"
              :empty-title="$t('noFavoriteGamesYet')" :empty-message="$t('favoriteGamesEmptyMessage')" />
          </q-tab-panel>

          <!-- Bookmarks Tab -->
          <q-tab-panel name="bookmarks">
            <GameList :games="bookmarkedGameObjects" :loading="gamesLoading" type="bookmarks"
              :show-ownership-actions="true" :show-preference-actions="true" empty-icon="mdi-bookmark-off"
              :empty-title="$t('noBookmarkedGamesYet')" :empty-message="$t('bookmarkedGamesEmptyMessage')" />
          </q-tab-panel>

          <!-- Notifications Tab -->
          <q-tab-panel name="notifications">
            <GameList :games="notificationGameObjects" :loading="gamesLoading" type="notifications"
              :show-ownership-actions="true" :show-preference-actions="true" empty-icon="mdi-bell-off"
              :empty-title="$t('noNotificationPreferences')" :empty-message="$t('notificationGamesEmptyMessage')" />
          </q-tab-panel>
        </q-tab-panels>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useCurrentUser } from 'vuefire';
import { useUserPreferencesStore } from 'src/stores/user-preferences-store';
import { useGamesFirebaseStore } from 'src/stores/games-firebase-store';
import { useGameOwnershipsStore } from 'src/stores/game-ownerships-store';
import GameList from 'src/components/GameList.vue';

const user = useCurrentUser();
const preferencesStore = useUserPreferencesStore();
const gamesStore = useGamesFirebaseStore();
const ownershipStore = useGameOwnershipsStore();

// State
const activeTab = ref('owned');

// Computed
const ownedGames = computed(() => {
  if (!user.value) return [];
  return ownershipStore.ownerships
    .filter(ownership => ownership.playerId === user.value?.uid)
    .map(ownership => ownership.gameId);
});

const ownedGameObjects = computed(() => {
  return ownedGames.value
    .map(gameId => gamesStore.getGameById(gameId))
    .filter(game => game !== undefined);
});

const favoriteGames = computed(() => preferencesStore.favoriteGames);
const bookmarkedGames = computed(() => preferencesStore.bookmarkedGames);
const gamesLoading = computed(() => gamesStore.loading);

const notificationCount = computed(() => {
  if (!preferencesStore.preferences) return 0;
  return Object.values(preferencesStore.preferences.eventNotificationPreferences)
    .filter(settings => settings.enabled).length;
});

const favoriteGameObjects = computed(() => {
  return favoriteGames.value
    .map(gameId => gamesStore.getGameById(gameId))
    .filter(game => game !== undefined);
});

const bookmarkedGameObjects = computed(() => {
  return bookmarkedGames.value
    .map(gameId => gamesStore.getGameById(gameId))
    .filter(game => game !== undefined);
});

const notificationGameObjects = computed(() => {
  if (!preferencesStore.preferences) return [];

  return Object.keys(preferencesStore.preferences.eventNotificationPreferences)
    .filter(gameId => preferencesStore.preferences?.eventNotificationPreferences[gameId]?.enabled)
    .map(gameId => gamesStore.getGameById(gameId))
    .filter(game => game !== undefined);
});

onMounted(async () => {
  // Load games if not already loaded
  if (gamesStore.games.length === 0) {
    await gamesStore.loadGames();
  }

  // Subscribe to user's game ownerships
  if (user.value) {
    ownershipStore.subscribeToPlayerOwnerships(user.value.uid);
  }
});
</script>

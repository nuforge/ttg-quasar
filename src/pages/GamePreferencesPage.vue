<template>
    <q-page class="q-pa-md">
        <div class="q-mb-lg">
            <h4 class="text-h4 q-mb-sm">Game Preferences</h4>
            <p class="text-body1 text-grey-7">
                Manage your favorite games, bookmarks, and notification preferences
            </p>
        </div>

        <div class="row q-gutter-lg">
            <!-- Global Settings Card -->
            <div class="col-12 col-md-4">
                <q-card flat bordered>
                    <q-card-section>
                        <div class="text-h6 q-mb-md">
                            <q-icon name="mdi-cog" class="q-mr-sm" />
                            Global Settings
                        </div>

                        <div class="q-gutter-md">
                            <q-toggle v-model="globalSettings.emailNotifications" label="Email notifications"
                                :disable="saving" @update:model-value="updateGlobalSettings" />

                            <q-toggle v-model="globalSettings.pushNotifications" label="Browser notifications"
                                :disable="saving" @update:model-value="updateGlobalSettings" />

                            <div>
                                <q-field label="Default notification timing" stack-label borderless>
                                    <template v-slot:control>
                                        <q-slider v-model="globalSettings.defaultNotifyDaysBefore" :min="1" :max="14"
                                            :step="1" label
                                            :label-value="`${globalSettings.defaultNotifyDaysBefore} day${globalSettings.defaultNotifyDaysBefore !== 1 ? 's' : ''} before`"
                                            color="primary" @update:model-value="updateGlobalSettings"
                                            class="q-mt-md" />
                                    </template>
                                </q-field>
                            </div>
                        </div>
                    </q-card-section>
                </q-card>

                <!-- Statistics Card -->
                <q-card flat bordered class="q-mt-md">
                    <q-card-section>
                        <div class="text-h6 q-mb-md">
                            <q-icon name="mdi-chart-bar" class="q-mr-sm" />
                            Your Stats
                        </div>

                        <div class="q-gutter-md">
                            <div class="row items-center">
                                <q-icon name="mdi-star" color="secondary" size="sm" />
                                <span class="q-ml-sm">{{ favoriteGames.length }} favorite games</span>
                            </div>

                            <div class="row items-center">
                                <q-icon name="mdi-bookmark" color="accent" size="sm" />
                                <span class="q-ml-sm">{{ bookmarkedGames.length }} bookmarked games</span>
                            </div>

                            <div class="row items-center">
                                <q-icon name="mdi-bell" color="primary" size="sm" />
                                <span class="q-ml-sm">{{ notificationCount }} games with notifications</span>
                            </div>
                        </div>
                    </q-card-section>
                </q-card>
            </div>

            <!-- Games Lists -->
            <div class="col-12 col-md-8">
                <q-tabs v-model="activeTab" align="left" class="q-mb-md">
                    <q-tab name="favorites" label="Favorites" icon="mdi-star" />
                    <q-tab name="bookmarks" label="Bookmarks" icon="mdi-bookmark" />
                    <q-tab name="notifications" label="Notifications" icon="mdi-bell" />
                </q-tabs>

                <q-tab-panels v-model="activeTab" animated>
                    <!-- Favorites Tab -->
                    <q-tab-panel name="favorites">
                        <GamePreferencesList :games="favoriteGameObjects" :loading="gamesLoading" type="favorites"
                            empty-icon="mdi-star-off" empty-title="No favorite games yet"
                            empty-message="Games you mark as favorites will appear here"
                            @toggle="handleToggleFavorite" />
                    </q-tab-panel>

                    <!-- Bookmarks Tab -->
                    <q-tab-panel name="bookmarks">
                        <GamePreferencesList :games="bookmarkedGameObjects" :loading="gamesLoading" type="bookmarks"
                            empty-icon="mdi-bookmark-off" empty-title="No bookmarked games yet"
                            empty-message="Games you bookmark will appear here" @toggle="handleToggleBookmark" />
                    </q-tab-panel>

                    <!-- Notifications Tab -->
                    <q-tab-panel name="notifications">
                        <GamePreferencesList :games="notificationGameObjects" :loading="gamesLoading"
                            type="notifications" empty-icon="mdi-bell-off" empty-title="No notification preferences set"
                            empty-message="Games with event notifications enabled will appear here"
                            @toggle="handleToggleNotifications" @configure="handleConfigureNotifications" />
                    </q-tab-panel>
                </q-tab-panels>
            </div>
        </div>
    </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useUserPreferencesStore } from 'src/stores/user-preferences-store';
import { useGamesFirebaseStore } from 'src/stores/games-firebase-store';
import GamePreferencesList from 'src/components/GamePreferencesList.vue';

const $q = useQuasar();
const preferencesStore = useUserPreferencesStore();
const gamesStore = useGamesFirebaseStore();

// State
const activeTab = ref('favorites');
const saving = ref(false);

// Computed
const favoriteGames = computed(() => preferencesStore.favoriteGames);
const bookmarkedGames = computed(() => preferencesStore.bookmarkedGames);
const gamesLoading = computed(() => gamesStore.loading);

const globalSettings = ref({
    emailNotifications: true,
    pushNotifications: true,
    defaultNotifyDaysBefore: 3,
});

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

// Methods
const updateGlobalSettings = async () => {
    if (saving.value) return;

    saving.value = true;
    try {
        await preferencesStore.updateGlobalSettings(globalSettings.value);
        $q.notify({
            type: 'positive',
            message: 'Settings updated successfully',
            position: 'top',
        });
    } catch {
        $q.notify({
            type: 'negative',
            message: 'Failed to update settings',
            position: 'top',
        });
    } finally {
        saving.value = false;
    }
};

const handleToggleFavorite = async (gameId: string) => {
    try {
        await preferencesStore.toggleFavorite(gameId);
    } catch {
        $q.notify({
            type: 'negative',
            message: 'Failed to update favorites',
            position: 'top',
        });
    }
};

const handleToggleBookmark = async (gameId: string) => {
    try {
        await preferencesStore.toggleBookmark(gameId);
    } catch {
        $q.notify({
            type: 'negative',
            message: 'Failed to update bookmarks',
            position: 'top',
        });
    }
};

const handleToggleNotifications = async (gameId: string) => {
    try {
        await preferencesStore.toggleEventNotifications(gameId);
    } catch {
        $q.notify({
            type: 'negative',
            message: 'Failed to update notifications',
            position: 'top',
        });
    }
};

const handleConfigureNotifications = (gameId: string) => {
    const currentSettings = preferencesStore.getEventNotificationSettings(gameId);

    $q.dialog({
        title: 'Configure Notifications',
        message: 'How many days before events should we notify you?',
        prompt: {
            model: (currentSettings?.notifyDaysBefore || globalSettings.value.defaultNotifyDaysBefore).toString(),
            type: 'number',
        },
        cancel: true,
    }).onOk((days: string) => {
        void (async () => {
            try {
                const notifyDaysBefore = parseInt(days, 10) || 3;
                await preferencesStore.toggleEventNotifications(gameId, {
                    notifyDaysBefore,
                    notifyOnNewEvents: true,
                    notifyOnUpdates: true,
                });
                $q.notify({
                    type: 'positive',
                    message: 'Notification settings updated',
                    position: 'top',
                });
            } catch {
                $q.notify({
                    type: 'negative',
                    message: 'Failed to update notification settings',
                    position: 'top',
                });
            }
        })();
    });
};

// Watchers
watch(
    () => preferencesStore.globalSettings,
    (newSettings) => {
        if (newSettings) {
            globalSettings.value = { ...newSettings };
        }
    },
    { immediate: true, deep: true }
);

onMounted(async () => {
    // Load games if not already loaded
    if (gamesStore.games.length === 0) {
        await gamesStore.loadGames();
    }
});
</script>

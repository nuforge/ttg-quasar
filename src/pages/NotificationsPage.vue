<template>
    <q-page class="q-pa-md">
        <div class="q-mb-lg">
            <h4 class="text-h4 q-mb-sm">Notifications</h4>
            <p class="text-body1 text-grey-7">
                Stay updated on events for your favorite games
            </p>
        </div>

        <!-- Filter and Actions Bar -->
        <q-card flat bordered class="q-mb-lg">
            <q-card-section class="row items-center justify-between q-py-sm">
                <div class="row items-center q-gutter-sm">
                    <q-btn-toggle v-model="filter" toggle-color="primary" :options="[
                        { label: 'All', value: 'all' },
                        { label: 'Unread', value: 'unread' },
                        { label: 'Events', value: 'events' },
                        { label: 'Reminders', value: 'reminders' }
                    ]" dense />

                    <q-select v-if="favoriteGames.length > 0" v-model="gameFilter" :options="gameFilterOptions"
                        label="Filter by game" dense outlined clearable style="min-width: 200px"
                        @update:model-value="loadFilteredNotifications" />
                </div>

                <div class="row items-center q-gutter-sm">
                    <q-chip v-if="unreadCount > 0" :label="`${unreadCount} unread`" color="primary" text-color="white"
                        size="sm" />

                    <q-btn v-if="unreadCount > 0" flat dense label="Mark all read" icon="mdi-email-mark-as-unread"
                        @click="markAllAsRead" :loading="markingAllRead" />

                    <q-btn flat dense icon="refresh" @click="refreshNotifications" :loading="loading" />
                </div>
            </q-card-section>
        </q-card>

        <!-- Loading State -->
        <div v-if="loading && notifications.length === 0" class="text-center q-pa-xl">
            <q-spinner size="lg" color="primary" />
            <div class="q-mt-md text-body1">Loading notifications...</div>
        </div>

        <!-- Empty State -->
        <q-card v-else-if="filteredNotifications.length === 0" flat bordered class="text-center q-pa-xl">
            <q-icon name="mdi-bell-off" size="64px" color="grey-5" />
            <h6 class="text-h6 q-mt-md q-mb-sm">No notifications</h6>
            <p class="text-body2 text-grey-6">
                <template v-if="filter === 'unread'">
                    You have no unread notifications.
                </template>
                <template v-else>
                    You'll receive notifications here when events are created for your favorite games.
                </template>
            </p>
            <q-btn flat color="primary" label="Browse Games" to="/games" class="q-mt-md" />
        </q-card>

        <!-- Notifications List -->
        <q-list v-else bordered separator>
            <template v-for="notification in filteredNotifications" :key="notification.id">
                <q-item clickable :class="{ 'bg-blue-1': !notification.read }"
                    @click="handleNotificationClick(notification)">
                    <q-item-section avatar>
                        <q-avatar :color="getNotificationColor(notification.notificationType)" text-color="white"
                            size="md">
                            <q-icon :name="getNotificationIcon(notification.notificationType)" />
                        </q-avatar>
                    </q-item-section>

                    <q-item-section>
                        <q-item-label class="text-weight-medium text-h6">
                            {{ notification.gameTitle }}
                        </q-item-label>
                        <q-item-label class="text-subtitle1 q-mt-xs">
                            {{ notification.eventTitle }}
                        </q-item-label>
                        <q-item-label caption class="text-body2 q-mt-xs">
                            {{ notification.message }}
                        </q-item-label>
                        <div class="row items-center q-gutter-sm q-mt-xs">
                            <q-chip :label="getNotificationTypeLabel(notification.notificationType)"
                                :color="getNotificationColor(notification.notificationType)" text-color="white"
                                size="sm" dense />
                            <span class="text-caption text-grey-6">
                                {{ formatTime(notification.createdAt) }}
                            </span>
                        </div>
                    </q-item-section>

                    <q-item-section side top>
                        <div class="column items-end q-gutter-xs">
                            <q-icon v-if="!notification.read" name="mdi-circle" color="primary" size="sm" />

                            <q-btn flat dense round size="sm" icon="mdi-close"
                                @click.stop="dismissNotification(notification)" />
                        </div>
                    </q-item-section>
                </q-item>
            </template>
        </q-list>

        <!-- Load More Button -->
        <div v-if="hasMore" class="text-center q-mt-lg">
            <q-btn flat color="primary" label="Load More" @click="loadMoreNotifications" :loading="loadingMore" />
        </div>
    </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { date } from 'quasar';
import { useGameNotificationsStore } from 'src/stores/game-notifications-store';
import { useUserPreferencesStore } from 'src/stores/user-preferences-store';
import { useGamesFirebaseStore } from 'src/stores/games-firebase-store';
import type { GameEventNotification } from 'src/services/game-event-notification-service';
import { createGameUrl } from 'src/utils/slug';

const router = useRouter();
const notificationsStore = useGameNotificationsStore();
const preferencesStore = useUserPreferencesStore();
const gamesStore = useGamesFirebaseStore();

// State
const filter = ref<'all' | 'unread' | 'events' | 'reminders'>('all');
const gameFilter = ref<string | null>(null);
const markingAllRead = ref(false);
const loadingMore = ref(false);
const hasMore = ref(false);

// Computed
const notifications = computed(() => notificationsStore.notifications);
const unreadCount = computed(() => notificationsStore.unreadCount);
const loading = computed(() => notificationsStore.loading);
const favoriteGames = computed(() => preferencesStore.favoriteGames);

const filteredNotifications = computed(() => {
    let filtered = notifications.value;

    // Filter by read status
    if (filter.value === 'unread') {
        filtered = filtered.filter(n => !n.read);
    } else if (filter.value === 'events') {
        filtered = filtered.filter(n => ['new_event', 'event_update'].includes(n.notificationType));
    } else if (filter.value === 'reminders') {
        filtered = filtered.filter(n => n.notificationType === 'event_reminder');
    }

    // Filter by game
    if (gameFilter.value) {
        filtered = filtered.filter(n => n.gameId === gameFilter.value);
    }

    return filtered;
});

const gameFilterOptions = computed(() => {
    const uniqueGames = new Map<string, string>();

    notifications.value.forEach(n => {
        uniqueGames.set(n.gameId, n.gameTitle);
    });

    return Array.from(uniqueGames.entries()).map(([gameId, gameTitle]) => ({
        label: gameTitle,
        value: gameId,
    }));
});

// Methods
const refreshNotifications = async () => {
    await notificationsStore.loadNotifications();
};

const loadFilteredNotifications = async () => {
    const options: { unreadOnly?: boolean; gameId?: string } = {}; if (filter.value === 'unread') {
        options.unreadOnly = true;
    }

    if (gameFilter.value) {
        options.gameId = gameFilter.value;
    }

    await notificationsStore.loadNotifications(options);
};

const loadMoreNotifications = () => {
    loadingMore.value = true;
    // Implementation would depend on pagination support in the service
    loadingMore.value = false;
}; const markAllAsRead = async () => {
    markingAllRead.value = true;
    try {
        await notificationsStore.markAllAsRead();
    } catch (error) {
        console.error('Failed to mark all as read:', error);
    } finally {
        markingAllRead.value = false;
    }
};

const handleNotificationClick = async (notification: GameEventNotification) => {
    if (!notification.read && notification.id) {
        await notificationsStore.markAsRead(notification.id);
    }

    // Find the game to get proper SEO URL
    const game = gamesStore.games.find(g => g.legacyId === parseInt(notification.gameId));
    if (game) {
        void router.push(createGameUrl(game.id, game.title));
    } else {
        void router.push(`/games/${notification.gameId}`); // Fallback
    }
};

const dismissNotification = async (notification: GameEventNotification) => {
    if (notification.id) {
        await notificationsStore.markAsRead(notification.id);
    }
};

const getNotificationIcon = (type: string) => {
    switch (type) {
        case 'new_event':
            return 'mdi-calendar-plus';
        case 'event_update':
            return 'mdi-calendar-edit';
        case 'event_reminder':
            return 'mdi-calendar-clock';
        default:
            return 'mdi-bell';
    }
};

const getNotificationColor = (type: string) => {
    switch (type) {
        case 'new_event':
            return 'positive';
        case 'event_update':
            return 'warning';
        case 'event_reminder':
            return 'info';
        default:
            return 'grey';
    }
};

const getNotificationTypeLabel = (type: string) => {
    switch (type) {
        case 'new_event':
            return 'New Event';
        case 'event_update':
            return 'Event Update';
        case 'event_reminder':
            return 'Reminder';
        default:
            return 'Notification';
    }
};

const formatTime = (timestamp: unknown) => {
    if (!timestamp) return '';

    const notificationDate = (timestamp as { toDate?: () => Date }).toDate?.() || new Date(timestamp as string | number | Date);
    const now = new Date();
    const diffMs = now.getTime() - notificationDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.formatDate(notificationDate, 'MMM D, YYYY');
};

// Watch for filter changes
watch([filter, gameFilter], () => {
    void loadFilteredNotifications();
});

onMounted(() => {
    void refreshNotifications();
});
</script>

<style scoped>
.q-item.bg-blue-1 {
    background-color: rgba(33, 150, 243, 0.1);
}
</style>

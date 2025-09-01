<template>
    <q-btn flat round icon="mdi-bell" :class="{ 'text-primary': hasUnread }">
        <q-badge v-if="unreadCount > 0" floating color="red"
            :label="unreadCount > 99 ? '99+' : unreadCount.toString()" />

        <q-menu>
            <q-card style="width: 350px; max-height: 400px;">
                <q-card-section class="row items-center justify-between q-pb-none">
                    <div class="text-h6">{{ $t('notifications.title') }}</div>
                    <div>
                        <q-btn v-if="hasUnread" flat dense size="sm" :label="$t('markAllRead')"
                            @click="markAllAsRead" />
                    </div>
                </q-card-section>

                <q-separator />

                <q-card-section v-if="loading" class="text-center q-pa-md">
                    <q-spinner size="md" />
                    <div class="q-mt-sm text-body2">{{ $t('loading') }}...</div>
                </q-card-section>

                <q-card-section v-else-if="notifications.length === 0" class="text-center q-pa-md text-grey-6">
                    <q-icon name="mdi-bell-off" size="md" class="q-mb-sm" />
                    <div>{{ $t('noNotifications') }}</div>
                </q-card-section>

                <q-scroll-area v-else style="height: 300px;">
                    <q-list>
                        <template v-for="notification in notifications" :key="notification.id">
                            <q-item clickable :class="{ 'bg-blue-1': !notification.read }"
                                @click="handleNotificationClick(notification)">
                                <q-item-section avatar>
                                    <q-avatar :color="getNotificationColor(notification.notificationType)"
                                        text-color="white" size="sm">
                                        <q-icon :name="getNotificationIcon(notification.notificationType)" />
                                    </q-avatar>
                                </q-item-section>

                                <q-item-section>
                                    <q-item-label class="text-weight-medium">
                                        {{ notification.gameTitle }}
                                    </q-item-label>
                                    <q-item-label caption lines="2">
                                        {{ notification.message }}
                                    </q-item-label>
                                    <q-item-label caption class="text-grey-6">
                                        {{ formatTime(notification.createdAt) }}
                                    </q-item-label>
                                </q-item-section>

                                <q-item-section side v-if="!notification.read">
                                    <q-icon name="mdi-circle" color="primary" size="xs" />
                                </q-item-section>
                            </q-item>
                            <q-separator inset="item" />
                        </template>
                    </q-list>
                </q-scroll-area>

                <q-separator />

                <q-card-actions align="center">
                    <q-btn flat dense size="sm" :label="$t('viewAll')" @click="$router.push('/notifications')" />
                </q-card-actions>
            </q-card>
        </q-menu>
    </q-btn>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { date } from 'quasar';
import { useGameNotificationsStore } from 'src/stores/game-notifications-store';
import type { GameEventNotification } from 'src/services/game-event-notification-service';
import { createGameUrl } from 'src/utils/slug';
import { useGamesFirebaseStore } from 'src/stores/games-firebase-store';

const router = useRouter();
const notificationsStore = useGameNotificationsStore();
const gamesStore = useGamesFirebaseStore();

// Computed properties
const notifications = computed(() => notificationsStore.notifications.slice(0, 10)); // Show latest 10
const unreadCount = computed(() => notificationsStore.unreadCount);
const hasUnread = computed(() => unreadCount.value > 0);
const loading = computed(() => notificationsStore.loading);

// Methods
const markAllAsRead = async () => {
    await notificationsStore.markAllAsRead();
};

const handleNotificationClick = async (notification: GameEventNotification) => {
    if (!notification.read && notification.id) {
        await notificationsStore.markAsRead(notification.id);
    }

    // Find the game to get proper URL
    const game = gamesStore.games.find(g => g.legacyId === parseInt(notification.gameId));
    if (game) {
        void router.push(createGameUrl(game.id, game.title));
    } else {
        void router.push(`/games/${notification.gameId}`); // Fallback
    }
}; const getNotificationIcon = (type: string) => {
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

    return date.formatDate(notificationDate, 'MMM D');
};

onMounted(() => {
    void notificationsStore.loadNotifications({ limit: 10 });
});
</script>

<style scoped>
.q-item.bg-blue-1 {
    background-color: rgba(33, 150, 243, 0.1);
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCurrentUser } from 'vuefire';
onMounted(async () => {
    // Data is already available via reactive Firebase listeners
    // No need to explicitly fetch
});
import { useEventsFirebaseStore } from 'src/stores/events-firebase-store';
import { useGamesFirebaseStore } from 'src/stores/games-firebase-store';
import { usePlayersFirebaseStore } from 'src/stores/players-firebase-store';
import { CalendarFeedService, type CalendarFeedFilters } from 'src/services/calendar-feed-service';
import { Notify, copyToClipboard } from 'quasar';

defineOptions({
    name: 'CalendarSubscriptionManager',
});

const { t } = useI18n();
const currentUser = useCurrentUser();
const eventsStore = useEventsFirebaseStore();
const gamesStore = useGamesFirebaseStore();
const playersStore = usePlayersFirebaseStore();

// Component state
const loading = ref(false);
const selectedGames = ref<number[]>([]);
const filterOptions = ref({
    rsvpOnly: true,
    interestedOnly: false,
    upcomingOnly: true,
    dateRange: null as { start: Date; end: Date } | null
});

// Computed properties
const currentPlayer = computed(() => {
    if (!currentUser.value?.uid) return null;
    return playersStore.players.find(p => p.firebaseId === currentUser.value!.uid);
});

const availableGames = computed(() => {
    return gamesStore.games.filter(game => game.status === 'active').slice().sort((a, b) => a.title.localeCompare(b.title));
});

const appBaseUrl = computed(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.protocol}//${window.location.host}`;
});

const feedUrl = ref('');
const feedContent = ref('');
const showPreview = ref(false);

// Generate calendar feed
const generateFeed = () => {
    if (!currentPlayer.value) {
        Notify.create({
            type: 'negative',
            message: t('calendar.subscription.loginRequired'),
            position: 'top'
        });
        return;
    }

    loading.value = true;

    try {
        // Events are already available via reactive refs, no need to fetch

        const filters: CalendarFeedFilters = {
            ...(selectedGames.value.length > 0 && { gameIds: selectedGames.value }),
            rsvpOnly: filterOptions.value.rsvpOnly,
            interestedOnly: filterOptions.value.interestedOnly,
            upcomingOnly: filterOptions.value.upcomingOnly,
            ...(filterOptions.value.dateRange && { dateRange: filterOptions.value.dateRange })
        };

        const feedOptions = {
            userId: currentPlayer.value.id,
            filters,
            title: t('calendar.subscription.feedTitle'),
            description: t('calendar.subscription.feedDescription')
        };

        // Debug logging
        console.log('Calendar Feed Debug Info:', {
            totalEvents: eventsStore.events.length,
            userId: currentPlayer.value.id,
            filters,
            upcomingEvents: eventsStore.events.filter(e => e.status === 'upcoming').length,
            userRSVPs: eventsStore.events.map(e => {
                const rsvp = e.rsvps.find(r => r.playerId === currentPlayer.value?.id);
                return { eventId: e.id, title: e.title, rsvp: rsvp?.status || 'none' };
            })
        });

        feedContent.value = CalendarFeedService.generateCalendarFeed(
            eventsStore.events,
            gamesStore.games,
            feedOptions,
            appBaseUrl.value
        );

        // Debug the generated feed
        console.log('Generated Feed Content Length:', feedContent.value.length);
        console.log('Feed Content Preview:', feedContent.value.substring(0, 500));

        // Debug: Check for potential ICS formatting issues
        const lines = feedContent.value.split('\r\n');
        console.log('ICS Format Debug:', {
            totalLines: lines.length,
            hasBeginVCalendar: lines.includes('BEGIN:VCALENDAR'),
            hasEndVCalendar: lines.includes('END:VCALENDAR'),
            beginEventCount: lines.filter(l => l === 'BEGIN:VEVENT').length,
            endEventCount: lines.filter(l => l === 'END:VEVENT').length,
            firstFewLines: lines.slice(0, 10),
            lastFewLines: lines.slice(-5)
        });

        // Generate a feed URL (would be implemented with backend API)
        const feedId = `user-${currentPlayer.value.id}-${Date.now()}`;
        feedUrl.value = CalendarFeedService.generateFeedUrl(
            appBaseUrl.value,
            currentPlayer.value.id,
            feedId,
            false
        );

        showPreview.value = true;

        Notify.create({
            type: 'positive',
            message: t('calendar.subscription.generated'),
            position: 'top'
        });

    } catch (error) {
        console.error('Calendar feed generation error:', error);
        Notify.create({
            type: 'negative',
            message: t('calendar.subscription.error'),
            position: 'top'
        });
    } finally {
        loading.value = false;
    }
};

// Copy feed URL to clipboard
const copyFeedUrl = async () => {
    try {
        await copyToClipboard(feedUrl.value);
        Notify.create({
            type: 'positive',
            message: t('calendar.subscription.urlCopied'),
            position: 'top'
        });
    } catch (error) {
        console.error('Copy to clipboard failed:', error);
        Notify.create({
            type: 'negative',
            message: t('calendar.subscription.copyFailed'),
            position: 'top'
        });
    }
};

// Download feed file
const downloadFeed = () => {
    CalendarFeedService.downloadCalendarFeed(feedContent.value, 'ttg-events-subscription.ics');

    Notify.create({
        type: 'positive',
        message: t('calendar.subscription.downloaded'),
        position: 'top'
    });
};

// Generate data URI for direct calendar import
const getDataUri = () => {
    const base64Content = btoa(unescape(encodeURIComponent(feedContent.value)));
    return `data:text/calendar;base64,${base64Content}`;
};

// Copy data URI for calendar import
const copyDataUri = async () => {
    try {
        const dataUri = getDataUri();
        await copyToClipboard(dataUri);
        Notify.create({
            type: 'positive',
            message: 'Calendar data URI copied! Paste this into your calendar app to import events.',
            position: 'top'
        });
    } catch (error) {
        console.error('Copy data URI failed:', error);
        Notify.create({
            type: 'negative',
            message: 'Failed to copy data URI',
            position: 'top'
        });
    }
};

// Initialize component
onMounted(async () => {
    await Promise.all([
        eventsStore.subscribeToEvents(),
        gamesStore.subscribeToGames(),
        playersStore.fetchAllPlayers()
    ]);
});
</script>

<template>
    <q-card class="calendar-subscription-manager">
        <q-card-section>
            <div class="text-h6 q-mb-md">
                <q-icon name="mdi-calendar-sync" class="q-mr-sm" />
                {{ $t('calendar.subscription.title') }}
            </div>
            <p class="text-body2 text-grey-7 q-mb-lg">
                {{ $t('calendar.subscription.description') }}
            </p>

            <!-- Filter Options -->
            <div class="row q-col-gutter-md q-mb-lg">
                <!-- RSVP Filter -->
                <div class="col-12 col-sm-6">
                    <q-checkbox v-model="filterOptions.rsvpOnly" :label="$t('calendar.subscription.rsvpOnly')"
                        color="primary" />
                    <div class="text-caption text-grey-6 q-ml-lg">
                        {{ $t('calendar.subscription.rsvpOnlyDesc') }}
                    </div>
                </div>

                <!-- Interest Filter -->
                <div class="col-12 col-sm-6">
                    <q-checkbox v-model="filterOptions.interestedOnly"
                        :label="$t('calendar.subscription.interestedOnly')" color="primary" />
                    <div class="text-caption text-grey-6 q-ml-lg">
                        {{ $t('calendar.subscription.interestedOnlyDesc') }}
                    </div>
                </div>

                <!-- Upcoming Only -->
                <div class="col-12">
                    <q-checkbox v-model="filterOptions.upcomingOnly" :label="$t('calendar.subscription.upcomingOnly')"
                        color="primary" />
                    <div class="text-caption text-grey-6 q-ml-lg">
                        {{ $t('calendar.subscription.upcomingOnlyDesc') }}
                    </div>
                </div>
            </div>

            <!-- Game Selection -->
            <div class="q-mb-lg">
                <q-select v-model="selectedGames" :options="availableGames" option-value="legacyId" option-label="title"
                    multiple use-chips stack-label :label="$t('calendar.subscription.selectGames')" outlined clearable
                    class="q-mb-sm" />
                <div class="text-caption text-grey-6">
                    {{ $t('calendar.subscription.selectGamesDesc') }}
                </div>
            </div>

            <!-- Generate Button -->
            <div class="text-center q-mb-md">
                <q-btn color="primary" :label="$t('calendar.subscription.generate')" @click="generateFeed"
                    :loading="loading" :disable="!currentPlayer" icon="mdi-calendar-sync" unelevated class="q-px-xl" />
            </div>

            <!-- Generated Feed Section -->
            <div v-if="showPreview" class="q-mt-lg">
                <q-separator class="q-mb-lg" />

                <div class="text-subtitle1 q-mb-md">
                    <q-icon name="mdi-calendar-check" class="q-mr-sm" />
                    {{ $t('calendar.subscription.feedReady') }}
                </div>

                <!-- Feed URL -->
                <q-card flat bordered class="q-mb-md">
                    <q-card-section class="q-py-sm">
                        <div class="text-caption text-grey-6 q-mb-xs">
                            {{ $t('calendar.subscription.feedUrl') }}:
                        </div>
                        <div class="row items-center q-gutter-sm">
                            <div class="col text-body2 text-primary ellipsis">
                                {{ feedUrl }}
                            </div>
                            <q-btn icon="mdi-content-copy" size="sm" flat round @click="copyFeedUrl"
                                :title="$t('calendar.subscription.copyUrl')" />
                        </div>
                    </q-card-section>
                </q-card>

                <!-- Action Buttons -->
                <div class="row q-gutter-sm justify-center">
                    <q-btn color="secondary" :label="$t('calendar.subscription.download')" @click="downloadFeed"
                        icon="mdi-download" outline />
                    <q-btn color="accent" label="Copy Data URI" @click="copyDataUri" icon="mdi-calendar-import"
                        outline />
                    <q-btn color="primary" :label="$t('calendar.subscription.copyUrl')" @click="copyFeedUrl"
                        icon="mdi-link" outline />
                </div>

                <!-- Instructions -->
                <q-expansion-item :label="$t('calendar.subscription.howToUse')" icon="mdi-help-circle" class="q-mt-lg">
                    <q-card flat>
                        <q-card-section class="text-body2">
                            <div class="q-mb-md">
                                <strong>{{ $t('calendar.subscription.instructions.title') }}:</strong>
                            </div>

                            <q-list dense>
                                <q-item>
                                    <q-item-section avatar top>
                                        <q-icon name="mdi-google" color="red" />
                                    </q-item-section>
                                    <q-item-section>
                                        <q-item-label>{{ $t('calendar.subscription.instructions.google')
                                            }}</q-item-label>
                                        <q-item-label caption>{{ $t('calendar.subscription.instructions.googleDesc')
                                            }}</q-item-label>
                                    </q-item-section>
                                </q-item>

                                <q-item>
                                    <q-item-section avatar top>
                                        <q-icon name="mdi-microsoft-outlook" color="blue" />
                                    </q-item-section>
                                    <q-item-section>
                                        <q-item-label>{{ $t('calendar.subscription.instructions.outlook')
                                            }}</q-item-label>
                                        <q-item-label caption>{{ $t('calendar.subscription.instructions.outlookDesc')
                                            }}</q-item-label>
                                    </q-item-section>
                                </q-item>

                                <q-item>
                                    <q-item-section avatar top>
                                        <q-icon name="mdi-apple" color="grey-8" />
                                    </q-item-section>
                                    <q-item-section>
                                        <q-item-label>{{ $t('calendar.subscription.instructions.apple')
                                            }}</q-item-label>
                                        <q-item-label caption>{{ $t('calendar.subscription.instructions.appleDesc')
                                            }}</q-item-label>
                                    </q-item-section>
                                </q-item>
                            </q-list>
                        </q-card-section>
                    </q-card>
                </q-expansion-item>
            </div>
        </q-card-section>
    </q-card>
</template>

<style scoped>
.calendar-subscription-manager {
    max-width: 800px;
    margin: 0 auto;
}

.ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>

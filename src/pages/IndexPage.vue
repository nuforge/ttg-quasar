<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useGamesFirebaseStore } from 'src/stores/games-firebase-store';
import { useEventsFirebaseStore } from 'src/stores/events-firebase-store';
import { useUserPreferencesStore } from 'src/stores/user-preferences-store';
import { useCurrentUser } from 'src/composables/useFirebaseAuth';
import GameCard from 'src/components/GameCard.vue';
import EventCard from 'src/components/events/EventCard.vue';
import { type Game } from 'src/models/Game';
import { UserPreferencesAnalyzer } from 'src/services/user-preferences-analyzer';

const { t } = useI18n();
const router = useRouter();
const gamesStore = useGamesFirebaseStore();
const eventsStore = useEventsFirebaseStore();
const preferencesStore = useUserPreferencesStore();
const currentUser = useCurrentUser();

// Featured games state
const featuredGamesData = ref<Game[]>([]);

// Load data on mount
onMounted(async () => {
  // Load games first
  if (gamesStore.games.length === 0) {
    await gamesStore.loadGames();
  }

  // Load events from Firebase
  eventsStore.subscribeToEvents();

  // Load user preferences if authenticated
  if (currentUser.value) {
    await preferencesStore.loadPreferences();
  }

  // Load featured games with user data
  await loadFeaturedGames();
});

// Load featured games with personalization data
const loadFeaturedGames = async () => {
  try {
    const criteria = {
      count: 3,
      // Include user data if available for future personalization
      ...(currentUser.value && preferencesStore.preferences && {
        userFavorites: preferencesStore.favoriteGames,
        userBookmarks: preferencesStore.bookmarkedGames,
        upcomingEventsForUser: eventsStore.myEvents,
        allUpcomingEvents: eventsStore.upcomingEvents,
        // Calculate user genre preferences based on their favorites/bookmarks
        userGenrePreferences: getUserGenrePreferences(),
      }),
    };

    featuredGamesData.value = await gamesStore.getFeaturedGamesWithUserData(criteria);
  } catch (error) {
    console.error('Failed to load featured games:', error);
    // Fallback to basic featured games
    featuredGamesData.value = gamesStore.featuredGames;
  }
};

// Calculate user's preferred genres based on their game interactions
const getUserGenrePreferences = (): string[] => {
  if (!currentUser.value || !preferencesStore.preferences) {
    return [];
  }

  // Get actual game objects for favorites and bookmarks
  const favoriteGameObjects = preferencesStore.favoriteGames
    .map(gameId => gamesStore.getGameById(gameId))
    .filter((game): game is Game => game !== undefined);

  const bookmarkedGameObjects = preferencesStore.bookmarkedGames
    .map(gameId => gamesStore.getGameById(gameId))
    .filter((game): game is Game => game !== undefined);

  // Use analyzer to determine preferred genres
  return UserPreferencesAnalyzer.getPreferredGenres(favoriteGameObjects, bookmarkedGameObjects);
};

// Refresh featured games when user authentication or preferences change
const refreshFeaturedGames = async () => {
  await loadFeaturedGames();
};

// Watch for authentication changes to refresh featured games
watch(currentUser, () => {
  void refreshFeaturedGames();
});

// Watch for preference changes to refresh featured games
watch(
  () => preferencesStore.preferences,
  () => {
    if (currentUser.value) {
      void refreshFeaturedGames();
    }
  },
  { deep: true }
);// Featured content - uses personalized data when available
const featuredGames = computed(() => {
  // Use loaded personalized data if available, otherwise fallback to store's random selection
  return featuredGamesData.value.length > 0 ? featuredGamesData.value : gamesStore.featuredGames;
});

// Get upcoming events from Firebase store
const upcomingEvents = computed(() =>
  eventsStore.events
    .filter(event => event.status === 'upcoming')
    .sort((a, b) => {
      const dateA = a.getDateObject();
      const dateB = b.getDateObject();
      if (dateA === null || dateB === null) return 0;
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 3)
);

const navigateTo = async (path: string) => {
  await router.push(path);
};

const features = [
  {
    title: t('discoverGames'),
    icon: 'mdi-book-multiple',
    color: 'primary',
    description: t('discoverGamesDesc')
  },
  {
    title: t('joinEvents'),
    icon: 'mdi-calendar-month',
    color: 'secondary',
    description: t('joinEventsDesc')
  },
  {
    title: t('connectPlayers'),
    icon: 'mdi-account-group',
    color: 'tertiary',
    description: t('connectPlayersDesc')
  },
  {
    title: t('trackSessions'),
    icon: 'mdi-clock-outline',
    color: 'accent',
    description: t('trackSessionsDesc')
  }
];

const steps = [
  {
    step: 1,
    title: t('browseGames'),
    description: t('browseGamesStepDesc'),
    icon: 'mdi-magnify'
  },
  {
    step: 2,
    title: t('joinEventsStep'),
    description: t('joinEventsStepDesc'),
    icon: 'mdi-calendar-plus'
  },
  {
    step: 3,
    title: t('playGames'),
    description: t('playGamesDesc'),
    icon: 'mdi-gamepad-variant'
  }
];
</script>

<template>
  <div class="landing-page">
    <!-- Hero Section -->
    <section class="hero-section q-pa-md q-mb-lg">
      <q-parallax :height="300" src="/images/tabletop-hero.png">
        <div class="absolute-center text-center">
          <div class="text-h4 text-weight-bold text-primary hero-title">{{ t('lookingForGroup') }}</div>
          <div class="text-h5 q-mt-md text-white text-weight-medium">{{ $t('heroSubtitle') }}
          </div>
          <div class="q-mt-lg q-gutter-sm ">
            <q-btn size="md" color="primary" text-color="black" :label="$t('exploreGames')"
              @click="navigateTo('/games')" />
            <q-btn size="md" outline color="white" :label="$t('browseEvents')" @click="navigateTo('/events')" />
          </div>
        </div>
      </q-parallax>
    </section>

    <!-- Features Section -->
    <section class="features-section q-pa-md q-mb-lg">
      <div class="text-h2 text-center q-mb-lg">{{ t('whatWeOffer') }}</div>
      <div class="row q-col-gutter-md justify-center">
        <div v-for="feature in features" :key="feature.title" class="col-xs-12 col-sm-6 col-md-3">
          <q-card class="feature-card" bordered>
            <q-card-section class="text-center">
              <q-icon :name="feature.icon" :color="feature.color" size="4rem" />
              <div class="text-h6 q-mt-sm">{{ feature.title }}</div>
              <div class="q-mt-sm text-body1">{{ feature.description }}</div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </section>

    <!-- Featured Games Section -->
    <!--
      Displays personalized featured games based on:
      - User's favorite and bookmarked games
      - Games with upcoming events the user RSVPed to
      - Popular games with high RSVP rates
      - User's preferred genres (calculated from interaction history)
      - Recently added/updated games
      Falls back to random selection for non-authenticated users
    -->
    <section class="games-section q-pa-md q-mb-lg">
      <div class="section-header row items-center justify-between q-mb-md">
        <div class="text-h4">{{ $t('featuredGames') }}</div>
        <q-btn color="primary" outline :label="$t('viewAllGames')" @click="navigateTo('/games')" />
      </div>

      <div class="row q-col-gutter-md">
        <div v-for="game in featuredGames" :key="game.id" class="col-xs-12 col-sm-6 col-md-4">
          <GameCard :game="game" />
        </div>
      </div>
    </section>

    <!-- Upcoming Events Section -->
    <section class="events-section q-pa-md q-mb-lg">
      <div class="section-header row items-center justify-between q-mb-md">
        <div class="text-h4">{{ $t('upcomingEvents') }}</div>
        <q-btn color="secondary" outline :label="$t('viewAllEvents')" @click="navigateTo('/events')" />
      </div>

      <div class="row q-col-gutter-md">
        <div v-for="event in upcomingEvents" :key="event.id" class="col-xs-12 col-sm-6 col-md-4">
          <EventCard :event="event" />
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section class="how-it-works q-pa-md q-mb-lg">
      <div class="text-h4 text-center q-mb-lg">{{ $t('howItWorks') }}</div>

      <div class="row q-col-gutter-xl justify-center">
        <div v-for="item in steps" :key="item.step" class="col-xs-12 col-sm-4 text-center">
          <q-circular-progress :value="100" size="80px" :thickness="0.2" color="primary" track-color="grey-3"
            class="q-ma-md">
            <q-avatar size="60px" color="primary" text-color="white">
              <q-icon :name="item.icon" size="2rem" />
            </q-avatar>
          </q-circular-progress>
          <div class="text-h5 q-mt-md">{{ item.title }}</div>
          <div class="q-mt-sm text-body1">{{ item.description }}</div>
        </div>
      </div>
    </section>

    <!-- Call To Action -->
    <section class="cta-section q-pa-xl q-mb-md text-center ">
      <q-card class="bg-surface ">
        <q-card-section>
          <div class="text-h4 q-mb-md">{{ t('readyToFindGame') }}</div>
          <div class="text-h6 q-mb-lg">{{ t('joinCommunityToday') }}</div>
          <q-btn color="primary" text-color="black" push :label="$t('getStarted')" size="lg"
            @click="navigateTo('/games')" />
        </q-card-section>
      </q-card>
    </section>

    <!-- Community Numbers -->
    <section class="stats-section q-pa-md q-mb-xl text-center">
      <div class="row q-col-gutter-md">
        <div class="col-xs-12 col-sm-4">
          <div class="text-h3 text-primary">{{ gamesStore.approvedGames.length }}+</div>
          <div class="text-subtitle1">{{ t('gamesAvailable') }}</div>
        </div>
        <div class="col-xs-12 col-sm-4">
          <div class="text-h3 text-secondary">{{ eventsStore.events.length }}+</div>
          <div class="text-subtitle1">{{ t('eventsOrganized') }}</div>
        </div>
        <div class="col-xs-12 col-sm-4">
          <div class="text-h3 text-tertiary">100+</div>
          <div class="text-subtitle1">{{ t('activePlayers') }}</div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.landing-page {
  max-width: 1200px;
  margin: 0 auto;
}

.hero-title {
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
}

.feature-card {
  height: 100%;
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.section-header {
  border-bottom: 2px solid #f2f2f2;
  padding-bottom: 8px;
}

.stats-section {
  background-color: rgba(170, 241, 131, 0.1);
  border-radius: 8px;
  padding: 2rem !important;
}

.cta-section .q-card {
  border-radius: 8px;
}

/* Add responsive adjustments */
@media (max-width: 599px) {
  .hero-section .text-h2 {
    font-size: 2rem;
  }

  .hero-section .text-h5 {
    font-size: 1rem;
  }
}
</style>

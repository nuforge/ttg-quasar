<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useGamesFirebaseStore } from 'src/stores/games-firebase-store';
import { useEventsFirebaseStore } from 'src/stores/events-firebase-store';
import { useUserPreferencesStore } from 'src/stores/user-preferences-store';
import { useCurrentUser } from 'vuefire';
import GameCard from 'src/components/GameCard.vue';
import EventCard from 'src/components/events/EventCard.vue';
import { type Game } from 'src/models/Game';
import { UserPreferencesAnalyzer } from 'src/services/user-preferences-analyzer';

const router = useRouter();
const gamesStore = useGamesFirebaseStore();
const eventsStore = useEventsFirebaseStore();
const preferencesStore = useUserPreferencesStore();
const currentUser = useCurrentUser();

// Featured games state
const featuredGamesData = ref<Game[]>([]);

// Load data on mount
onMounted(async () => {
  console.log('🚀 IndexPage mounted, starting data load...');

  // Load games first
  if (gamesStore.games.length === 0) {
    console.log('📚 Loading games from Firebase...');
    await gamesStore.loadGames();
    console.log('📚 Games loaded:', gamesStore.games.length, 'total games');
    console.log('✅ Approved games:', gamesStore.approvedGames.length);
  } else {
    console.log('📚 Games already loaded:', gamesStore.games.length, 'total games');
    console.log('✅ Approved games:', gamesStore.approvedGames.length);
  }

  // Load events from Firebase
  console.log('📅 Subscribing to events...');
  eventsStore.subscribeToEvents();

  // Load user preferences if authenticated
  if (currentUser.value) {
    console.log('👤 User authenticated, loading preferences...');
    await preferencesStore.loadPreferences();
  } else {
    console.log('👤 No user authenticated');
  }

  // Load featured games with user data
  console.log('🎮 Loading featured games...');
  await loadFeaturedGames();
  console.log('🎮 Featured games load complete');
});

// Load featured games with personalization data
const loadFeaturedGames = async () => {
  try {
    console.log('🎮 Loading featured games...');
    console.log('Games available:', gamesStore.games.length);
    console.log('Approved games:', gamesStore.approvedGames.length);

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

    console.log('Featured games criteria:', criteria);
    featuredGamesData.value = await gamesStore.getFeaturedGamesWithUserData(criteria);
    console.log('Featured games loaded:', featuredGamesData.value.length);
  } catch (error) {
    console.error('Failed to load featured games:', error);
    // Fallback to basic featured games
    featuredGamesData.value = gamesStore.featuredGames;
    console.log('Using fallback featured games:', featuredGamesData.value.length);
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
  const result = featuredGamesData.value.length > 0 ? featuredGamesData.value : gamesStore.featuredGames;
  console.log('🎯 Featured games computed:', result.length, result.map(g => g.title));
  return result;
});

// Get upcoming events from Firebase store
const upcomingEvents = computed(() =>
  eventsStore.events
    .filter(event => event.status === 'upcoming')
    .sort((a, b) => a.getDateObject().getTime() - b.getDateObject().getTime())
    .slice(0, 3)
);

const navigateTo = async (path: string) => {
  await router.push(path);
};

const features = [
  {
    title: 'Discover Games',
    icon: 'mdi-book-multiple',
    color: 'primary',
    description: 'Browse our collection of tabletop games with detailed information.'
  },
  {
    title: 'Join Events',
    icon: 'mdi-calendar-month',
    color: 'secondary',
    description: 'Find and RSVP to game sessions in your area.'
  },
  {
    title: 'Connect Players',
    icon: 'mdi-account-group',
    color: 'tertiary',
    description: 'Meet other tabletop enthusiasts and form gaming groups.'
  },
  {
    title: 'Track Sessions',
    icon: 'mdi-clock-outline',
    color: 'accent',
    description: 'Keep track of your gaming history and upcoming events.'
  }
];

const steps = [
  {
    step: 1,
    title: 'Browse Games',
    description: 'Explore our collection of tabletop games and find your favorites.',
    icon: 'mdi-magnify'
  },
  {
    step: 2,
    title: 'Join Events',
    description: 'RSVP to upcoming game sessions or create your own.',
    icon: 'mdi-calendar-plus'
  },
  {
    step: 3,
    title: 'Play Games',
    description: 'Meet up with other players and enjoy your tabletop experience!',
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
          <div class="text-h4 text-weight-bold text-primary hero-title">Looking For Group</div>
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
      <div class="text-h2 text-center q-mb-lg">What We Offer</div>
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
          <div class="text-h4 q-mb-md">Ready to Find Your Next Game?</div>
          <div class="text-h6 q-mb-lg">Join our community of tabletop gamers today!</div>
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
          <div class="text-subtitle1">Games Available</div>
        </div>
        <div class="col-xs-12 col-sm-4">
          <div class="text-h3 text-secondary">{{ eventsStore.events.length }}+</div>
          <div class="text-subtitle1">Events Organized</div>
        </div>
        <div class="col-xs-12 col-sm-4">
          <div class="text-h3 text-tertiary">100+</div>
          <div class="text-subtitle1">Active Players</div>
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

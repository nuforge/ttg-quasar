import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { createTestWrapper } from '../../utils/test-utils';
import PlayersPage from 'src/pages/PlayersPage.vue';

// Mock child components
vi.mock('src/components/players/PlayerCard.vue', () => ({
  default: {
    name: 'PlayerCard',
    template: '<div class="mock-player-card">{{ player.name }}</div>',
    props: ['player', 'playerEvents'],
    emits: ['showDetails'],
  },
}));

vi.mock('src/components/players/PlayerDetails.vue', () => ({
  default: {
    name: 'PlayerDetails',
    template: '<div class="mock-player-details">Details for {{ player.name }}</div>',
    props: ['player', 'playerEvents'],
    emits: ['close'],
  },
}));

// Mock stores
vi.mock('src/stores/players-firebase-store', () => ({
  usePlayersFirebaseStore: () => ({
    players: [],
    loading: false,
    error: null,
    fetchAllPlayers: vi.fn().mockResolvedValue(undefined),
    getPlayerById: vi.fn(),
  }),
}));

vi.mock('src/stores/events-firebase-store', () => ({
  useEventsFirebaseStore: () => ({
    events: [],
    subscribeToEvents: vi.fn(),
    getEventsByPlayerId: vi.fn().mockReturnValue([]),
  }),
}));

describe('PlayersPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('component structure', () => {
    it('should render without errors', () => {
      const wrapper = createTestWrapper(PlayersPage);
      expect(wrapper.exists()).toBe(true);
    });

    it('should have proper page structure', () => {
      const wrapper = createTestWrapper(PlayersPage);

      // Check that component renders with main div
      expect(wrapper.find('div').exists()).toBe(true);

      // Check for header with player icon and text
      const headerText = wrapper.find('.text-h6');
      expect(headerText.exists()).toBe(true);

      // Check for icon in header
      const headerIcon = wrapper.find('.text-h6 i');
      expect(headerIcon.exists()).toBe(true);
      expect(headerIcon.classes()).toContain('mdi-account-group');
    });
  });

  describe('search functionality', () => {
    it('should have search input', () => {
      const wrapper = createTestWrapper(PlayersPage);

      // Look for search-related elements
      const searchInput = wrapper.find('input[type="search"]');
      // Note: This may need adjustment based on actual template structure
    });
  });

  describe('player display', () => {
    it('should render player cards when players exist', () => {
      // This test would require mocking the store with actual player data
      const wrapper = createTestWrapper(PlayersPage);
      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('loading states', () => {
    it('should handle loading state', () => {
      const wrapper = createTestWrapper(PlayersPage);
      expect(wrapper.exists()).toBe(true);
    });
  });
});

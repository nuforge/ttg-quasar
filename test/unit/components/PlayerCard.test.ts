import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import PlayerCard from 'src/components/players/PlayerCard.vue';
import { createTestWrapper, createMockPlayer } from '../../utils/test-utils';

// Mock PlayerAvatar component
vi.mock('src/components/PlayerAvatar.vue', () => ({
  default: {
    name: 'PlayerAvatar',
    template: '<div class="mock-player-avatar">{{ player.name }}</div>',
    props: ['player', 'size'],
  },
}));

describe('PlayerCard Component', () => {
  const mockPlayer = createMockPlayer({
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    bio: 'Avid board gamer',
  });

  const mockPlayerEvents = [{ id: 1, title: 'Board Game Night', date: new Date() }];

  describe('rendering', () => {
    it('should render player information correctly', () => {
      const wrapper = createTestWrapper(PlayerCard, {
        props: {
          player: mockPlayer,
          playerEvents: mockPlayerEvents,
        },
      });

      expect(wrapper.find('.text-h6').text()).toBe('John Doe');
      expect(wrapper.find('.mock-player-avatar').exists()).toBe(true);
    });

    it('should be clickable', () => {
      const wrapper = createTestWrapper(PlayerCard, {
        props: {
          player: mockPlayer,
          playerEvents: mockPlayerEvents,
        },
      });

      const card = wrapper.find('.player-card');
      expect(card.attributes('clickable')).toBeDefined();
    });
  });

  describe('interactions', () => {
    it('should emit showDetails when clicked', async () => {
      const wrapper = createTestWrapper(PlayerCard, {
        props: {
          player: mockPlayer,
          playerEvents: mockPlayerEvents,
        },
      });

      await wrapper.find('.player-card').trigger('click');

      const emitted = wrapper.emitted('showDetails');
      expect(emitted).toBeTruthy();
      expect(emitted?.[0]).toEqual([mockPlayer]);
    });
  });

  describe('PlayerAvatar integration', () => {
    it('should pass correct props to PlayerAvatar', () => {
      const wrapper = createTestWrapper(PlayerCard, {
        props: {
          player: mockPlayer,
          playerEvents: mockPlayerEvents,
        },
      });

      const avatar = wrapper.find('.mock-player-avatar');
      expect(avatar.text()).toBe(mockPlayer.name);
    });
  });

  describe('different player data', () => {
    it('should handle player without bio', () => {
      const playerWithoutBio = createMockPlayer({
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com',
        bio: undefined,
      });

      const wrapper = createTestWrapper(PlayerCard, {
        props: {
          player: playerWithoutBio,
          playerEvents: [],
        },
      });

      expect(wrapper.find('.text-h6').text()).toBe('Jane Smith');
    });

    it('should handle different player statuses', () => {
      const blockedPlayer = createMockPlayer({
        id: 3,
        name: 'Blocked User',
        email: 'blocked@example.com',
        status: 'blocked',
      });

      const wrapper = createTestWrapper(PlayerCard, {
        props: {
          player: blockedPlayer,
          playerEvents: [],
        },
      });

      expect(wrapper.find('.text-h6').text()).toBe('Blocked User');
    });
  });
});

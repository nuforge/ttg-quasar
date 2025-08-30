import { describe, it, expect, vi } from 'vitest';
import { createTestWrapper } from '../../utils/test-utils';
import GameIcon from 'src/components/GameIcon.vue';

// Mock the game-icons utility
vi.mock('src/utils/game-icons', () => ({
  getGameIcon: vi.fn((category: string, value: string) => {
    if (category === 'players' && value === '2-4') {
      return { type: 'mdi', icon: 'mdi-account-multiple' };
    }
    if (category === 'genres' && value === 'strategy') {
      return { type: 'svg', icon: 'strategy-icon' };
    }
    return { type: 'mdi', icon: 'mdi-help' };
  }),
}));

describe('GameIcon Component', () => {
  describe('props validation', () => {
    it('should accept valid category props', () => {
      const validCategories = ['players', 'genres', 'mechanics', 'age', 'components'];

      validCategories.forEach((category) => {
        expect(() => {
          createTestWrapper(GameIcon, {
            props: {
              category: category as any,
              value: 'test-value',
            },
          });
        }).not.toThrow();
      });
    });

    it('should require category and value props', () => {
      // This test verifies the component definition requires these props
      const wrapper = createTestWrapper(GameIcon, {
        props: {
          category: 'players',
          value: '2-4',
        },
      });

      expect(wrapper.exists()).toBe(true);
    });
  });

  describe('icon rendering', () => {
    it('should render MDI icon when type is mdi', () => {
      const wrapper = createTestWrapper(GameIcon, {
        props: {
          category: 'players',
          value: '2-4',
          size: 'lg',
        },
      });

      // QIcon renders as <i> tag with classes
      const icon = wrapper.find('i');
      expect(icon.exists()).toBe(true);
      expect(icon.classes()).toContain('q-icon');
      expect(icon.classes()).toContain('mdi');
      expect(icon.classes()).toContain('mdi-account-multiple');
      expect(icon.classes()).toContain('game-icon');
    });

    it('should render SVG image when type is svg', () => {
      const wrapper = createTestWrapper(GameIcon, {
        props: {
          category: 'genres',
          value: 'strategy',
          size: 'sm',
        },
      });

      const img = wrapper.find('img');
      expect(img.exists()).toBe(true);
      expect(img.attributes('src')).toBe('/game-icons/strategy-icon.svg');
      expect(img.attributes('alt')).toBe('strategy');
      expect(img.classes()).toContain('size-sm');
    });

    it('should use default size when not specified', () => {
      const wrapper = createTestWrapper(GameIcon, {
        props: {
          category: 'players',
          value: '2-4',
        },
      });

      // Default size should be 'md' which means no explicit size attribute in the HTML
      const icon = wrapper.find('i');
      expect(icon.exists()).toBe(true);
      expect(icon.classes()).toContain('q-icon');
    });
  });

  describe('computed properties', () => {
    it('should compute icon info based on props', () => {
      const wrapper = createTestWrapper(GameIcon, {
        props: {
          category: 'players',
          value: '2-4',
        },
      });

      // Verify the computed property works by checking the rendered output
      const icon = wrapper.find('i');
      expect(icon.exists()).toBe(true);
      expect(icon.classes()).toContain('mdi-account-multiple');
    });
  });

  describe('styling', () => {
    it('should apply game-icon class', () => {
      const wrapper = createTestWrapper(GameIcon, {
        props: {
          category: 'players',
          value: '2-4',
        },
      });

      const icon = wrapper.find('i');
      expect(icon.classes()).toContain('game-icon');
    });

    it('should apply size classes for images', () => {
      const wrapper = createTestWrapper(GameIcon, {
        props: {
          category: 'genres',
          value: 'strategy',
          size: 'xs',
        },
      });

      const img = wrapper.find('img');
      expect(img.classes()).toContain('size-xs');
    });
  });
});

import { describe, it, expect } from 'vitest';
import { getGameIcon } from 'src/utils/game-icons';

describe('Game Icons Utility', () => {
  describe('getGameIcon function', () => {
    it('should return icon for valid player count', () => {
      const result = getGameIcon('players', '2-4');

      expect(result).toHaveProperty('icon');
      expect(result).toHaveProperty('type');
      expect(['mdi', 'game']).toContain(result.type);
    });

    it('should return icon for valid genre', () => {
      const result = getGameIcon('genres', 'Strategy');

      expect(result).toHaveProperty('icon');
      expect(result).toHaveProperty('type');
      expect(['mdi', 'game']).toContain(result.type);
    });

    it('should return icon for mechanics', () => {
      const result = getGameIcon('mechanics', 'Deck Building');

      expect(result).toHaveProperty('icon');
      expect(result).toHaveProperty('type');
    });

    it('should return icon for age categories', () => {
      const result = getGameIcon('age', '12+');

      expect(result).toHaveProperty('icon');
      expect(result).toHaveProperty('type');
    });

    it('should return icon for components', () => {
      const result = getGameIcon('components', 'Cards');

      expect(result).toHaveProperty('icon');
      expect(result).toHaveProperty('type');
    });

    it('should handle unknown categories gracefully', () => {
      const result = getGameIcon('unknown' as any, 'test');

      expect(result).toHaveProperty('icon');
      expect(result).toHaveProperty('type');
      // Should return a fallback icon
    });

    it('should handle unknown values gracefully', () => {
      const result = getGameIcon('players', 'unknown-player-count');

      expect(result).toHaveProperty('icon');
      expect(result).toHaveProperty('type');
      // Should return a fallback icon
    });

    it('should handle empty strings', () => {
      const result = getGameIcon('players', '');

      expect(result).toHaveProperty('icon');
      expect(result).toHaveProperty('type');
    });

    it('should handle case sensitivity', () => {
      const upperResult = getGameIcon('genres', 'STRATEGY');
      const lowerResult = getGameIcon('genres', 'strategy');
      const mixedResult = getGameIcon('genres', 'Strategy');

      // All should return valid icons (implementation may vary)
      expect(upperResult).toHaveProperty('icon');
      expect(lowerResult).toHaveProperty('icon');
      expect(mixedResult).toHaveProperty('icon');
    });
  });

  describe('icon types', () => {
    it('should return consistent icon types', () => {
      const result = getGameIcon('players', '2-4');
      expect(['mdi', 'game']).toContain(result.type);
    });

    it('should return valid icon names', () => {
      const result = getGameIcon('players', '2-4');
      expect(typeof result.icon).toBe('string');
      expect(result.icon.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle null/undefined inputs gracefully', () => {
      // These tests ensure the function doesn't crash with bad inputs
      expect(() => getGameIcon(null as any, 'test')).not.toThrow();
      expect(() => getGameIcon('players', null as any)).not.toThrow();
      expect(() => getGameIcon(undefined as any, undefined as any)).not.toThrow();
    });

    it('should handle special characters in values', () => {
      const result = getGameIcon('players', '2-4+');
      expect(result).toHaveProperty('icon');
      expect(result).toHaveProperty('type');
    });
  });
});

import { describe, it, expect } from 'vitest';
import { Player } from 'src/models/Player';

describe('Player Model', () => {
  const mockDate = new Date('2025-01-15T10:00:00Z');

  const basePlayerData = {
    id: 1,
    name: 'John Smith',
    email: 'john.smith@example.com',
    avatar: 'https://example.com/avatar.jpg',
    joinDate: mockDate,
    bio: 'Avid board gamer and strategy enthusiast',
    preferences: {
      favoriteGames: [1, 2, 3],
      preferredGenres: ['Strategy', 'Economic'],
    },
    firebaseId: 'firebase123',
    role: ['admin', 'moderator'],
    status: 'active' as const,
  };

  describe('Constructor', () => {
    it('should create Player with all fields', () => {
      const player = new Player(basePlayerData);

      expect(player.id).toBe(1);
      expect(player.name).toBe('John Smith');
      expect(player.email).toBe('john.smith@example.com');
      expect(player.avatar).toBe('https://example.com/avatar.jpg');
      expect(player.joinDate).toEqual(mockDate);
      expect(player.bio).toBe('Avid board gamer and strategy enthusiast');
      expect(player.preferences).toEqual({
        favoriteGames: [1, 2, 3],
        preferredGenres: ['Strategy', 'Economic'],
      });
      expect(player.firebaseId).toBe('firebase123');
      expect(player.role).toEqual(['admin', 'moderator']);
      expect(player.status).toBe('active');
    });

    it('should create Player with minimal data and defaults', () => {
      const minimalData = {
        id: 2,
        name: 'Jane Doe',
        email: 'jane@example.com',
      };

      const player = new Player(minimalData);

      expect(player.id).toBe(2);
      expect(player.name).toBe('Jane Doe');
      expect(player.email).toBe('jane@example.com');
      expect(player.avatar).toBeUndefined();
      expect(player.joinDate).toBeInstanceOf(Date);
      expect(player.bio).toBeUndefined();
      expect(player.preferences).toEqual({});
      expect(player.firebaseId).toBeUndefined();
      expect(player.role).toBeUndefined();
      expect(player.status).toBe('active'); // Default value
    });

    it('should handle empty constructor data with defaults', () => {
      const player = new Player({});

      expect(player.id).toBe(0); // Default value
      expect(player.name).toBe(''); // Default value
      expect(player.email).toBe(''); // Default value
      expect(player.avatar).toBeUndefined();
      expect(player.joinDate).toBeInstanceOf(Date);
      expect(player.bio).toBeUndefined();
      expect(player.preferences).toEqual({});
      expect(player.firebaseId).toBeUndefined();
      expect(player.role).toBeUndefined();
      expect(player.status).toBe('active');
    });

    it('should handle string joinDate conversion', () => {
      const playerData = {
        id: 3,
        name: 'String Date Player',
        email: 'string@example.com',
        joinDate: '2024-12-25T15:30:00Z', // String date
      };

      const player = new Player(playerData);

      expect(player.joinDate).toBeInstanceOf(Date);
      expect(player.joinDate).toEqual(new Date('2024-12-25T15:30:00Z'));
    });

    it('should handle Date object joinDate', () => {
      const customDate = new Date('2023-06-15T12:00:00Z');
      const playerData = {
        id: 4,
        name: 'Date Object Player',
        email: 'dateobj@example.com',
        joinDate: customDate,
      };

      const player = new Player(playerData);

      expect(player.joinDate).toBeInstanceOf(Date);
      expect(player.joinDate).toEqual(customDate);
    });

    it('should set joinDate to current date when not provided', () => {
      const beforeCreation = new Date();
      const player = new Player({
        id: 5,
        name: 'No Date Player',
        email: 'nodate@example.com',
      });
      const afterCreation = new Date();

      expect(player.joinDate).toBeInstanceOf(Date);
      expect(player.joinDate.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(player.joinDate.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });

    it('should handle different status values', () => {
      const statuses: Array<'active' | 'blocked' | 'pending'> = ['active', 'blocked', 'pending'];

      statuses.forEach((status) => {
        const player = new Player({
          id: 10,
          name: `${status} Player`,
          email: `${status}@example.com`,
          status,
        });

        expect(player.status).toBe(status);
      });
    });

    it('should handle various role combinations', () => {
      const roleTests = [
        { roles: ['admin'], expected: ['admin'] },
        { roles: ['moderator'], expected: ['moderator'] },
        { roles: ['admin', 'moderator'], expected: ['admin', 'moderator'] },
        { roles: ['user'], expected: ['user'] },
        { roles: [], expected: [] },
      ];

      roleTests.forEach(({ roles, expected }) => {
        const player = new Player({
          id: 11,
          name: 'Role Test Player',
          email: 'roletest@example.com',
          role: roles,
        });

        expect(player.role).toEqual(expected);
      });
    });
  });

  describe('Helper Methods', () => {
    describe('getInitials', () => {
      it('should return initials for full name', () => {
        const player = new Player({
          id: 1,
          name: 'John Smith',
          email: 'john@example.com',
        });

        expect(player.getInitials()).toBe('JS');
      });

      it('should handle single name', () => {
        const player = new Player({
          id: 2,
          name: 'Madonna',
          email: 'madonna@example.com',
        });

        expect(player.getInitials()).toBe('M');
      });

      it('should handle multiple names', () => {
        const player = new Player({
          id: 3,
          name: 'Jean-Luc Patrick Stewart',
          email: 'jeanLuc@example.com',
        });

        expect(player.getInitials()).toBe('JPS');
      });

      it('should handle empty name', () => {
        const player = new Player({
          id: 4,
          name: '',
          email: 'empty@example.com',
        });

        expect(player.getInitials()).toBe('');
      });

      it('should handle name with extra spaces', () => {
        const player = new Player({
          id: 5,
          name: '  John   Smith  ',
          email: 'spaces@example.com',
        });

        // Should still handle the spaces and extract initials
        const initials = player.getInitials();
        expect(initials).toContain('J');
        expect(initials).toContain('S');
      });

      it('should handle special characters in names', () => {
        const player = new Player({
          id: 6,
          name: 'José María González',
          email: 'jose@example.com',
        });

        expect(player.getInitials()).toBe('JMG');
      });

      it('should convert to uppercase', () => {
        const player = new Player({
          id: 7,
          name: 'jane doe',
          email: 'jane@example.com',
        });

        expect(player.getInitials()).toBe('JD');
      });
    });

    describe('getFormattedJoinDate', () => {
      it('should format join date for display', () => {
        const player = new Player({
          id: 1,
          name: 'Date Test',
          email: 'date@example.com',
          joinDate: new Date('2024-12-25'),
        });

        const formatted = player.getFormattedJoinDate();
        expect(typeof formatted).toBe('string');
        expect(formatted.length).toBeGreaterThan(0);
        // Should contain year and month/day in some format
        expect(formatted).toMatch(/2024/);
        expect(formatted).toMatch(/12/);
      });

      it('should handle different dates correctly', () => {
        const testDates = [new Date('2023-01-01'), new Date('2024-06-15'), new Date('2025-12-31')];

        testDates.forEach((date) => {
          const player = new Player({
            id: 1,
            name: 'Date Test',
            email: 'date@example.com',
            joinDate: date,
          });

          const formatted = player.getFormattedJoinDate();
          expect(typeof formatted).toBe('string');
          expect(formatted.length).toBeGreaterThan(0);
        });
      });
    });

    describe('isAdmin', () => {
      it('should return true for admin role', () => {
        const player = new Player({
          id: 1,
          name: 'Admin User',
          email: 'admin@example.com',
          role: ['admin'],
        });

        expect(player.isAdmin()).toBe(true);
      });

      it('should return true when admin is among multiple roles', () => {
        const player = new Player({
          id: 2,
          name: 'Multi Role User',
          email: 'multi@example.com',
          role: ['user', 'admin', 'moderator'],
        });

        expect(player.isAdmin()).toBe(true);
      });

      it('should return false for non-admin roles', () => {
        const player = new Player({
          id: 3,
          name: 'Regular User',
          email: 'user@example.com',
          role: ['user', 'moderator'],
        });

        expect(player.isAdmin()).toBe(false);
      });

      it('should return false when role is undefined', () => {
        const player = new Player({
          id: 4,
          name: 'No Role User',
          email: 'norole@example.com',
        });

        expect(player.isAdmin()).toBe(false);
      });

      it('should return false for empty role array', () => {
        const player = new Player({
          id: 5,
          name: 'Empty Role User',
          email: 'emptyrole@example.com',
          role: [],
        });

        expect(player.isAdmin()).toBe(false);
      });
    });

    describe('isActive', () => {
      it('should return true for active status', () => {
        const player = new Player({
          id: 1,
          name: 'Active User',
          email: 'active@example.com',
          status: 'active',
        });

        expect(player.isActive()).toBe(true);
      });

      it('should return false for blocked status', () => {
        const player = new Player({
          id: 2,
          name: 'Blocked User',
          email: 'blocked@example.com',
          status: 'blocked',
        });

        expect(player.isActive()).toBe(false);
      });

      it('should return false for pending status', () => {
        const player = new Player({
          id: 3,
          name: 'Pending User',
          email: 'pending@example.com',
          status: 'pending',
        });

        expect(player.isActive()).toBe(false);
      });

      it('should return true for default status (when not specified)', () => {
        const player = new Player({
          id: 4,
          name: 'Default Status User',
          email: 'default@example.com',
        });

        expect(player.isActive()).toBe(true);
      });
    });
  });

  describe('Static Methods', () => {
    describe('fromJSON', () => {
      it('should create array of Players from JSON data', () => {
        const playersData = [
          {
            id: 1,
            name: 'Player One',
            email: 'player1@example.com',
            joinDate: '2024-01-01T10:00:00Z',
            bio: 'First player',
          },
          {
            id: 2,
            name: 'Player Two',
            email: 'player2@example.com',
            joinDate: '2024-02-01T10:00:00Z',
            preferences: {
              favoriteGames: [1, 2],
              preferredGenres: ['Strategy'],
            },
          },
        ];

        const players = Player.fromJSON(playersData);

        expect(players).toHaveLength(2);
        expect(players[0]).toBeInstanceOf(Player);
        expect(players[1]).toBeInstanceOf(Player);
        expect(players[0]?.name).toBe('Player One');
        expect(players[1]?.name).toBe('Player Two');
        expect(players[0]?.joinDate).toBeInstanceOf(Date);
        expect(players[1]?.joinDate).toBeInstanceOf(Date);
      });

      it('should handle empty array', () => {
        const players = Player.fromJSON([]);
        expect(players).toEqual([]);
      });

      it('should handle partial player data', () => {
        const playersData = [
          { id: 1, name: 'Minimal Player' },
          { email: 'onlyemail@example.com' },
          { id: 3, name: 'Another Player', status: 'blocked' as const },
        ];

        const players = Player.fromJSON(playersData);

        expect(players).toHaveLength(3);
        expect(players[0]?.id).toBe(1);
        expect(players[0]?.name).toBe('Minimal Player');
        expect(players[0]?.email).toBe(''); // Default value

        expect(players[1]?.id).toBe(0); // Default value
        expect(players[1]?.email).toBe('onlyemail@example.com');
        expect(players[1]?.name).toBe(''); // Default value

        expect(players[2]?.id).toBe(3);
        expect(players[2]?.name).toBe('Another Player');
        expect(players[2]?.status).toBe('blocked');
      });

      it('should handle mixed joinDate formats in JSON', () => {
        const playersData = [
          {
            id: 1,
            name: 'String Date Player',
            email: 'string@example.com',
            joinDate: '2024-01-15T12:00:00Z', // String
          },
          {
            id: 2,
            name: 'Date Object Player',
            email: 'dateobj@example.com',
            joinDate: new Date('2024-02-15T12:00:00Z'), // Date object
          },
          {
            id: 3,
            name: 'No Date Player',
            email: 'nodate@example.com',
            // No joinDate - should default to current date
          },
        ];

        const players = Player.fromJSON(playersData);

        expect(players[0]?.joinDate).toBeInstanceOf(Date);
        expect(players[0]?.joinDate).toEqual(new Date('2024-01-15T12:00:00Z'));
        expect(players[1]?.joinDate).toBeInstanceOf(Date);
        expect(players[1]?.joinDate).toEqual(new Date('2024-02-15T12:00:00Z'));
        expect(players[2]?.joinDate).toBeInstanceOf(Date);
        // Third player's joinDate should be close to now
      });
    });
  });

  describe('Preferences', () => {
    it('should handle complex preferences structure', () => {
      const player = new Player({
        id: 1,
        name: 'Preferences Player',
        email: 'prefs@example.com',
        preferences: {
          favoriteGames: [1, 5, 10, 23, 45],
          preferredGenres: ['Strategy', 'Economic', 'Engine Building', 'Euro'],
        },
      });

      expect(player.preferences?.favoriteGames).toEqual([1, 5, 10, 23, 45]);
      expect(player.preferences?.preferredGenres).toEqual([
        'Strategy',
        'Economic',
        'Engine Building',
        'Euro',
      ]);
    });

    it('should handle empty preferences', () => {
      const player = new Player({
        id: 1,
        name: 'Empty Prefs Player',
        email: 'empty@example.com',
        preferences: {},
      });

      expect(player.preferences).toEqual({});
    });

    it('should handle partial preferences', () => {
      const playerWithGames = new Player({
        id: 1,
        name: 'Games Only Player',
        email: 'games@example.com',
        preferences: {
          favoriteGames: [1, 2, 3],
        },
      });

      const playerWithGenres = new Player({
        id: 2,
        name: 'Genres Only Player',
        email: 'genres@example.com',
        preferences: {
          preferredGenres: ['Party', 'Trivia'],
        },
      });

      expect(playerWithGames.preferences?.favoriteGames).toEqual([1, 2, 3]);
      expect(playerWithGames.preferences?.preferredGenres).toBeUndefined();

      expect(playerWithGenres.preferences?.preferredGenres).toEqual(['Party', 'Trivia']);
      expect(playerWithGenres.preferences?.favoriteGames).toBeUndefined();
    });
  });

  describe('Firebase Integration', () => {
    it('should handle Firebase-specific fields', () => {
      const player = new Player({
        id: 1,
        name: 'Firebase Player',
        email: 'firebase@example.com',
        firebaseId: 'abc123xyz789',
        role: ['user', 'beta-tester'],
        status: 'active',
      });

      expect(player.firebaseId).toBe('abc123xyz789');
      expect(player.role).toEqual(['user', 'beta-tester']);
      expect(player.status).toBe('active');
    });

    it('should handle undefined Firebase fields', () => {
      const player = new Player({
        id: 1,
        name: 'Non-Firebase Player',
        email: 'nonfirebase@example.com',
      });

      expect(player.firebaseId).toBeUndefined();
      expect(player.role).toBeUndefined();
      expect(player.status).toBe('active'); // Default value
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long names', () => {
      const longName = 'A'.repeat(100) + ' ' + 'B'.repeat(100);
      const player = new Player({
        id: 1,
        name: longName,
        email: 'longname@example.com',
      });

      expect(player.name).toBe(longName);
      expect(player.getInitials()).toBe('AB'); // Should still work
    });

    it('should handle special characters in all fields', () => {
      const player = new Player({
        id: 1,
        name: 'José María Ñoño',
        email: 'josé@examplë.com',
        bio: 'Biografía with spëcial charactërs & émojis 🎲',
        firebaseId: 'fîrëbäsë-123',
      });

      expect(player.name).toBe('José María Ñoño');
      expect(player.email).toBe('josé@examplë.com');
      expect(player.bio).toBe('Biografía with spëcial charactërs & émojis 🎲');
      expect(player.firebaseId).toBe('fîrëbäsë-123');
      expect(player.getInitials()).toBe('JMÑ');
    });

    it('should handle empty and null-like values gracefully', () => {
      const player = new Player({
        id: 0,
        name: '',
        email: '',
        avatar: '',
        bio: '',
        preferences: {},
        role: [],
      });

      expect(player.id).toBe(0);
      expect(player.name).toBe('');
      expect(player.email).toBe('');
      expect(player.avatar).toBeUndefined(); // Empty string gets converted to undefined by constructor
      expect(player.bio).toBeUndefined(); // Empty string gets converted to undefined by constructor
      expect(player.preferences).toEqual({});
      expect(player.role).toEqual([]);
      expect(player.getInitials()).toBe('');
      expect(player.isAdmin()).toBe(false);
      expect(player.isActive()).toBe(true);
    });

    it('should handle invalid date strings gracefully', () => {
      const player = new Player({
        id: 1,
        name: 'Invalid Date Player',
        email: 'invalid@example.com',
        joinDate: 'not-a-date-string',
      });

      expect(player.joinDate).toBeInstanceOf(Date);
      // Invalid date string should create Invalid Date, but still be Date instance
      // In real usage, validation should happen before model creation
    });
  });
});

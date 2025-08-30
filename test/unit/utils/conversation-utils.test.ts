import { describe, it, expect } from 'vitest';
import { formatDirectConversation } from 'src/utils/conversation-utils';
import { Player } from 'src/models/Player';
import { Message } from 'src/models/Message';
import type { DirectConversation } from 'src/models/Conversation';

describe('Conversation Utils', () => {
  const mockPlayer = new Player({
    id: 123,
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'avatar.jpg',
  });

  const mockGetPlayer = (id: number) => {
    if (id === 123) return mockPlayer;
    return undefined;
  };

  describe('formatDirectConversation', () => {
    it('should format conversation with existing player', () => {
      const message = new Message({
        id: 1,
        type: 'direct',
        content: 'Hello there!',
        sender: 123,
        recipients: [456],
        timestamp: new Date(),
        isRead: false,
      });

      const conversation: DirectConversation = {
        partnerId: 123,
        latestMessage: message,
        unreadCount: 2,
        messages: [],
      };

      const result = formatDirectConversation(conversation, mockGetPlayer, 123);

      expect(result).toEqual({
        id: 123,
        name: 'John Doe',
        avatar: 'avatar.jpg',
        lastMessage: 'Hello there!',
        unreadCount: 2,
        isActive: true,
      });
    });

    it('should handle conversation with unknown player', () => {
      const message = new Message({
        id: 2,
        type: 'direct',
        content: 'Unknown user message',
        sender: 999,
        recipients: [123],
        timestamp: new Date(),
        isRead: false,
      });

      const conversation: DirectConversation = {
        partnerId: 999,
        latestMessage: message,
        unreadCount: 1,
        messages: [],
      };

      const result = formatDirectConversation(conversation, mockGetPlayer, null);

      expect(result).toEqual({
        id: 999,
        name: 'User 999',
        avatar: null,
        lastMessage: 'Unknown user message',
        unreadCount: 1,
        isActive: false,
      });
    });

    it('should handle conversation without latest message', () => {
      const conversation: DirectConversation = {
        partnerId: 123,
        latestMessage: undefined,
        unreadCount: 0,
        messages: [],
      };

      const result = formatDirectConversation(conversation, mockGetPlayer, 456);

      expect(result).toEqual({
        id: 123,
        name: 'John Doe',
        avatar: 'avatar.jpg',
        lastMessage: '',
        unreadCount: 0,
        isActive: false,
      });
    });

    it('should handle conversation with zero unreadCount', () => {
      const message = new Message({
        id: 3,
        type: 'direct',
        content: 'Test message',
        sender: 123,
        recipients: [456],
        timestamp: new Date(),
        isRead: true,
      });

      const conversation: DirectConversation = {
        partnerId: 123,
        latestMessage: message,
        unreadCount: 0,
        messages: [],
      };

      const result = formatDirectConversation(conversation, mockGetPlayer, null);

      expect(result.unreadCount).toBe(0);
    });

    it('should correctly determine active state', () => {
      const conversation: DirectConversation = {
        partnerId: 123,
        latestMessage: undefined,
        unreadCount: 0,
        messages: [],
      };

      // Test active state with number
      const activeResult = formatDirectConversation(conversation, mockGetPlayer, 123);
      expect(activeResult.isActive).toBe(true);

      // Test active state with string
      const activeStringResult = formatDirectConversation(conversation, mockGetPlayer, '123');
      expect(activeStringResult.isActive).toBe(false); // Should be false since 123 !== '123'

      // Test inactive state
      const inactiveResult = formatDirectConversation(conversation, mockGetPlayer, 456);
      expect(inactiveResult.isActive).toBe(false);
    });
  });
});

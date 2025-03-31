import { defineStore } from 'pinia';
import messagesData from 'src/assets/data/messages.json';
import { Message, type MessageData } from 'src/models/Message';
import type { DirectConversation, GroupConversation } from 'src/models/Conversation';

type SendMessageData = Omit<MessageData, 'id' | 'timestamp' | 'isRead'>;

export const useMessagesStore = defineStore('messages', {
  state: () => ({
    messages: [] as Message[],
    loading: false,
    error: null as string | null,
    currentUserId: 1, // Default user ID for testing
  }),

  getters: {
    // Get all direct messages for current user
    directMessages: (state) => {
      return state.messages.filter(
        (msg) =>
          msg.type === 'direct' &&
          (msg.sender === state.currentUserId || msg.recipients.includes(state.currentUserId)),
      );
    },

    // Get all group messages for current user
    groupMessages: (state) => {
      return state.messages.filter(
        (msg) =>
          msg.type === 'group' &&
          (msg.sender === state.currentUserId || msg.recipients.includes(state.currentUserId)),
      );
    },

    // Get conversations (grouped by other user)
    conversations(): DirectConversation[] {
      const directMsgs = this.messages.filter(
        (msg) =>
          msg.type === 'direct' &&
          (msg.sender === this.currentUserId || msg.recipients.includes(this.currentUserId)),
      );

      // Group by conversation partner
      const conversationsMap = new Map<number, Message[]>();

      directMsgs.forEach((msg) => {
        const partnerId = msg.sender === this.currentUserId ? msg.recipients[0] : msg.sender;

        // Skip messages without a valid partner ID
        if (partnerId === undefined) return;

        if (!conversationsMap.has(partnerId)) {
          conversationsMap.set(partnerId, []);
        }
        conversationsMap.get(partnerId)?.push(msg);
      });

      // Sort conversations by latest message
      return Array.from(conversationsMap.entries())
        .map(([partnerId, messages]) => ({
          partnerId,
          messages: messages.sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          ),
          latestMessage: messages[0],
          unreadCount: messages.filter((m) => !m.isRead && m.sender !== this.currentUserId).length,
        }))
        .sort((a, b) => {
          if (!a.latestMessage) return 1;
          if (!b.latestMessage) return -1;
          return (
            new Date(b.latestMessage.timestamp).getTime() -
            new Date(a.latestMessage.timestamp).getTime()
          );
        });
    },

    // Get all message groups
    messageGroups(): GroupConversation[] {
      const groupMsgs = this.messages.filter(
        (msg) =>
          msg.type === 'group' &&
          (msg.sender === this.currentUserId || msg.recipients.includes(this.currentUserId)),
      );

      // Group by groupName
      const groupsMap = new Map<string, Message[]>();

      groupMsgs.forEach((msg) => {
        const groupName = msg.groupName || 'Unnamed Group';

        if (!groupsMap.has(groupName)) {
          groupsMap.set(groupName, []);
        }
        groupsMap.get(groupName)?.push(msg);
      });

      // Sort groups by latest message
      return Array.from(groupsMap.entries())
        .map(([groupName, messages]) => ({
          groupName,
          messages: messages.sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          ),
          latestMessage: messages[0],
          participants: Array.from(new Set(messages.flatMap((m) => [m.sender, ...m.recipients]))),
          unreadCount: messages.filter((m) => !m.isRead && m.sender !== this.currentUserId).length,
        }))
        .sort((a, b) => {
          if (!a.latestMessage) return 1;
          if (!b.latestMessage) return -1;
          return (
            new Date(b.latestMessage.timestamp).getTime() -
            new Date(a.latestMessage.timestamp).getTime()
          );
        });
    },

    // Get events comments
    eventComments: (state) => (eventId: number) => {
      return state.messages
        .filter((msg) => msg.type === 'event' && msg.eventId === eventId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    },

    // Get game comments
    gameComments: (state) => (gameId: number) => {
      return state.messages
        .filter((msg) => msg.type === 'game' && msg.gameId === gameId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    },

    // Get unread messages count
    unreadCount: (state) => {
      return state.messages.filter(
        (msg) =>
          !msg.isRead &&
          msg.sender !== state.currentUserId &&
          (msg.type === 'direct' || msg.type === 'group') &&
          msg.recipients.includes(state.currentUserId),
      ).length;
    },
  },

  actions: {
    async fetchMessages() {
      this.loading = true;
      this.error = null;

      try {
        await Promise.resolve(); // Simulate async operation
        this.messages = Message.fromJSON(messagesData as MessageData[]);
        // Set a default testing user ID
        this.setCurrentUser(1); // Using player ID 1 (John) as default for testing
      } catch (error) {
        this.error = (error as Error).message;
        console.error('Error fetching messages:', error);
      } finally {
        this.loading = false;
      }
    },

    // Set current user ID
    setCurrentUser(userId: number) {
      this.currentUserId = userId;
    },

    // Mark message as read
    markAsRead(messageId: number) {
      const message = this.messages.find((msg) => msg.id === messageId);
      if (message) {
        message.isRead = true;
      }
    },

    // Mark all messages in a conversation as read
    markConversationAsRead(partnerId: number) {
      this.messages.forEach((msg) => {
        if (
          msg.type === 'direct' &&
          msg.sender === partnerId &&
          msg.recipients.includes(this.currentUserId)
        ) {
          msg.isRead = true;
        }
      });
    },

    // Mark all messages in a group as read
    markGroupAsRead(groupName: string) {
      this.messages.forEach((msg) => {
        if (
          msg.type === 'group' &&
          msg.groupName === groupName &&
          msg.sender !== this.currentUserId
        ) {
          msg.isRead = true;
        }
      });
    },

    // Send a new message
    sendMessage(messageData: SendMessageData): Message {
      const newId = Math.max(...this.messages.map((msg) => msg.id), 0) + 1;

      const newMessage = new Message({
        id: newId,
        timestamp: new Date().toISOString(),
        isRead: false,
        ...messageData,
      });

      this.messages.push(newMessage);
      return newMessage;
    },

    // Get conversation with specific user
    getConversationWith(userId: number) {
      return this.messages
        .filter(
          (msg) =>
            msg.type === 'direct' &&
            ((msg.sender === this.currentUserId && msg.recipients.includes(userId)) ||
              (msg.sender === userId && msg.recipients.includes(this.currentUserId))),
        )
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    },

    // Get messages for a specific group
    getGroupMessages(groupName: string) {
      return this.messages
        .filter((msg) => msg.type === 'group' && msg.groupName === groupName)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    },

    // Send a new direct message
    sendDirectMessage(recipientId: number, content: string): Message {
      return this.sendMessage({
        type: 'direct',
        sender: this.currentUserId,
        recipients: [recipientId],
        content,
      });
    },

    // Send a new group message
    sendGroupMessage(groupName: string, content: string): Message | null {
      const existingGroup = this.messageGroups.find((g) => g.groupName === groupName);
      if (!existingGroup) return null;

      return this.sendMessage({
        type: 'group',
        sender: this.currentUserId,
        recipients: existingGroup.participants,
        groupName,
        content,
      });
    },

    // Start a new conversation
    startConversation(recipientId: number, content: string) {
      return this.sendDirectMessage(recipientId, content);
    },
  },
});

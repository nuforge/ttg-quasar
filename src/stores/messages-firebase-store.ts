import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  where,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from 'src/boot/firebase';
import { Message, type MessageData } from 'src/models/Message';
import type { GroupConversation, DirectConversation } from 'src/models/Conversation';
import { authService } from 'src/services/auth-service';

type SendMessageData = Omit<MessageData, 'id' | 'timestamp' | 'isRead' | 'sender'>;

export const useMessagesFirebaseStore = defineStore('messagesFirebase', () => {
  // State
  const messages = ref<Message[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const unsubscribes = ref<Unsubscribe[]>([]);

  // Getters
  const directMessages = computed(() => {
    const currentUserId = authService.currentUserId.value;
    if (!currentUserId) return [];

    return messages.value.filter(
      (msg) =>
        msg.type === 'direct' &&
        (msg.sender.toString() === currentUserId ||
          msg.recipients.includes(parseInt(currentUserId))),
    );
  });

  const groupMessages = computed(() => {
    const currentUserId = authService.currentUserId.value;
    if (!currentUserId) return [];

    return messages.value.filter(
      (msg) =>
        msg.type === 'group' &&
        (msg.sender.toString() === currentUserId ||
          msg.recipients.includes(parseInt(currentUserId))),
    );
  });

  const gameComments = computed(() => {
    return (gameId: string) => {
      return messages.value
        .filter((msg) => msg.type === 'game' && msg.gameId === gameId)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    };
  });

  const eventMessages = computed(() => {
    return (eventId: string) => {
      return messages.value
        .filter((msg) => msg.type === 'event' && msg.eventId === eventId)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    };
  });

  const unreadCount = computed(() => {
    const currentUserId = authService.currentUserId.value;
    if (!currentUserId) return 0;

    return messages.value.filter(
      (msg) =>
        !msg.isRead &&
        msg.sender.toString() !== currentUserId &&
        (msg.recipients.includes(parseInt(currentUserId)) ||
          msg.type === 'game' ||
          msg.type === 'event'),
    ).length;
  });

  // Add currentUserId getter for compatibility with legacy components
  const currentUserId = computed(() => {
    const userId = authService.currentUserId.value;
    return userId ? parseInt(userId) : null;
  });

  // Conversation and group management for legacy component compatibility
  const conversations = computed((): DirectConversation[] => {
    const currentUserId = authService.currentUserId.value;
    if (!currentUserId) return [];

    // Create conversation objects from direct messages
    const directMsgs = directMessages.value;
    const conversationMap = new Map<number, DirectConversation>();

    directMsgs.forEach((msg) => {
      const otherId =
        msg.sender.toString() === currentUserId
          ? msg.getRecipientId(parseInt(currentUserId))
          : msg.sender;

      if (otherId && !conversationMap.has(otherId)) {
        const conversationMessages = directMsgs
          .filter(
            (m) =>
              (m.sender === otherId &&
                m.getRecipientId(parseInt(currentUserId)) === parseInt(currentUserId)) ||
              (m.sender === parseInt(currentUserId) &&
                m.getRecipientId(parseInt(currentUserId)) === otherId),
          )
          .sort((a, b) => {
            const aTime = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
            const bTime = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
            return aTime.getTime() - bTime.getTime();
          });

        conversationMap.set(otherId, {
          partnerId: otherId,
          messages: conversationMessages,
          latestMessage: conversationMessages[conversationMessages.length - 1] || undefined,
          unreadCount: conversationMessages.filter((m) => !m.isRead && m.sender === otherId).length,
        });
      }
    });

    return Array.from(conversationMap.values());
  });

  const messageGroups = computed((): GroupConversation[] => {
    // Get unique group names from group messages
    const groups = new Set<string>();
    groupMessages.value.forEach((msg) => {
      if (msg.groupName) groups.add(msg.groupName);
    });

    return Array.from(groups).map((groupName) => {
      const groupMsgs = groupMessages.value.filter((msg) => msg.groupName === groupName);
      const sortedMsgs = groupMsgs.sort((a, b) => {
        const aTime = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
        const bTime = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
        return aTime.getTime() - bTime.getTime();
      });

      const participants = new Set<number>();
      let unreadCount = 0;

      groupMsgs.forEach((msg) => {
        participants.add(msg.sender);
        if (msg.recipients) {
          msg.recipients.forEach((r) => participants.add(r));
        }
        if (!msg.isRead) unreadCount++;
      });

      return {
        groupName,
        messages: sortedMsgs,
        latestMessage: sortedMsgs[sortedMsgs.length - 1] || undefined,
        participants: Array.from(participants),
        unreadCount,
      };
    });
  });

  // Methods for legacy component compatibility
  const getConversationWith = (userId: number) => {
    const currentUserId = authService.currentUserId.value;
    if (!currentUserId) return [];

    return directMessages.value.filter(
      (msg) => msg.sender === userId || msg.getRecipientId(parseInt(currentUserId)) === userId,
    );
  };

  const getGroupMessages = (groupName: string) => {
    return groupMessages.value.filter((msg) => msg.groupName === groupName);
  };

  const markConversationAsRead = (userId: number) => {
    // This would typically update Firestore documents to mark messages as read
    // For now, we'll just update local state
    const currentUserId = authService.currentUserId.value;
    if (!currentUserId) return;

    messages.value.forEach((msg) => {
      if (msg.sender === userId || msg.getRecipientId(parseInt(currentUserId)) === userId) {
        msg.isRead = true;
      }
    });
  };

  const markGroupAsRead = (groupName: string) => {
    // Similar to conversation marking
    messages.value.forEach((msg) => {
      if (msg.groupName === groupName) {
        msg.isRead = true;
      }
    });
  };

  // Convenience methods for different message types
  const sendDirectMessage = async (recipientId: number, content: string) => {
    return sendMessage({
      type: 'direct',
      content,
      recipients: [recipientId],
    });
  };

  const sendGroupMessage = async (groupName: string, content: string) => {
    return sendMessage({
      type: 'group',
      groupName,
      content,
      recipients: [], // Will be populated based on group membership
    });
  };

  // Actions
  const sendMessage = async (messageData: SendMessageData) => {
    if (!authService.isAuthenticated.value || !authService.currentPlayer.value) {
      throw new Error('Must be authenticated to send messages');
    }

    loading.value = true;
    error.value = null;

    try {
      const currentPlayer = authService.currentPlayer.value;

      if (!currentPlayer) {
        throw new Error('User must be logged in to send messages');
      }

      const firestoreMessageData = {
        type: messageData.type,
        sender: currentPlayer.id,
        content: messageData.content,
        recipients: messageData.recipients || [],
        gameId: messageData.gameId || null,
        eventId: messageData.eventId || null,
        conversationId: messageData.conversationId,
        timestamp: serverTimestamp(),
        isRead: false,
        // Add sender info for easier querying
        senderName: currentPlayer.name,
        senderAvatar: currentPlayer.avatar,
      };

      await addDoc(collection(db, 'messages'), firestoreMessageData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      error.value = `Failed to send message: ${errorMessage}`;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const subscribeToGameMessages = (gameId: string) => {
    const q = query(
      collection(db, 'messages'),
      where('type', '==', 'game'),
      where('gameId', '==', gameId),
      orderBy('timestamp', 'asc'),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const gameMessages = snapshot.docs.map((doc) => {
          const data = doc.data();
          return new Message({
            id: doc.id,
            type: data.type,
            sender: data.sender,
            content: data.content,
            recipients: data.recipients,
            gameId: data.gameId,
            eventId: data.eventId,
            conversationId: data.conversationId,
            timestamp:
              data.timestamp instanceof Timestamp ? data.timestamp.toDate() : data.timestamp,
            isRead: data.isRead,
          });
        });

        // Update messages array, replacing existing game messages
        messages.value = messages.value.filter(
          (msg) => msg.type !== 'game' || msg.gameId !== gameId,
        );
        messages.value.push(...gameMessages);
      },
      (err) => {
        error.value = `Failed to subscribe to game messages: ${err.message}`;
      },
    );

    unsubscribes.value.push(unsubscribe);
    return unsubscribe;
  };

  const subscribeToEventMessages = (eventId: string) => {
    const q = query(
      collection(db, 'messages'),
      where('type', '==', 'event'),
      where('eventId', '==', eventId),
      orderBy('timestamp', 'asc'),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const eventMessages = snapshot.docs.map((doc) => {
          const data = doc.data();
          return new Message({
            id: doc.id,
            type: data.type,
            sender: data.sender,
            content: data.content,
            recipients: data.recipients,
            gameId: data.gameId,
            eventId: data.eventId,
            conversationId: data.conversationId,
            timestamp:
              data.timestamp instanceof Timestamp ? data.timestamp.toDate() : data.timestamp,
            isRead: data.isRead,
          });
        });

        // Update messages array, replacing existing event messages
        messages.value = messages.value.filter(
          (msg) => msg.type !== 'event' || msg.eventId?.toString() !== eventId,
        );
        messages.value.push(...eventMessages);
      },
      (err) => {
        error.value = `Failed to subscribe to event messages: ${err.message}`;
      },
    );

    unsubscribes.value.push(unsubscribe);
    return unsubscribe;
  };

  const subscribeToDirectMessages = () => {
    const currentUserId = authService.currentUserId.value;
    if (!currentUserId) return;

    const q = query(
      collection(db, 'messages'),
      where('type', '==', 'direct'),
      orderBy('timestamp', 'desc'),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const directMsgs = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            return new Message({
              id: doc.id,
              type: data.type,
              sender: data.sender,
              content: data.content,
              recipients: data.recipients,
              gameId: data.gameId,
              eventId: data.eventId,
              conversationId: data.conversationId,
              timestamp:
                data.timestamp instanceof Timestamp ? data.timestamp.toDate() : data.timestamp,
              isRead: data.isRead,
            });
          })
          .filter(
            (msg) =>
              msg.sender.toString() === currentUserId ||
              msg.recipients.includes(parseInt(currentUserId)),
          );

        // Update messages array, replacing existing direct messages
        messages.value = messages.value.filter((msg) => msg.type !== 'direct');
        messages.value.push(...directMsgs);
      },
      (err) => {
        error.value = `Failed to subscribe to direct messages: ${err.message}`;
      },
    );

    unsubscribes.value.push(unsubscribe);
    return unsubscribe;
  };

  const subscribeToGroupMessages = () => {
    const currentUserId = authService.currentUserId.value;
    if (!currentUserId) return;

    const q = query(
      collection(db, 'messages'),
      where('type', '==', 'group'),
      orderBy('timestamp', 'desc'),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const groupMsgs = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            return new Message({
              id: doc.id,
              type: data.type,
              sender: data.sender,
              content: data.content,
              recipients: data.recipients,
              gameId: data.gameId,
              eventId: data.eventId,
              conversationId: data.conversationId,
              timestamp:
                data.timestamp instanceof Timestamp ? data.timestamp.toDate() : data.timestamp,
              isRead: data.isRead,
            });
          })
          .filter(
            (msg) =>
              msg.sender.toString() === currentUserId ||
              msg.recipients.includes(parseInt(currentUserId)),
          );

        // Update messages array, replacing existing group messages
        messages.value = messages.value.filter((msg) => msg.type !== 'group');
        messages.value.push(...groupMsgs);
      },
      (err) => {
        error.value = `Failed to subscribe to group messages: ${err.message}`;
      },
    );

    unsubscribes.value.push(unsubscribe);
    return unsubscribe;
  };

  const cleanup = () => {
    unsubscribes.value.forEach((unsubscribe) => unsubscribe());
    unsubscribes.value = [];
    messages.value = [];
  };

  return {
    // State
    messages,
    loading,
    error,

    // Getters
    directMessages,
    groupMessages,
    gameComments,
    eventMessages,
    unreadCount,
    currentUserId,
    conversations,
    messageGroups,

    // Actions
    sendMessage,
    sendDirectMessage,
    sendGroupMessage,
    subscribeToGameMessages,
    subscribeToEventMessages,
    subscribeToDirectMessages,
    subscribeToGroupMessages,
    getConversationWith,
    getGroupMessages,
    markConversationAsRead,
    markGroupAsRead,
    cleanup,
  };
});

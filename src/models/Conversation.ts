import type { Message } from './Message';

/**
 * Interface for direct conversations between two users
 */
export interface DirectConversation {
  partnerId: number;
  messages: Message[];
  latestMessage: Message | undefined; // Changed from optional to explicit union
  unreadCount: number;
}

/**
 * Interface for group conversations between multiple users
 */
export interface GroupConversation {
  groupName: string;
  messages: Message[];
  latestMessage: Message | undefined; // Changed from optional to explicit union
  participants: number[];
  unreadCount: number;
}

/**
 * Union type for any type of conversation
 */
export type ConversationItem = DirectConversation | GroupConversation;

/**
 * Type for formatted conversation items for display
 */
export interface FormattedConversationItem {
  id: number | string;
  name: string;
  avatar: string | null;
  lastMessage: string;
  unreadCount: number;
  isActive: boolean;
}

import type {
  ConversationItem,
  DirectConversation,
  GroupConversation,
  FormattedConversationItem,
} from 'src/models/Conversation';
import type { Player } from 'src/models/Player';

/**
 * Format direct conversation for display
 */
export function formatDirectConversation(
  conversation: DirectConversation,
  getPlayer: (id: number) => Player | undefined,
  selectedId: number | string | null,
): FormattedConversationItem {
  const player = getPlayer(conversation.partnerId);

  return {
    id: conversation.partnerId,
    name: player?.name || `User ${conversation.partnerId}`,
    avatar: player?.avatar || null,
    lastMessage: conversation.latestMessage?.content || '',
    unreadCount: conversation.unreadCount || 0,
    isActive: selectedId === conversation.partnerId,
  };
}

/**
 * Format group conversation for display
 */
export function formatGroupConversation(
  conversation: GroupConversation,
  selectedId: number | string | null,
): FormattedConversationItem {
  return {
    id: conversation.groupName,
    name: conversation.groupName,
    avatar: null,
    lastMessage: conversation.latestMessage?.content || '',
    unreadCount: conversation.unreadCount || 0,
    isActive: selectedId === conversation.groupName,
  };
}

/**
 * Format any conversation type for display
 */
export function formatConversation(
  conversation: ConversationItem,
  type: 'direct' | 'group',
  getPlayer: (id: number) => Player | undefined,
  selectedId: number | string | null,
): FormattedConversationItem {
  if (type === 'direct') {
    return formatDirectConversation(conversation as DirectConversation, getPlayer, selectedId);
  } else {
    return formatGroupConversation(conversation as GroupConversation, selectedId);
  }
}

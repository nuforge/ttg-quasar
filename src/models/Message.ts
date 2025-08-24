export type MessageType = 'direct' | 'group' | 'event' | 'game';

export interface MessageData {
  id: number | string; // Support both number and Firestore document ID
  type: MessageType;
  sender: number; // Player ID
  recipients: number[]; // For direct/group messages - make required
  groupName?: string; // For group messages
  eventId?: number | string; // For event comments - support string IDs for Firebase
  gameId?: number; // For game comments
  conversationId?: string; // For conversation threading
  content: string;
  timestamp: string | Date; // Support both string and Date objects
  isRead: boolean; // Make required
  replyTo?: number | undefined; // Make explicitly optional
  attachments?: string[]; // URLs to attachments
}

export class Message {
  id: number | string; // Support both for Firebase compatibility
  type: MessageType;
  sender: number;
  recipients: number[];
  groupName?: string | undefined;
  eventId?: number | string | undefined; // Support string IDs
  gameId?: number | undefined;
  conversationId?: string | undefined;
  content: string;
  timestamp: Date; // Always use Date objects internally
  isRead: boolean;
  replyTo?: number | undefined;
  attachments: string[];

  constructor(data: MessageData) {
    this.id = data.id;
    this.type = data.type;
    this.sender = data.sender;
    this.recipients = data.recipients || [];
    this.groupName = data.groupName;
    this.eventId = data.eventId;
    this.gameId = data.gameId;
    this.conversationId = data.conversationId;
    this.content = data.content;
    // Always convert timestamp to Date object
    this.timestamp = typeof data.timestamp === 'string' ? new Date(data.timestamp) : data.timestamp;
    this.isRead = data.isRead || false;
    this.replyTo = data.replyTo;
    this.attachments = data.attachments || [];
  }

  // Get formatted date/time
  getFormattedTime(): string {
    return this.timestamp.toLocaleString();
  }

  // Check if message is unread
  isUnread(): boolean {
    return !this.isRead && (this.type === 'direct' || this.type === 'group');
  }

  // Check if message is a reply
  isReply(): boolean {
    return !!this.replyTo;
  }

  // For direct messages, get the other user's ID
  getRecipientId(currentUserId: number): number | undefined {
    if (this.type === 'direct') {
      // If current user is the sender, return the recipient
      if (this.sender === currentUserId) {
        return this.recipients[0];
      }
      // If current user is the recipient, return the sender
      return this.sender;
    }
    return undefined;
  }

  // Static method to create from JSON
  static fromJSON(messagesData: MessageData[]): Message[] {
    return messagesData.map((data) => new Message(data));
  }
}

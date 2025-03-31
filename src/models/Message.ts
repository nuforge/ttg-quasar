export type MessageType = 'direct' | 'group' | 'event' | 'game';

export interface MessageData {
  id: number;
  type: MessageType;
  sender: number; // Player ID
  recipients?: number[]; // For direct/group messages
  groupName?: string; // For group messages
  eventId?: number; // For event comments
  gameId?: number; // For game comments
  content: string;
  timestamp: string;
  isRead?: boolean; // For direct/group messages
  replyTo?: number; // ID of message being replied to
  attachments?: string[]; // URLs to attachments
}

export class Message {
  id: number;
  type: MessageType;
  sender: number;
  recipients: number[];
  groupName?: string | undefined;
  eventId?: number | undefined;
  gameId?: number | undefined;
  content: string;
  timestamp: string;
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
    this.content = data.content;
    this.timestamp = data.timestamp;
    this.isRead = data.isRead || false;
    this.replyTo = data.replyTo;
    this.attachments = data.attachments || [];
  }

  // Get formatted date/time
  getFormattedTime(): string {
    const date = new Date(this.timestamp);
    return date.toLocaleString();
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

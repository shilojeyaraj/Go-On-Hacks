import { api } from '../shared/api';
import { UserService } from './user.service';

export interface Conversation {
  _id: string;
  participant1: string;
  participant2: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCounts?: {
    [uid: string]: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string;
  read?: boolean;
  readAt?: string;
  createdAt?: string;
}

export interface ChatMatch {
  id: string;
  conversationId: string;
  name: string;
  photoURL?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  otherUserId: string;
}

export class ChatService {
  /**
   * Get all conversations for the current user
   */
  static async getConversations(): Promise<Conversation[]> {
    const response = await api.get('/chat/conversations');
    return response.data;
  }

  /**
   * Get or create a conversation with another user
   */
  static async getOrCreateConversation(otherUserId: string): Promise<Conversation> {
    const response = await api.get(`/chat/conversations/with/${otherUserId}`);
    return response.data;
  }

  /**
   * Get messages for a conversation
   */
  static async getMessages(conversationId: string, limit: number = 50): Promise<Message[]> {
    const response = await api.get(`/chat/conversations/${conversationId}/messages`, {
      params: { limit },
    });
    return response.data;
  }

  /**
   * Send a message
   */
  static async sendMessage(conversationId: string, content: string): Promise<Message> {
    const response = await api.post('/chat/messages', {
      conversationId,
      content,
    });
    return response.data;
  }

  /**
   * Get conversations with user details for display
   */
  static async getChatMatches(currentUserId: string): Promise<ChatMatch[]> {
    try {
      const conversations = await this.getConversations();
      const matches: ChatMatch[] = [];

      for (const conv of conversations) {
        const otherUserId = conv.participant1 === currentUserId 
          ? conv.participant2 
          : conv.participant1;

        try {
          // Get other user's profile
          const response = await api.get(`/users/by-uid/${otherUserId}`);
          const otherUser = response.data;
          
          const unreadCount = conv.unreadCounts?.[currentUserId] || 0;
          
          matches.push({
            id: otherUserId,
            conversationId: conv._id,
            name: otherUser.fullName || otherUser.displayName || 'Unknown User',
            photoURL: otherUser.profilePicture || otherUser.photoURL,
            lastMessage: conv.lastMessage,
            lastMessageTime: conv.lastMessageAt 
              ? this.formatMessageTime(conv.lastMessageAt)
              : undefined,
            unreadCount: unreadCount > 0 ? unreadCount : undefined,
            otherUserId,
          });
        } catch (err) {
          // If we can't get user details, still add the conversation
          matches.push({
            id: otherUserId,
            conversationId: conv._id,
            name: 'Unknown User',
            lastMessage: conv.lastMessage,
            lastMessageTime: conv.lastMessageAt 
              ? this.formatMessageTime(conv.lastMessageAt)
              : undefined,
            unreadCount: conv.unreadCounts?.[currentUserId] || 0,
            otherUserId,
          });
        }
      }

      return matches;
    } catch (error: any) {
      console.error('Failed to get chat matches:', error);
      return [];
    }
  }

  /**
   * Format message timestamp for display
   */
  private static formatMessageTime(timestamp: string | Date): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  /**
   * Format message time for display in chat
   */
  static formatMessageTimeDetailed(timestamp: string | Date): string {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = date.toDateString() === new Date(now.getTime() - 86400000).toDateString();

    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (isYesterday) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }
}


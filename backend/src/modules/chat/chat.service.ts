import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import { Message, MessageDocument } from './schemas/message.schema';
import { Swipe, SwipeDocument } from '../users/schemas/swipe.schema';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Swipe.name) private swipeModel: Model<SwipeDocument>,
  ) {}

  /**
   * Get or create a conversation between two users
   * Only allows conversation if users are mutual matches
   */
  async getOrCreateConversation(user1Id: string, user2Id: string): Promise<ConversationDocument> {
    // Check if users are mutual matches
    const user1LikedUser2 = await this.swipeModel.findOne({
      swiperId: user1Id,
      swipedId: user2Id,
      action: 'like',
    }).exec();

    const user2LikedUser1 = await this.swipeModel.findOne({
      swiperId: user2Id,
      swipedId: user1Id,
      action: 'like',
    }).exec();

    if (!user1LikedUser2 || !user2LikedUser1) {
      throw new Error('Users must be mutual matches to start a conversation');
    }

    // Ensure consistent ordering (smaller UID first)
    const [participant1, participant2] = [user1Id, user2Id].sort();
    
    let conversation = await this.conversationModel.findOne({
      participant1,
      participant2,
    }).exec();

    if (!conversation) {
      conversation = await this.conversationModel.create({
        participant1,
        participant2,
        unreadCounts: {
          [participant1]: 0,
          [participant2]: 0,
        },
      });
      console.log(`[Chat] Created new conversation between ${participant1} and ${participant2}`);
    }

    return conversation;
  }

  /**
   * Get all conversations for a user
   */
  async getUserConversations(userId: string): Promise<ConversationDocument[]> {
    const conversations = await this.conversationModel
      .find({
        $or: [
          { participant1: userId },
          { participant2: userId },
        ],
      })
      .sort({ lastMessageAt: -1 })
      .exec();

    return conversations;
  }

  /**
   * Get messages for a conversation
   */
  async getConversationMessages(
    conversationId: string,
    userId: string,
    limit: number = 50,
  ): Promise<MessageDocument[]> {
    // Verify user is part of conversation
    const conversation = await this.conversationModel.findById(conversationId).exec();
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (conversation.participant1 !== userId && conversation.participant2 !== userId) {
      throw new Error('Unauthorized: User is not part of this conversation');
    }

    // Mark messages as read
    await this.messageModel.updateMany(
      {
        conversationId,
        senderId: { $ne: userId },
        read: false,
      },
      {
        $set: { read: true, readAt: new Date() },
      },
    ).exec();

    // Reset unread count for this user
    await this.conversationModel.findByIdAndUpdate(conversationId, {
      $set: {
        [`unreadCounts.${userId}`]: 0,
      },
    }).exec();

    // Get messages
    const messages = await this.messageModel
      .find({ conversationId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    return messages.reverse(); // Return in chronological order
  }

  /**
   * Send a message
   */
  async sendMessage(userId: string, createMessageDto: CreateMessageDto): Promise<MessageDocument> {
    // Verify conversation exists and user is part of it
    const conversation = await this.conversationModel.findById(createMessageDto.conversationId).exec();
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (conversation.participant1 !== userId && conversation.participant2 !== userId) {
      throw new Error('Unauthorized: User is not part of this conversation');
    }

    // Create message
    const message = await this.messageModel.create({
      conversationId: createMessageDto.conversationId,
      senderId: userId,
      content: createMessageDto.content,
      read: false,
    });

    // Update conversation
    const otherUserId = conversation.participant1 === userId 
      ? conversation.participant2 
      : conversation.participant1;

    await this.conversationModel.findByIdAndUpdate(createMessageDto.conversationId, {
      $set: {
        lastMessage: createMessageDto.content,
        lastMessageAt: new Date(),
      },
      $inc: {
        [`unreadCounts.${otherUserId}`]: 1,
      },
    }).exec();

    console.log(`[Chat] Message sent from ${userId} to conversation ${createMessageDto.conversationId}`);
    return message;
  }

  /**
   * Get conversation by ID (with authorization check)
   */
  async getConversationById(conversationId: string, userId: string): Promise<ConversationDocument | null> {
    const conversation = await this.conversationModel.findById(conversationId).exec();
    
    if (!conversation) {
      return null;
    }

    if (conversation.participant1 !== userId && conversation.participant2 !== userId) {
      throw new Error('Unauthorized: User is not part of this conversation');
    }

    return conversation;
  }
}


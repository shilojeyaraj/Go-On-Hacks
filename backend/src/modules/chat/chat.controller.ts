import { Controller, Get, Post, Body, Param, Query, Request, UseGuards, UseInterceptors } from '@nestjs/common';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { AuthUserSyncInterceptor } from '../../common/interceptors/auth-user-sync.interceptor';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('chat')
@UseGuards(FirebaseAuthGuard)
@UseInterceptors(AuthUserSyncInterceptor)
export class ChatController {
  constructor(private chatService: ChatService) {}

  /**
   * Get all conversations for the current user
   */
  @Get('conversations')
  async getConversations(@Request() req) {
    return this.chatService.getUserConversations(req.user.uid);
  }

  /**
   * Get or create a conversation with another user
   */
  @Get('conversations/with/:userId')
  async getOrCreateConversation(@Request() req, @Param('userId') otherUserId: string) {
    return this.chatService.getOrCreateConversation(req.user.uid, otherUserId);
  }

  /**
   * Get messages for a conversation
   */
  @Get('conversations/:conversationId/messages')
  async getMessages(
    @Request() req,
    @Param('conversationId') conversationId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.chatService.getConversationMessages(conversationId, req.user.uid, limitNum);
  }

  /**
   * Send a message
   */
  @Post('messages')
  async sendMessage(@Request() req, @Body() createMessageDto: CreateMessageDto) {
    return this.chatService.sendMessage(req.user.uid, createMessageDto);
  }

  /**
   * Get a specific conversation
   */
  @Get('conversations/:conversationId')
  async getConversation(@Request() req, @Param('conversationId') conversationId: string) {
    return this.chatService.getConversationById(conversationId, req.user.uid);
  }
}


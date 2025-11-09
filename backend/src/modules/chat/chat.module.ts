import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Conversation, ConversationSchema } from './schemas/conversation.schema';
import { Message, MessageSchema } from './schemas/message.schema';
import { Swipe, SwipeSchema } from '../users/schemas/swipe.schema';
import { UsersModule } from '../users/users.module';
import { AuthUserSyncInterceptor } from '../../common/interceptors/auth-user-sync.interceptor';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Swipe.name, schema: SwipeSchema },
    ]),
    UsersModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, AuthUserSyncInterceptor],
  exports: [ChatService],
})
export class ChatModule {}


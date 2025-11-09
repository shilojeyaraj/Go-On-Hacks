import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UserSchema } from './schemas/user.schema';
import { Swipe, SwipeSchema } from './schemas/swipe.schema';
import { Conversation, ConversationSchema } from '../chat/schemas/conversation.schema';
import { AuthUserSyncInterceptor } from '../../common/interceptors/auth-user-sync.interceptor';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Swipe.name, schema: SwipeSchema },
      { name: Conversation.name, schema: ConversationSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService, AuthUserSyncInterceptor],
  exports: [UsersService, AuthUserSyncInterceptor],
})
export class UsersModule {}


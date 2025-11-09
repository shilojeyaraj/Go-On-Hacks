import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { UsersModule } from './modules/users/users.module';
import { GesturesModule } from './modules/gestures/gestures.module';
import { ChatModule } from './modules/chat/chat.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';

// Check if MongoDB should be enabled (set MONGODB_ENABLED=false to disable)
const MONGODB_ENABLED = process.env.MONGODB_ENABLED !== 'false';
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ToeGether';

@Module({
  imports: [
    // Conditionally include MongoDB only if enabled
    ...(MONGODB_ENABLED
      ? [
          MongooseModule.forRootAsync({
            useFactory: async () => {
              return {
                uri: mongoUri,
                retryWrites: true,
                retryReads: true,
                serverSelectionTimeoutMS: 2000, // Fast timeout for local testing
                connectTimeoutMS: 2000,
                // Allow app to start even if MongoDB is unavailable
              };
            },
          }),
        ]
      : []),
    // Only include UsersModule, ChatModule, and SubscriptionsModule if MongoDB is enabled
    ...(MONGODB_ENABLED ? [UsersModule, ChatModule, SubscriptionsModule] : []),
    GesturesModule,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(@InjectConnection() private connection?: Connection) {}

  onModuleInit() {
    // Only set up connection logging if MongoDB is enabled and connection exists
    if (!MONGODB_ENABLED || !this.connection) {
      return;
    }

    // Log connection status
    if (this.connection.readyState === 1) {
      console.log('[MongoDB] Connected successfully');
      console.log(`[MongoDB] Database: ${this.connection.db?.databaseName || 'ToeGether'}`);
      const safeUri = mongoUri.replace(/\/\/.*@/, '//***:***@');
      console.log(`[MongoDB] Connection URI: ${safeUri}`);
    }

    // Set up event listeners
    this.connection.on('connected', () => {
      console.log('[MongoDB] Connected successfully');
      console.log(`[MongoDB] Database: ${this.connection.db?.databaseName || 'ToeGether'}`);
    });

    this.connection.on('error', (err) => {
      console.error('[MongoDB] Connection error:', err.message);
    });

    this.connection.on('disconnected', () => {
      console.log('[MongoDB] Disconnected');
    });

    this.connection.on('reconnected', () => {
      console.log('[MongoDB] Reconnected');
    });
  }
}

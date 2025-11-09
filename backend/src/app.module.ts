import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './modules/users/users.module';
import { GesturesModule } from './modules/gestures/gestures.module';

// Check if MongoDB should be enabled (set MONGODB_ENABLED=false to disable)
const MONGODB_ENABLED = process.env.MONGODB_ENABLED !== 'false';

@Module({
  imports: [
    // Conditionally include MongoDB only if enabled
    ...(MONGODB_ENABLED
      ? [
          MongooseModule.forRootAsync({
            useFactory: async () => {
              const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ToeGether';
              return {
                uri,
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
    // Only include UsersModule if MongoDB is enabled
    ...(MONGODB_ENABLED ? [UsersModule] : []),
    GesturesModule,
  ],
})
export class AppModule {}

import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './modules/users/users.module';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ToeGether';

@Module({
  imports: [
    MongooseModule.forRoot(mongoUri),
    UsersModule,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(@InjectConnection() private connection: Connection) {}

  onModuleInit() {
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

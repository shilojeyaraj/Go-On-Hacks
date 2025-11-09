import './config/env-loader';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, {
      // Don't abort on MongoDB connection errors
      abortOnError: false,
    });
    
    app.enableCors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3001',
      credentials: true,
    });

    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`✅ Backend is running on: http://localhost:${port}`);
    
    // Check MongoDB status
    const mongoEnabled = process.env.MONGODB_ENABLED !== 'false';
    if (!mongoEnabled) {
      console.log(`ℹ️  MongoDB is disabled (MONGODB_ENABLED=false). Using Firebase Auth only.`);
    } else {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ToeGether';
      if (mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1')) {
        console.log(`⚠️  MongoDB URI points to localhost. If MongoDB isn't running, user sync will fail but auth will still work.`);
      } else {
        console.log(`📦 MongoDB configured: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
      }
    }
  } catch (error) {
    console.error('Failed to start backend:', error);
    process.exit(1);
  }
}
bootstrap();

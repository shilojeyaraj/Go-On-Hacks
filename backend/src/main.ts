import './config/env-loader';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // Disable default body parser to configure custom limits
  });

  // Increase body size limit to handle base64 image uploads (10MB)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  // Allow multiple frontend origins for testing (localhost:3000-3003)
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3001',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
  ].filter((origin, index, self) => self.indexOf(origin) === index); // Remove duplicates

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // In development, allow any localhost origin
        if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
          callback(null, true);
        } else if (origin.includes('.onrender.com')) {
          // Allow Render preview URLs (for PR previews and staging)
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // Cache preflight requests for 24 hours
  });

  try {
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`Backend is running on: http://localhost:${port}`);
    
    // Check MongoDB status
    const mongoEnabled = process.env.MONGODB_ENABLED !== 'false';
    if (!mongoEnabled) {
      console.log(`MongoDB is disabled (MONGODB_ENABLED=false). Using Firebase Auth only.`);
    } else {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ToeGether';
      if (mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1')) {
        console.log(`MongoDB URI points to localhost. If MongoDB isn't running, user sync will fail but auth will still work.`);
      } else {
        console.log(`MongoDB configured: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
      }
    }
  } catch (error) {
    console.error('Failed to start backend:', error);
    process.exit(1);
  }
}
bootstrap();

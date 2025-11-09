import { Injectable, NestMiddleware } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { UsersService } from '../../modules/users/users.service';
import { RequestWithUser } from '../interfaces/request.interface';

@Injectable()
export class AuthUserSyncMiddleware implements NestMiddleware {
  constructor(private usersService: UsersService) {}

  async use(req: RequestWithUser, res: Response, next: NextFunction) {
    const decoded = req.user as {
      uid: string;
      email?: string;
      name?: string;
      picture?: string;
    };

    if (decoded?.uid) {
      try {
        await this.usersService.upsertFromFirebase(decoded);
      } catch (error: any) {
        // Log error but don't block the request if MongoDB is unavailable
        console.warn('Failed to sync user to MongoDB (MongoDB may be unavailable):', error.message);
      }
    }

    next();
  }
}


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
      await this.usersService.upsertFromFirebase(decoded);
    }

    next();
  }
}


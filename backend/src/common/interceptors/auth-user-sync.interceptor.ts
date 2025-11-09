import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { UsersService } from '../../modules/users/users.service';
import { RequestWithUser } from '../interfaces/request.interface';

@Injectable()
export class AuthUserSyncInterceptor implements NestInterceptor {
  constructor(private usersService: UsersService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const decoded = request.user;

    // Interceptors run after guards, so req.user should be set by FirebaseAuthGuard
    if (decoded?.uid) {
      console.log(`[Interceptor] Syncing user to MongoDB: ${decoded.uid}`);
      // Run sync asynchronously without blocking the request
      this.usersService.upsertFromFirebase(decoded).then(() => {
        console.log(`[Interceptor] User sync completed: ${decoded.uid}`);
      }).catch((error: any) => {
        console.error(`[Interceptor] Failed to sync user ${decoded.uid}:`, error.message);
      });
    }

    return next.handle();
  }
}

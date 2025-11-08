import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { firebaseAdmin } from '../../config/firebase-admin.provider';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header = request.headers['authorization'];

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing token');
    }

    const idToken = header.substring(7);

    try {
      const decoded = await firebaseAdmin.auth().verifyIdToken(idToken, true);
      request.user = decoded;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}


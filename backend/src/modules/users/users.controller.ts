import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(FirebaseAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  getProfile(@Request() req) {
    return {
      uid: req.user.uid,
      email: req.user.email,
      name: req.user.name,
      picture: req.user.picture,
    };
  }

  @Get('me')
  async getMe(@Request() req) {
    const user = await this.usersService.findByUid(req.user.uid);
    return user;
  }
}


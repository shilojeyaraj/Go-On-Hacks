import { Controller, Get, Put, Body, Request, UseGuards, UseInterceptors } from '@nestjs/common';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { UsersService } from './users.service';
import { UpdateProfileDto, UpdatePreferencesDto } from './dto/update-profile.dto';
import { AuthUserSyncInterceptor } from '../../common/interceptors/auth-user-sync.interceptor';

@Controller('users')
@UseGuards(FirebaseAuthGuard)
@UseInterceptors(AuthUserSyncInterceptor)
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
    // Middleware should have created the user, but ensure it exists
    let user = await this.usersService.findByUid(req.user.uid);
    if (!user) {
      // User doesn't exist, create them from Firebase token
      console.log(`[Controller] User not found in getMe, creating from Firebase token`);
      user = await this.usersService.upsertFromFirebase(req.user);
    }
    return user;
  }

  @Put('me/profile')
  async updateProfile(@Request() req, @Body() updateDto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.uid, updateDto);
  }

  @Put('me/preferences')
  async updatePreferences(@Request() req, @Body() updateDto: UpdatePreferencesDto) {
    return this.usersService.updatePreferences(req.user.uid, updateDto);
  }

  @Get('matches')
  async getMatches(@Request() req) {
    return this.usersService.findCompletedProfiles(req.user.uid);
  }
}


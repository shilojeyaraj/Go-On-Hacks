import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Swipe, SwipeDocument } from './schemas/swipe.schema';
import { UpdateProfileDto, UpdatePreferencesDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Swipe.name) private swipeModel: Model<SwipeDocument>,
  ) {}

  async upsertFromFirebase(decoded: any): Promise<UserDocument> {
    const updateData: any = {
      uid: decoded.uid,
    };

    // Store email if available (for email/password login)
    if (decoded.email) {
      updateData.email = decoded.email;
    }

    // Store display name and photo if available
    if (decoded.name) {
      updateData.displayName = decoded.name;
    }
    if (decoded.picture) {
      updateData.photoURL = decoded.picture;
    }

    // Store Firebase provider data (includes provider ID, UID, etc.)
    // Firebase Admin DecodedIdToken includes firebase.identities and firebase.sign_in_provider
    if (decoded.firebase) {
      updateData.providerData = {
        identities: decoded.firebase.identities,
        sign_in_provider: decoded.firebase.sign_in_provider,
      };
    }

    // Check if user exists
    const existingUser = await this.userModel.findOne({ uid: decoded.uid }).exec();
    const isNewUser = !existingUser;

    const result = await this.userModel.findOneAndUpdate(
      { uid: decoded.uid },
      {
        $set: updateData,
        $setOnInsert: { role: 'user' },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();

    if (isNewUser) {
      console.log(`[MongoDB] New user created: ${decoded.uid} (${decoded.email || 'no email'})`);
    } else {
      console.log(`[MongoDB] User updated: ${decoded.uid} (${decoded.email || 'no email'})`);
    }

    return result;
  }

  async findByUid(uid: string): Promise<UserDocument | null> {
    console.log(`[MongoDB] Finding user by UID: ${uid}`);
    const user = await this.userModel.findOne({ uid }).exec();
    if (user) {
      console.log(`[MongoDB] User found: ${uid}`);
    } else {
      console.log(`[MongoDB] User not found: ${uid}`);
    }
    return user;
  }

  async findAll(): Promise<UserDocument[]> {
    console.log(`[MongoDB] Finding all users`);
    const users = await this.userModel.find().exec();
    console.log(`[MongoDB] Found ${users.length} users`);
    return users;
  }

  async findCompletedProfiles(excludeUid?: string): Promise<UserDocument[]> {
    const query: any = { profileCompleted: true };
    if (excludeUid) {
      query.uid = { $ne: excludeUid };
    }
    console.log(`[MongoDB] Finding completed profiles${excludeUid ? ` (excluding ${excludeUid})` : ''}`);
    const profiles = await this.userModel.find(query).exec();
    console.log(`[MongoDB] Found ${profiles.length} completed profiles`);
    return profiles;
  }

  async updateProfile(uid: string, updateDto: UpdateProfileDto): Promise<UserDocument> {
    console.log(`[MongoDB] Updating profile for UID: ${uid}`);
    // Remove undefined values to avoid clearing fields
    const updateData: any = {};
    if (updateDto.fullName !== undefined) updateData.fullName = updateDto.fullName;
    if (updateDto.profilePicture !== undefined) updateData.profilePicture = updateDto.profilePicture;
    if (updateDto.feetPhotos !== undefined) updateData.feetPhotos = updateDto.feetPhotos;
    if (updateDto.bio !== undefined) updateData.bio = updateDto.bio;
    
    console.log(`[MongoDB] Update data:`, Object.keys(updateData).join(', '));
    
    // Check if user exists and get current data for profile completion check
    const user = await this.findByUid(uid);
    if (user) {
      const mergedData = {
        ...user.toObject(),
        ...updateData,
      };
      updateData.profileCompleted = this.checkProfileCompletion(mergedData);
    } else {
      // User doesn't exist, create them with default role
      console.log(`[MongoDB] User not found, creating new user: ${uid}`);
      updateData.uid = uid;
      updateData.role = 'user';
      // Check profile completion with just the update data
      updateData.profileCompleted = this.checkProfileCompletion(updateData);
    }

    const result = await this.userModel.findOneAndUpdate(
      { uid },
      { $set: updateData },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
    
    if (result) {
      console.log(`[MongoDB] Profile updated successfully for UID: ${uid}`);
      if (updateData.profilePicture) {
        const pictureLength = updateData.profilePicture.length;
        console.log(`[MongoDB] Profile picture saved (${pictureLength} characters)`);
      }
    } else {
      console.log(`[MongoDB] Profile update failed for UID: ${uid}`);
    }
    
    return result;
  }

  async updatePreferences(uid: string, updateDto: UpdatePreferencesDto): Promise<UserDocument> {
    console.log(`[MongoDB] Updating preferences for UID: ${uid}`);
    console.log(`[MongoDB] Preferences data:`, Object.keys(updateDto).join(', '));
    
    // Check if user exists
    const user = await this.findByUid(uid);
    const updateData: any = { ...updateDto };
    
    if (!user) {
      console.log(`[MongoDB] User not found, creating new user: ${uid}`);
      updateData.uid = uid;
      updateData.role = 'user';
    }
    
    const result = await this.userModel.findOneAndUpdate(
      { uid },
      { $set: updateData },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
    
    if (result) {
      console.log(`[MongoDB] Preferences updated successfully for UID: ${uid}`);
    } else {
      console.log(`[MongoDB] Preferences update failed for UID: ${uid}`);
    }
    
    return result;
  }

  private checkProfileCompletion(user: any): boolean {
    return !!(
      user.profilePicture &&
      user.feetPhotos &&
      user.feetPhotos.length > 0 &&
      user.fullName
    );
  }

  /**
   * Record a swipe action (like or pass)
   */
  async swipe(swiperId: string, swipedId: string, action: 'like' | 'pass'): Promise<{ isMatch: boolean; message?: string }> {
    if (swiperId === swipedId) {
      throw new Error('Cannot swipe on yourself');
    }

    // Check if user already swiped on this person
    const existingSwipe = await this.swipeModel.findOne({
      swiperId,
      swipedId,
    }).exec();

    if (existingSwipe) {
      // Update existing swipe
      existingSwipe.action = action;
      await existingSwipe.save();
    } else {
      // Create new swipe
      await this.swipeModel.create({
        swiperId,
        swipedId,
        action,
      });
    }

    // Check if it's a mutual like (match)
    if (action === 'like') {
      const mutualLike = await this.swipeModel.findOne({
        swiperId: swipedId,
        swipedId: swiperId,
        action: 'like',
      }).exec();

      if (mutualLike) {
        console.log(`[Match] Mutual match between ${swiperId} and ${swipedId}`);
        return { isMatch: true, message: 'It\'s a match!' };
      }
    }

    return { isMatch: false };
  }

  /**
   * Get mutual matches (users who have both swiped right on each other)
   */
  async getMutualMatches(userId: string): Promise<UserDocument[]> {
    // Find all users this user has liked
    const userLikes = await this.swipeModel.find({
      swiperId: userId,
      action: 'like',
    }).exec();

    const likedUserIds = userLikes.map(swipe => swipe.swipedId);

    if (likedUserIds.length === 0) {
      return [];
    }

    // Find all users who have also liked this user
    const mutualLikes = await this.swipeModel.find({
      swiperId: { $in: likedUserIds },
      swipedId: userId,
      action: 'like',
    }).exec();

    const mutualMatchIds = mutualLikes.map(swipe => swipe.swiperId);

    if (mutualMatchIds.length === 0) {
      return [];
    }

    // Get user profiles for mutual matches
    const matches = await this.userModel.find({
      uid: { $in: mutualMatchIds },
      profileCompleted: true,
    }).exec();

    console.log(`[Match] Found ${matches.length} mutual matches for ${userId}`);
    return matches;
  }

  /**
   * Get profiles the user hasn't swiped on yet (for discovery/swipe page)
   */
  async getDiscoverProfiles(userId: string): Promise<UserDocument[]> {
    // Get all users this user has already swiped on
    const swipedUsers = await this.swipeModel.find({
      swiperId: userId,
    }).exec();

    const swipedIds = swipedUsers.map(swipe => swipe.swipedId);
    swipedIds.push(userId); // Exclude self

    // Get all completed profiles that haven't been swiped on
    const profiles = await this.userModel.find({
      uid: { $nin: swipedIds },
      profileCompleted: true,
    }).exec();

    console.log(`[Discover] Found ${profiles.length} profiles for ${userId} to discover`);
    return profiles;
  }
}


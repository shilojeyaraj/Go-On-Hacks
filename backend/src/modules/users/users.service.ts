import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async upsertFromFirebase(decoded: any): Promise<UserDocument> {
    return this.userModel.findOneAndUpdate(
      { uid: decoded.uid },
      {
        uid: decoded.uid,
        email: decoded.email,
        displayName: decoded.name,
        photoURL: decoded.picture,
        // Preserve role if user exists, otherwise use default 'user'
        $setOnInsert: { role: 'user' },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  async findByUid(uid: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ uid }).exec();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().exec();
  }
}


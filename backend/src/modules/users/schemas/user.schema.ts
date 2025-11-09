import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  uid: string;

  @Prop()
  email?: string;

  @Prop()
  displayName?: string;

  @Prop()
  photoURL?: string;

  @Prop({ default: 'user' })
  role: 'user' | 'admin';

  @Prop({ type: Object })
  providerData?: any;

  // Profile fields
  @Prop()
  fullName?: string;

  @Prop()
  profilePicture?: string;

  @Prop({ type: [String], default: [] })
  feetPhotos?: string[];

  @Prop()
  bio?: string;

  // Preferences fields
  @Prop()
  archType?: string;

  @Prop()
  archSize?: string;

  @Prop()
  age?: number;

  @Prop()
  familyStatus?: string;

  @Prop({ type: [String], default: [] })
  preferredArchTypes?: string[];

  @Prop({ type: [String], default: [] })
  preferredArchSizes?: string[];

  // Profile completion status
  @Prop({ default: false })
  profileCompleted?: boolean;

  // Premium subscription fields
  @Prop({ default: false })
  isPremium?: boolean;

  @Prop()
  subscriptionId?: string; // Stripe subscription ID

  @Prop()
  subscriptionStatus?: string; // active, canceled, past_due, etc.

  @Prop()
  premiumExpiresAt?: Date;

  // Daily swipe tracking
  @Prop({ type: Object, default: {} })
  swipeTracking?: {
    date: string; // YYYY-MM-DD format
    count: number;
  };

  // Timestamps (automatically added by Mongoose when timestamps: true)
  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
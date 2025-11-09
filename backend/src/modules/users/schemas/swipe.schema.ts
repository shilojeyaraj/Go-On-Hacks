import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SwipeDocument = HydratedDocument<Swipe>;

@Schema({ timestamps: true })
export class Swipe {
  @Prop({ required: true, index: true })
  swiperId: string; // UID of user who swiped

  @Prop({ required: true, index: true })
  swipedId: string; // UID of user who was swiped on

  @Prop({ required: true, enum: ['like', 'pass'] })
  action: 'like' | 'pass';

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

export const SwipeSchema = SchemaFactory.createForClass(Swipe);

// Compound index to prevent duplicate swipes
SwipeSchema.index({ swiperId: 1, swipedId: 1 }, { unique: true });

// Index for finding mutual likes
SwipeSchema.index({ swipedId: 1, action: 1 });


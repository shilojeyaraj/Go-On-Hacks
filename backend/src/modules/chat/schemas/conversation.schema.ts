import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ required: true, index: true })
  participant1: string; // UID of first participant

  @Prop({ required: true, index: true })
  participant2: string; // UID of second participant

  @Prop({ default: Date.now })
  lastMessageAt?: Date;

  @Prop()
  lastMessage?: string;

  @Prop({ type: Object, default: {} })
  unreadCounts?: {
    [uid: string]: number;
  };

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

// Create compound index for efficient queries
ConversationSchema.index({ participant1: 1, participant2: 1 }, { unique: true });


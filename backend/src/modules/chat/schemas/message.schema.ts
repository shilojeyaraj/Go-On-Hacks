import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ timestamps: true })
export class Message {
  @Prop({ required: true, index: true })
  conversationId: string; // Reference to Conversation _id

  @Prop({ required: true })
  senderId: string; // UID of sender

  @Prop({ required: true })
  content: string;

  @Prop({ default: false })
  read?: boolean;

  @Prop()
  readAt?: Date;

  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Index for efficient message queries
MessageSchema.index({ conversationId: 1, createdAt: -1 });


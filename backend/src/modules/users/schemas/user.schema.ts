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
}

export const UserSchema = SchemaFactory.createForClass(User);


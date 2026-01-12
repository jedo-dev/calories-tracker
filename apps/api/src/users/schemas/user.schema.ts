import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, index: true })
  tgUserId: number;

  @Prop({ sparse: true, index: true })
  username?: string;

  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop()
  displayName?: string;

  @Prop({ default: true })
  isPublicProfile: boolean;

  @Prop({ default: '🦊' })
  avatarEmoji: string;
}

export const UserSchema = SchemaFactory.createForClass(User);


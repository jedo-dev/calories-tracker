import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop()
  tgUserId?: number;

  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ sparse: true, index: true })
  username?: string;

  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop()
  createdAt: Date;

  @Prop()
  displayName?: string;

  @Prop({ default: true })
  isPublicProfile: boolean;

  @Prop({ default: '🦊' })
  avatarEmoji: string;

  // Profile fields
  @Prop({
    type: {
      weightKg: { type: Number },
      heightCm: { type: Number },
      age: { type: Number },
      gender: { type: String, enum: ['male', 'female'] },
      activityLevel: { type: String, enum: ['low', 'medium', 'high', 'very_high'] },
      goal: { type: String, enum: ['lose', 'maintain', 'gain'] },
      startWeightKg: { type: Number },
      targetWeightKg: { type: Number },
      targetDate: { type: String },
      updatedAt: { type: Date },
    },
    required: false,
  })
  profile?: {
    weightKg?: number;
    heightCm?: number;
    age?: number;
    gender?: 'male' | 'female';
    activityLevel?: 'low' | 'medium' | 'high' | 'very_high';
    goal?: 'lose' | 'maintain' | 'gain';
    startWeightKg?: number;
    targetWeightKg?: number;
    targetDate?: string;
    updatedAt?: Date;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index(
  { tgUserId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      tgUserId: { $type: 'number' },
    },
  },
);

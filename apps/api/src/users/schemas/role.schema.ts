import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RoleDocument = Role & Document;

// Registry of assignable roles. User.role stores the role key; permissions
// are a forward-looking hook for finer-grained access control.
@Schema({ timestamps: true })
export class Role {
  @Prop({ required: true, unique: true })
  key: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ type: [String], default: [] })
  permissions: string[];
}

export const RoleSchema = SchemaFactory.createForClass(Role);

export const DEFAULT_ROLES = [
  {
    key: 'admin',
    name: 'Администратор',
    description: 'Полный доступ, включая редактор контента тренировок',
    permissions: ['workout-content:edit', 'users:manage'],
  },
  {
    key: 'trainer',
    name: 'Тренер',
    description: 'Редактирование программ, упражнений и категорий тренировок',
    permissions: ['workout-content:edit'],
  },
  {
    key: 'user',
    name: 'Пользователь',
    description: 'Обычный пользователь',
    permissions: [],
  },
];

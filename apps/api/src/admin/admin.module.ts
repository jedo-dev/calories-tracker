import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Role, RoleSchema } from '../users/schemas/role.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
    ]),
  ],
  controllers: [AdminController],
})
export class AdminModule {}

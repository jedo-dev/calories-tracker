// Assigns a role to a user and (re)seeds the roles registry.
// Usage: node dist/scripts/set-role.js <email> <admin|trainer|user>
//   dev: pnpm --filter api set-role -- user@example.com admin
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { DEFAULT_ROLES } from '../src/users/schemas/role.schema';

async function main() {
  const [email, roleKey] = process.argv.slice(2).filter((a) => a !== '--');
  if (!email || !roleKey) {
    console.error('Usage: set-role <email> <admin|trainer|user>');
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule);
  const roleModel = app.get(getModelToken('Role'));
  const userModel = app.get(getModelToken('User'));

  for (const role of DEFAULT_ROLES) {
    await roleModel.updateOne({ key: role.key }, { $set: role }, { upsert: true });
  }
  console.log(`Roles registry: ${DEFAULT_ROLES.map((r) => r.key).join(', ')}`);

  if (!DEFAULT_ROLES.some((r) => r.key === roleKey)) {
    console.error(`Unknown role "${roleKey}"`);
    process.exit(1);
  }

  const user = await userModel.findOne({ email });
  if (!user) {
    console.error(`User with email "${email}" not found`);
    process.exit(1);
  }
  user.role = roleKey;
  await user.save();
  console.log(`${email} -> role "${roleKey}"`);

  await app.close();
}

main().catch((err) => {
  console.error('set-role failed:', err);
  process.exit(1);
});

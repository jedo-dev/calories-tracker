import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';

// Global: почта нужна auth-модулю и в будущем — уведомлениям/биллингу
@Global()
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}

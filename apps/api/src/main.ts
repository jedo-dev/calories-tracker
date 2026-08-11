import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Фото для AI-распознавания приходит base64 в JSON — дефолтных 100kb мало
  app.use(json({ limit: '4mb' }));

  // Глобальная валидация: неизвестные поля вырезаются из тела запроса
  // (защита от mass-assignment), декорированные DTO валидируются везде.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // В проде ограничиваем CORS списком доменов из CORS_ORIGIN (через запятую);
  // без переменной — поведение как раньше (dev: любой origin).
  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
    : true;
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();

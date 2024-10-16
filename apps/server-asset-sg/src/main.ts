import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { PrismaExceptionFilter } from '@/core/exception-filters/prisma.exception-filter';

export * from 'fp-ts';
export * from '@prisma/client';

const API_PREFIX = 'api';
const API_PORT = process.env.PORT || 3333;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new PrismaExceptionFilter());
  await app.listen(API_PORT);
  Logger.log(`🚀 application is running on: http://localhost:${API_PORT}/${API_PREFIX}`);
}

bootstrap().catch((err: unknown) => {
  console.error(`${err}`);
});

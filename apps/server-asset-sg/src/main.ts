import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppLogger } from '@/app.logger';
import { PrismaExceptionFilter } from '@/core/exception-filters/prisma.exception-filter';

export * from 'fp-ts';
export * from '@prisma/client';

const API_PREFIX = 'api';
const API_PORT = process.env.PORT || 3333;

process.on('warning', (e) => console.warn(e.stack));

async function bootstrap(): Promise<void> {
  const logger = new AppLogger();
  const app = await NestFactory.create(AppModule, { logger });
  app.use(helmet());
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new PrismaExceptionFilter());
  await app.listen(API_PORT);
  logger.log('🚀 application is running!', { url: new URL(`http://localhost:${API_PORT}/${API_PREFIX}`) });
}

bootstrap().catch((err: unknown) => {
  console.error(`${err}`);
});

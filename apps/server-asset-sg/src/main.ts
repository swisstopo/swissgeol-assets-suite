import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppLogger } from '@/app.logger';
import { PrismaExceptionFilter } from '@/core/exception-filters/prisma.exception-filter';
import { FileExtractionService } from '@/features/assets/files/file-processors/file-extraction/file-extraction.service';
import { FileOcrService } from '@/features/assets/files/file-processors/file-ocr/file-ocr.service';
import { AssetSyncService } from '@/features/assets/sync/asset-sync.service';
import { FileFulltextSyncService } from '@/features/assets/sync/file-fulltext-sync.service';
import { UserService } from '@/features/users/user.service';

export * from 'fp-ts';
export * from '@prisma/client';

const API_PREFIX = 'api';
const API_PORT = process.env.PORT || 3333;

process.on('warning', (e) => console.warn(e.stack));

async function bootstrap(): Promise<void> {
  const logger = new AppLogger();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { logger });
  app.use(helmet());
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new PrismaExceptionFilter());
  app.use(compression());
  app.set('query-parser', 'extended'); // see https://docs.nestjs.com/migration-guide#query-parameters-parsing

  const userService = app.get(UserService);
  await userService.startCronJob();

  const assetSyncService = app.get(AssetSyncService);
  await assetSyncService.startCronJob();

  const fileFulltextSyncService = app.get(FileFulltextSyncService);
  await fileFulltextSyncService.init();

  const fileOcrService = app.get(FileOcrService);
  await fileOcrService.processRemaining();

  const fileExtractionService = app.get(FileExtractionService);
  await fileExtractionService.processRemaining();

  await app.listen(API_PORT);
  logger.log('🚀 application is running!', { url: new URL(`http://localhost:${API_PORT}/${API_PREFIX}`) });
}

bootstrap().catch((err: unknown) => {
  console.error(err);
});

import 'reflect-metadata';

import { exit } from 'node:process';
import { CommandFactory } from 'nest-commander';
import { AppLogger } from '@/app.logger';
import { AppModule } from '@/app.module';

async function bootstrap() {
  const logger = new AppLogger({ minLevel: 'log' });
  await CommandFactory.run(AppModule, {
    logger,
    errorHandler: (...params) => {
      logger.fatal(...params);
      exit(1);
    },
    serviceErrorHandler: (...params) => {
      logger.fatal(...params);
      exit(1);
    },
  });
}

bootstrap().catch((err: unknown) => {
  console.error(err);
  exit(1);
});

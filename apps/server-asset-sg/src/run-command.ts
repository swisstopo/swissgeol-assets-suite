import 'reflect-metadata';

import { CommandFactory } from 'nest-commander';
import { AppLogger } from '@/app.logger';
import { AppModule } from '@/app.module';

async function bootstrap() {
  const logger = new AppLogger({ minLevel: 'log' });
  await CommandFactory.run(AppModule, { logger });
}

bootstrap().catch((err: unknown) => {
  console.error(err);
});

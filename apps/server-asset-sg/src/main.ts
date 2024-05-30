import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

export * from 'fp-ts';
export * from '@prisma/client';

const API_PREFIX = 'api';
const API_PORT = process.env.PORT || 3333;

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule);
    app.setGlobalPrefix(API_PREFIX);
    await app.listen(API_PORT);
    Logger.log(`🚀 application is running on: http://localhost:${API_PORT}/${API_PREFIX}`);
}

bootstrap().catch((err: unknown) => {
  console.error(`${err}`)
});

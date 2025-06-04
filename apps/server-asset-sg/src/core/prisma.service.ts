import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  // Activate this constructor to get query logs.
  // constructor() {
  //   super({ log: ['query', 'error'] });
  // }

  async onModuleInit() {
    await this.$connect();
  }
}

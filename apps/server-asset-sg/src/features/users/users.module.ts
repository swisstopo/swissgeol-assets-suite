import { Module } from '@nestjs/common';
import { PrismaService } from '@/core/prisma.service';
import { UserRepo } from '@/features/users/user.repo';
import { UserService } from '@/features/users/user.service';
import { UsersController } from '@/features/users/users.controller';

@Module({
  controllers: [UsersController],
  providers: [UserRepo, UserService, PrismaService],
  exports: [UserRepo],
})
export class UsersModule {}

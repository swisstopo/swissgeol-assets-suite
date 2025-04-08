import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from '@/app.controller';
import { AuthorizationGuard } from '@/core/guards/authorization-guard.service';
import { JwtMiddleware } from '@/core/middleware/jwt.middleware';
import { PrismaService } from '@/core/prisma.service';
import { AssetsModule } from '@/features/assets/assets.module';
import { ContactRepo } from '@/features/contacts/contact.repo';
import { ContactsController } from '@/features/contacts/contacts.controller';
import { StudiesController } from '@/features/studies/studies.controller';
import { StudyRepo } from '@/features/studies/study.repo';
import { UserRepo } from '@/features/users/user.repo';
import { UserService } from '@/features/users/user.service';
import { UsersController } from '@/features/users/users.controller';
import { WorkgroupRepo } from '@/features/workgroups/workgroup.repo';
import { WorkgroupsController } from '@/features/workgroups/workgroups.controller';

@Module({
  controllers: [AppController, ContactsController, StudiesController, UsersController, WorkgroupsController],
  imports: [HttpModule, ScheduleModule.forRoot(), CacheModule.register(), AssetsModule],
  providers: [
    ContactRepo,
    PrismaService,
    StudyRepo,
    UserRepo,
    UserService,
    WorkgroupRepo,
    {
      provide: APP_GUARD,
      useClass: AuthorizationGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).exclude('/config', 'ocr/(.*)').forRoutes('*');
  }
}

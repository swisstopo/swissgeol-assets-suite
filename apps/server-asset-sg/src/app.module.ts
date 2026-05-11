import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from '@/app.controller';
import { FixturesCreateCommand } from '@/commands/fixtures-create.command';
import { AuthorizationGuard } from '@/core/guards/authorization-guard.service';
import { JwtMiddleware } from '@/core/middleware/jwt.middleware';
import { PrismaService } from '@/core/prisma.service';
import { AssetModule } from '@/features/assets/asset.module';
import { ContactRepo } from '@/features/contacts/contact.repo';
import { ContactsController } from '@/features/contacts/contacts.controller';
import { GeometriesController } from '@/features/geometries/geometries.controller';
import { GeometryRepo } from '@/features/geometries/geometry.repo';
import { ReferenceDataController } from '@/features/reference-data/reference-data.controller';
import { UsersController } from '@/features/users/users.controller';
import { UsersModule } from '@/features/users/users.module';
import { WorkgroupRepo } from '@/features/workgroups/workgroup.repo';
import { WorkgroupsController } from '@/features/workgroups/workgroups.controller';

@Module({
  controllers: [
    ReferenceDataController,
    AppController,
    ContactsController,
    GeometriesController,
    UsersController,
    WorkgroupsController,
  ],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule,
    ScheduleModule.forRoot(),
    CacheModule.register(),
    AssetModule,
    UsersModule,
    EventEmitterModule.forRoot(),
  ],
  providers: [
    FixturesCreateCommand,

    ContactRepo,
    PrismaService,
    WorkgroupRepo,
    GeometryRepo,
    {
      provide: APP_GUARD,
      useClass: AuthorizationGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).exclude('/config').forRoutes('*wildcard');
  }
}

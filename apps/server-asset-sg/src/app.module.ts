import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from '@/app.controller';
import { FixturesCreateCommand } from '@/commands/fixtures-create.command';
import { AuthenticationGuard } from '@/core/guards/authentication.guard';
import { AuthorizationGuard } from '@/core/guards/authorization-guard.service';
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
    ScheduleModule.forRoot(),
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
      useClass: AuthenticationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AuthorizationGuard,
    },
  ],
})
export class AppModule {}

import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from '@/app.controller';
import { provideElasticsearch } from '@/core/elasticsearch';
import { AuthorizationGuard } from '@/core/guards/authorization-guard.service';
import { JwtMiddleware } from '@/core/middleware/jwt.middleware';
import { PrismaService } from '@/core/prisma.service';
import { AssetEditController } from '@/features/asset-edit/asset-edit.controller';
import { AssetEditRepo } from '@/features/asset-edit/asset-edit.repo';
import { AssetEditService } from '@/features/asset-edit/asset-edit.service';
import { AssetInfoRepo } from '@/features/assets/asset-info.repo';
import { AssetRepo } from '@/features/assets/asset.repo';
import { AssetsController } from '@/features/assets/assets.controller';
import { AssetSearchController } from '@/features/assets/search/asset-search.controller';
import { AssetSearchService } from '@/features/assets/search/asset-search.service';
import { AssetSyncController } from '@/features/assets/sync/asset-sync.controller';
import { ContactRepo } from '@/features/contacts/contact.repo';
import { ContactsController } from '@/features/contacts/contacts.controller';
import { FavoriteRepo } from '@/features/favorites/favorite.repo';
import { FavoritesController } from '@/features/favorites/favorites.controller';
import { FilesController } from '@/features/files/files.controller';
import { OcrController } from '@/features/ocr/ocr.controller';
import { StudiesController } from '@/features/studies/studies.controller';
import { StudyRepo } from '@/features/studies/study.repo';
import { UserRepo } from '@/features/users/user.repo';
import { UsersController } from '@/features/users/users.controller';
import { WorkgroupRepo } from '@/features/workgroups/workgroup.repo';
import { WorkgroupsController } from '@/features/workgroups/workgroups.controller';

@Module({
  controllers: [
    AppController,
    AssetEditController,
    AssetSearchController,
    AssetSyncController,
    AssetsController,
    ContactsController,
    FavoritesController,
    FilesController,
    OcrController,
    StudiesController,
    UsersController,
    WorkgroupsController,
  ],
  imports: [HttpModule, ScheduleModule.forRoot(), CacheModule.register()],
  providers: [
    provideElasticsearch,
    AssetEditRepo,
    AssetEditService,
    AssetInfoRepo,
    AssetRepo,
    AssetSearchService,
    ContactRepo,
    FavoriteRepo,
    PrismaService,
    StudyRepo,
    UserRepo,
    WorkgroupRepo,
    {
      provide: APP_GUARD,
      useClass: AuthorizationGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).exclude('/oauth-config/config', 'ocr/(.*)').forRoutes('*');
  }
}

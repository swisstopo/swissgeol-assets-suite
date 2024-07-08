import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from '@/app.controller';
import { provideElasticsearch } from '@/core/elasticsearch';
import { RoleGuard } from '@/core/guards/role.guard';
import { JwtMiddleware } from '@/core/middleware/jwt.middleware';
import { PrismaService } from '@/core/prisma.service';
import { AssetEditRepo } from '@/features/asset-old/asset-edit.repo';
import { AssetEditService } from '@/features/asset-old/asset-edit.service';
import { AssetController } from '@/features/asset-old/asset.controller';
import { AssetService } from '@/features/asset-old/asset.service';
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
import { OcrController } from '@/features/ocr/ocr.controller';
import { StudiesController } from '@/features/studies/studies.controller';
import { StudyRepo } from '@/features/studies/study.repo';
import { UserRepo } from '@/features/users/user.repo';
import { UsersController } from '@/features/users/users.controller';

@Module({
  controllers: [
    AppController,
    UsersController,
    FavoritesController,
    AssetSyncController,
    AssetSearchController,
    AssetsController,
    AssetController,
    StudiesController,
    ContactsController,
    OcrController,
  ],
  imports: [HttpModule, ScheduleModule.forRoot(), CacheModule.register()],
  providers: [
    provideElasticsearch,
    PrismaService,
    AssetRepo,
    AssetInfoRepo,
    AssetService,
    AssetEditRepo,
    ContactRepo,
    FavoriteRepo,
    UserRepo,
    StudyRepo,
    AssetEditService,
    AssetSearchService,
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).exclude('/oauth-config/config', 'ocr/(.*)').forRoutes('*');
  }
}

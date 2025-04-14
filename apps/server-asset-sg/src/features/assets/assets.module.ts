import { Module } from '@nestjs/common/decorators';
import { provideElasticsearch } from '@/core/elasticsearch';
import { PrismaService } from '@/core/prisma.service';
import { AssetEditController } from '@/features/assets/asset-edit/asset-edit.controller';
import { AssetEditRepo } from '@/features/assets/asset-edit/asset-edit.repo';
import { AssetEditService } from '@/features/assets/asset-edit/asset-edit.service';
import { AssetInfoRepo } from '@/features/assets/assets/asset-info.repo';
import { AssetRepo } from '@/features/assets/assets/asset.repo';
import { AssetsController } from '@/features/assets/assets/assets.controller';
import { AssetSearchController } from '@/features/assets/assets/search/asset-search.controller';
import { AssetSearchService } from '@/features/assets/assets/search/asset-search.service';
import { AssetSyncController } from '@/features/assets/assets/sync/asset-sync.controller';
import { AssetSyncService } from '@/features/assets/assets/sync/asset-sync.service';
import { FavoriteRepo } from '@/features/assets/favorites/favorite.repo';
import { FavoritesController } from '@/features/assets/favorites/favorites.controller';
import { FileOcrService } from '@/features/assets/files/file-ocr.service';
import { FileS3Service } from '@/features/assets/files/file-s3.service';
import { FileRepo } from '@/features/assets/files/file.repo';
import { FileService } from '@/features/assets/files/file.service';
import { FilesController } from '@/features/assets/files/files.controller';
import { WorkflowController } from '@/features/assets/workflow/workflow.controller';
import { WorkflowRepo } from '@/features/assets/workflow/workflow.repo';
import { WorkflowService } from '@/features/assets/workflow/workflow.service';
import { StudyRepo } from '@/features/studies/study.repo';
import { UsersModule } from '@/features/users/users.module';

@Module({
  controllers: [
    AssetsController,
    AssetEditController,
    FilesController,
    AssetSearchController,
    FavoritesController,
    AssetSyncController,
    WorkflowController,
  ],
  providers: [
    provideElasticsearch,
    AssetRepo,
    AssetEditRepo,
    FileRepo,
    PrismaService,
    AssetEditService,
    AssetSearchService,
    StudyRepo,
    AssetInfoRepo,
    FileOcrService,
    FileS3Service,
    FileService,
    FavoriteRepo,
    AssetSyncService,
    WorkflowRepo,
    WorkflowService,
  ],
  imports: [UsersModule],
})
export class AssetsModule {}

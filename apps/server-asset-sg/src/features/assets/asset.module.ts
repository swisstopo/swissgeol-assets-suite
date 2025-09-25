import { Module } from '@nestjs/common/decorators';
import { provideElasticsearch } from '@/core/elasticsearch';
import { PrismaService } from '@/core/prisma.service';
import { AssetRepo } from '@/features/assets/asset.repo';
import { AssetService } from '@/features/assets/asset.service';
import { AssetsController } from '@/features/assets/assets.controller';
import { FavoriteRepo } from '@/features/assets/favorites/favorite.repo';
import { FavoritesController } from '@/features/assets/favorites/favorites.controller';
import { FileExtractionService } from '@/features/assets/files/file-processors/file-extraction.service';
import { FileOcrService } from '@/features/assets/files/file-processors/file-ocr.service';
import { FileS3Service } from '@/features/assets/files/file-s3.service';
import { FileRepo } from '@/features/assets/files/file.repo';
import { FileService } from '@/features/assets/files/file.service';
import { FilesController } from '@/features/assets/files/files.controller';
import { AssetGeometriesController } from '@/features/assets/geometries/asset-geometries.controller';
import { AssetSearchController } from '@/features/assets/search/asset-search.controller';
import { AssetSearchService } from '@/features/assets/search/asset-search.service';
import { AssetSyncController } from '@/features/assets/sync/asset-sync.controller';
import { AssetSyncService } from '@/features/assets/sync/asset-sync.service';
import { SyncOnStartHook } from '@/features/assets/sync/hooks/sync-on-start.hook';
import { WorkflowController } from '@/features/assets/workflow/workflow.controller';
import { WorkflowRepo } from '@/features/assets/workflow/workflow.repo';
import { WorkflowService } from '@/features/assets/workflow/workflow.service';
import { GeometryDetailRepo } from '@/features/geometries/geometry-detail.repo';
import { GeometryRepo } from '@/features/geometries/geometry.repo';
import { UsersModule } from '@/features/users/users.module';

@Module({
  controllers: [
    AssetSyncController,
    AssetGeometriesController,
    AssetsController,
    FilesController,
    AssetSearchController,
    FavoritesController,
    WorkflowController,
  ],
  exports: [AssetSearchService],
  imports: [UsersModule],
  providers: [
    SyncOnStartHook,
    provideElasticsearch,
    GeometryRepo,
    GeometryDetailRepo,
    AssetRepo,
    FileRepo,
    PrismaService,
    AssetService,
    AssetSearchService,
    FileOcrService,
    FileS3Service,
    FileService,
    FileExtractionService,
    FavoriteRepo,
    AssetSyncService,
    WorkflowRepo,
    WorkflowService,
  ],
})
export class AssetModule {}

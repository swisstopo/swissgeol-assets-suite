import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { AssetSyncService } from '@/features/assets/assets/sync/asset-sync.service';

@Injectable()
export class SyncOnStartHook implements OnApplicationBootstrap {
  constructor(private readonly assetSyncService: AssetSyncService) {}
  public async onApplicationBootstrap() {
    await this.assetSyncService.clearSyncFileIfExists();
    await this.assetSyncService.start();
  }
}

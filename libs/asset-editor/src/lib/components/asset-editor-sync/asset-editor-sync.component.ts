import { Component, inject, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { SyncApiService } from '../../services/sync-api.service';

@Component({
  selector: 'asset-sg-editor-sync',
  templateUrl: './asset-editor-sync.component.html',
  styleUrls: ['./asset-editor-sync.component.scss'],
  standalone: false,
})
export class AssetEditorSyncComponent implements OnInit {
  private readonly syncApiService = inject(SyncApiService);

  syncProgress: number | null = null;
  fileSyncProgress: number | null = null;

  ngOnInit() {
    void this.refreshSyncProgress().then(() => {
      if (this.syncProgress != null) {
        void this.loopSyncProgress();
      }
    });
    void this.refreshFileSyncProgress().then(() => {
      if (this.fileSyncProgress != null) {
        void this.loopFileSyncProgress();
      }
    });
  }

  async synchronizeElastic() {
    if (this.syncProgress !== null) {
      return;
    }
    this.syncProgress = 0;
    await firstValueFrom(this.syncApiService.startSync());
    await this.loopSyncProgress();
  }

  async synchronizeFilesToElastic() {
    if (this.fileSyncProgress !== null) {
      return;
    }
    this.fileSyncProgress = 0;
    await firstValueFrom(this.syncApiService.startFullTextSync());
    await this.loopFileSyncProgress();
  }

  private async loopSyncProgress() {
    while (this.syncProgress !== null) {
      await this.refreshSyncProgress();
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  private async refreshSyncProgress() {
    const progress = await firstValueFrom(this.syncApiService.getSyncProgress());
    this.syncProgress = progress == null ? null : Math.round(progress.progress * 100);
  }

  private async loopFileSyncProgress() {
    while (this.fileSyncProgress !== null) {
      await this.refreshFileSyncProgress();
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  private async refreshFileSyncProgress() {
    const progress = await firstValueFrom(this.syncApiService.getFullTextSyncProgress());
    this.fileSyncProgress = progress == null ? null : Math.round(progress.progress * 100);
  }
}

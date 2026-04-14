import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { Observable, take } from 'rxjs';

@Component({
  selector: 'asset-sg-editor-sync',
  templateUrl: './asset-editor-sync.component.html',
  styleUrls: ['./asset-editor-sync.component.scss'],
  standalone: false,
})
export class AssetEditorSyncComponent implements OnInit {
  private readonly httpClient = inject(HttpClient);

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
    await resolveFirst(this.httpClient.post('/api/assets/sync', null));
    await this.loopSyncProgress();
  }

  async synchronizeFilesToElastic() {
    if (this.fileSyncProgress !== null) {
      return;
    }
    this.fileSyncProgress = 0;
    await resolveFirst(this.httpClient.post('/api/assets/sync/full-text?reloadFromS3=true', null));
    await this.loopFileSyncProgress();
  }

  private async loopSyncProgress() {
    while (this.syncProgress !== null) {
      await this.refreshSyncProgress();
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  private async refreshSyncProgress() {
    type Progress = { progress: number } | null | undefined;
    const progress = await resolveFirst(this.httpClient.get<Progress>('/api/assets/sync'));
    this.syncProgress = progress == null ? null : Math.round(progress.progress * 100);
  }

  private async loopFileSyncProgress() {
    while (this.fileSyncProgress !== null) {
      await this.refreshFileSyncProgress();
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  private async refreshFileSyncProgress() {
    type Progress = { progress: number } | null | undefined;
    const progress = await resolveFirst(this.httpClient.get<Progress>('/api/assets/sync/full-text'));
    this.fileSyncProgress = progress == null ? null : Math.round(progress.progress * 100);
  }
}

const resolveFirst = <T>(value$: Observable<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    value$.pipe(take(1)).subscribe({
      next: resolve,
      error: reject,
    });
  });

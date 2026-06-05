import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  AssetFileMetadataResponse,
  AssetFileMetadataSchema,
  AssetFileSignedUrl,
  AssetFileSignedUrlSchema,
} from '@asset-sg/shared/v2';
import { plainToInstance } from 'class-transformer';
import { firstValueFrom, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PdfViewerApiService {
  private readonly httpClient = inject(HttpClient);

  fetchMetadata(assetId: number, fileId: number): Promise<AssetFileMetadataResponse> {
    return firstValueFrom(
      this.httpClient
        .get<object>(`/api/assets/${assetId}/files/${fileId}/metadata`)
        .pipe(map((res) => plainToInstance(AssetFileMetadataSchema, res))),
    );
  }

  fetchPresignedDownloadUrl(assetId: number, fileId: number): Promise<AssetFileSignedUrl> {
    return firstValueFrom(
      this.httpClient
        .get<object>(`/api/assets/${assetId}/files/${fileId}/presigned?download=true`)
        .pipe(map((res) => plainToInstance(AssetFileSignedUrlSchema, res))),
    );
  }
}

import { IsArray, IsInt } from 'class-validator';

/**
 * Maximum number of assets that can be exported in a single request.
 * Enforced on both client and server.
 */
export const MAX_EXPORT_ASSETS = 100;

export class AssetExportRequestSchema {
  @IsArray()
  @IsInt({ each: true })
  assetIds!: number[];
}

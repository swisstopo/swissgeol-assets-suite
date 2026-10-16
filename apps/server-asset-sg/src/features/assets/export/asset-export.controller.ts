import { AssetExportRequestSchema, User } from '@asset-sg/shared/v2';
import { BadRequestException, Controller, Header, Post, Query, StreamableFile } from '@nestjs/common';
import { Authorize } from '@/core/decorators/authorize.decorator';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { ParseBody } from '@/core/decorators/parse.decorator';
import { DEFAULT_EXPORT_LANGUAGE, ExportLanguage, isExportLanguage } from '@/features/assets/export/asset-export.i18n';
import { AssetExportService } from '@/features/assets/export/asset-export.service';
import {
  AssetGeoPackageExportService,
  GEOPACKAGE_ARCHIVE_ENTRY_NAME,
  GEOPACKAGE_MEDIA_TYPE,
} from '@/features/assets/export/asset-geopackage-export.service';

@Controller('/assets/export')
export class AssetExportController {
  constructor(
    private readonly assetExportService: AssetExportService,
    private readonly assetGeoPackageExportService: AssetGeoPackageExportService,
  ) {}

  @Post('/csv')
  @Authorize.User()
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportCsv(
    @ParseBody(AssetExportRequestSchema) body: AssetExportRequestSchema,
    @CurrentUser() user: User,
    @Query('lang') lang?: string,
  ): Promise<string> {
    return this.assetExportService.exportAssetsAsCsv(body.assetIds, user, parseLanguage(lang));
  }

  @Post('/geopackage')
  @Authorize.User()
  async exportGeoPackage(
    @ParseBody(AssetExportRequestSchema) body: AssetExportRequestSchema,
    @CurrentUser() user: User,
    @Query('lang') lang?: string,
  ): Promise<StreamableFile> {
    if (body.assetIds.length === 0) {
      throw new BadRequestException('At least one asset must be selected.');
    }
    const content = await this.assetGeoPackageExportService.exportAssetsAsGeoPackage(
      body.assetIds,
      user,
      parseLanguage(lang),
    );
    return new StreamableFile(content, {
      type: GEOPACKAGE_MEDIA_TYPE,
      disposition: `attachment; filename="${GEOPACKAGE_ARCHIVE_ENTRY_NAME}"`,
      length: content.length,
    });
  }
}

const parseLanguage = (lang: string | undefined): ExportLanguage =>
  isExportLanguage(lang) ? lang : DEFAULT_EXPORT_LANGUAGE;

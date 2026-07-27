import { AssetExportRequestSchema, User } from '@asset-sg/shared/v2';
import { Controller, Header, Post, Query } from '@nestjs/common';
import { Authorize } from '@/core/decorators/authorize.decorator';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { ParseBody } from '@/core/decorators/parse.decorator';
import { DEFAULT_EXPORT_LANGUAGE, isExportLanguage } from '@/features/assets/export/asset-export.i18n';
import { AssetExportService } from '@/features/assets/export/asset-export.service';

@Controller('/assets/export')
export class AssetExportController {
  constructor(private readonly assetExportService: AssetExportService) {}

  @Post('/csv')
  @Authorize.User()
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportCsv(
    @ParseBody(AssetExportRequestSchema) body: AssetExportRequestSchema,
    @CurrentUser() user: User,
    @Query('lang') lang?: string,
  ): Promise<string> {
    const language = isExportLanguage(lang) ? lang : DEFAULT_EXPORT_LANGUAGE;
    return this.assetExportService.exportAssetsAsCsv(body.assetIds, user, language);
  }
}

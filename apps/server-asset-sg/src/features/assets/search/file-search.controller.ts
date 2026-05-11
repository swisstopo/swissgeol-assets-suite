import {
  AssetSearchStats,
  AssetSearchStatsSchema,
  FileSearchQuery,
  FileSearchQuerySchema,
  FileSearchResult,
  FileSearchResultSchema,
  User,
} from '@asset-sg/shared/v2';
import {
  ClassSerializerInterceptor,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  SerializeOptions,
  UseInterceptors,
} from '@nestjs/common';
import { Authorize } from '@/core/decorators/authorize.decorator';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { ParseBody } from '@/core/decorators/parse.decorator';
import { restrictQueryForUser } from '@/features/assets/search/asset-search.utils';
import { FileSearchService } from '@/features/assets/search/file-search.service';

@Controller('/files/search')
@UseInterceptors(ClassSerializerInterceptor)
export class FileSearchController {
  constructor(private readonly fileSearchService: FileSearchService) {}

  @Post('/')
  @Authorize.User()
  @HttpCode(HttpStatus.OK)
  @SerializeOptions({ type: FileSearchResultSchema, excludeExtraneousValues: true })
  async search(
    @ParseBody(FileSearchQuerySchema)
    query: FileSearchQuery,
    @CurrentUser() user: User,
    @Query('limit')
    limit?: number,
    @Query('offset')
    offset?: number,
  ): Promise<FileSearchResult> {
    limit = limit == null ? limit : Number(limit);
    offset = offset == null ? offset : Number(offset);
    restrictQueryForUser(query, user);
    return await this.fileSearchService.search(query, user, { limit, offset });
  }

  @Post('/stats')
  @Authorize.User()
  @HttpCode(HttpStatus.OK)
  @SerializeOptions({ type: AssetSearchStatsSchema })
  async showStats(
    @ParseBody(FileSearchQuerySchema)
    query: FileSearchQuery,
    @CurrentUser() user: User,
  ): Promise<AssetSearchStats> {
    if (user.isAdmin) {
      // For admins: restrict stats to their workgroups, but keep workgroup
      // counts unrestricted so they can discover all workgroups.
      const unrestrictedWorkgroupQuery = { ...query };
      restrictQueryForUser(query, user);
      return await this.fileSearchService.aggregateFiles(query, user, { unrestrictedWorkgroupQuery });
    }
    restrictQueryForUser(query, user);
    return await this.fileSearchService.aggregateFiles(query, user);
  }
}

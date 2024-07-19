import {
  AssetId,
  SimpleWorkgroup,
  User,
  Workgroup,
  WorkgroupData,
  WorkgroupDataBoundary,
  WorkgroupId,
  WorkgroupPolicy,
} from '@asset-sg/shared/v2';
import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Expose, Transform as TransformValue } from 'class-transformer';
import { IsBoolean } from 'class-validator';
import { authorize } from '@/core/authorize';
import { Authorize } from '@/core/decorators/authorize.decorator';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { ParseBody } from '@/core/decorators/parse.decorator';
import { RepoListOptions } from '@/core/repo';
import { WorkgroupRepo } from '@/features/workgroups/workgroup.repo';

class ListQuery {
  @Expose({ name: 'simple' })
  @TransformValue(({ value }) => value != null && value !== 'false', { toClassOnly: true })
  @IsBoolean()
  isSimple!: boolean;
}

@Controller('/workgroups')
export class WorkgroupsController {
  constructor(private readonly workgroupRepo: WorkgroupRepo) {}

  @Get('/')
  @Authorize.User()
  async list(@CurrentUser() user: User, @Query() query: ListQuery): Promise<Workgroup[] | SimpleWorkgroup[]> {
    const options: RepoListOptions<WorkgroupId> = {
      ids: user.isAdmin ? undefined : user.workgroups.map((it) => it.id),
    };
    return query.isSimple ? this.workgroupRepo.simple(user).list(options) : this.workgroupRepo.list(options);
  }

  @Get('/:id')
  async show(@Param('id', ParseIntPipe) id: AssetId, @CurrentUser() user: User): Promise<Workgroup> {
    const record = await this.workgroupRepo.find(id);
    if (record === null) {
      throw new HttpException('not found', 404);
    }
    authorize(WorkgroupPolicy, user).canShow(record);
    return record;
  }

  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @ParseBody(WorkgroupDataBoundary)
    data: WorkgroupData,
    @CurrentUser() user: User
  ): Promise<Workgroup> {
    authorize(WorkgroupPolicy, user).canCreate();
    return this.workgroupRepo.create(data);
  }

  @Put('/:id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @ParseBody(WorkgroupDataBoundary)
    data: WorkgroupData,
    @CurrentUser() user: User
  ): Promise<Workgroup> {
    const record = await this.workgroupRepo.find(id);
    if (record === null) {
      throw new HttpException('not found', 404);
    }
    authorize(WorkgroupPolicy, user).canUpdate(record);
    const workgroup = await this.workgroupRepo.update(record.id, data);
    if (workgroup === null) {
      throw new HttpException('not found', 404);
    }
    return workgroup;
  }

  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User): Promise<void> {
    const record = await this.workgroupRepo.find(id);
    if (record == null) {
      throw new HttpException('not found', HttpStatus.NOT_FOUND);
    }
    authorize(WorkgroupPolicy, user).canDelete(record);
    await this.workgroupRepo.delete(record.id);
  }
}

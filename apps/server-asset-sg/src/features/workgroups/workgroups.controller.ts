import {
  convert,
  SimpleUserSchema,
  SimpleWorkgroup,
  User,
  Workgroup,
  WorkgroupData,
  WorkgroupDataSchema,
  WorkgroupId,
  WorkgroupPolicy,
  WorkgroupSchema,
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
import { SimpleUser } from '@swissgeol/ui-core';
import { Expose, Transform as TransformValue } from 'class-transformer';
import { IsBoolean } from 'class-validator';
import { authorize } from '@/core/authorize';
import { Authorize } from '@/core/decorators/authorize.decorator';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { ParseBody } from '@/core/decorators/parse.decorator';
import { RepoListOptions } from '@/core/repo';
import { UserRepo } from '@/features/users/user.repo';
import { WorkgroupRepo } from '@/features/workgroups/workgroup.repo';

class ListQuery {
  @Expose({ name: 'simple' })
  @TransformValue(({ value }) => value != null && value !== 'false', { toClassOnly: true })
  @IsBoolean()
  isSimple!: boolean;
}

@Controller('/workgroups')
export class WorkgroupsController {
  constructor(
    private readonly workgroupRepo: WorkgroupRepo,
    private readonly userRepo: UserRepo,
  ) {}

  @Get('/')
  @Authorize.User()
  async list(@CurrentUser() user: User, @Query() query: ListQuery): Promise<Workgroup[] | SimpleWorkgroup[]> {
    const options: RepoListOptions<WorkgroupId> = {
      ids: user.isAdmin ? undefined : [...user.roles.keys()],
    };
    if (query.isSimple) {
      return this.workgroupRepo.simple(user).list(options);
    }
    return convert(WorkgroupSchema, await this.workgroupRepo.list(options));
  }

  @Get('/:id')
  async show(@Param('id', ParseIntPipe) id: WorkgroupId, @CurrentUser() user: User): Promise<Workgroup> {
    const record = await this.workgroupRepo.find(id);
    if (record === null) {
      throw new HttpException('not found', 404);
    }
    authorize(WorkgroupPolicy, user).canShow(record);
    return convert(WorkgroupSchema, record);
  }

  @Get('/:id/users')
  async listUsers(@Param('id', ParseIntPipe) id: WorkgroupId, @CurrentUser() user: User): Promise<SimpleUser[]> {
    const record = await this.workgroupRepo.find(id);
    if (record === null) {
      throw new HttpException('not found', 404);
    }
    authorize(WorkgroupPolicy, user).canShow(record);
    const users = await this.userRepo.findByWorkgroupId(id);
    return convert(SimpleUserSchema, users);
  }

  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @ParseBody(WorkgroupDataSchema)
    data: WorkgroupData,
    @CurrentUser() user: User,
  ): Promise<Workgroup> {
    authorize(WorkgroupPolicy, user).canCreate();
    const record = await this.workgroupRepo.create(data);
    return convert(WorkgroupSchema, record);
  }

  @Put('/:id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @ParseBody(WorkgroupDataSchema)
    data: WorkgroupData,
    @CurrentUser() user: User,
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
    return convert(WorkgroupSchema, workgroup);
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

import { Controller, Delete, Get, HttpCode, HttpException, HttpStatus, Post, Put } from '@nestjs/common';
import { User } from '@shared/models/user';
import { Workgroup, WorkgroupData, WorkgroupDataBoundary } from '@shared/models/workgroup';
import { WorkgroupPolicy } from '@shared/policies/workgroup.policy';
import { Authorize } from '@/core/decorators/authorize.decorator';
import { Authorized } from '@/core/decorators/authorized.decorator';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { Transform } from '@/core/decorators/transform.decorator';
import { UsePolicy } from '@/core/decorators/use-policy.decorator';
import { UseRepo } from '@/core/decorators/use-repo.decorator';
import { WorkgroupRepo } from '@/features/workgroups/workgroup.repo';

@Controller('/workgroups')
@UsePolicy(WorkgroupPolicy)
@UseRepo(WorkgroupRepo)
export class WorkgroupController {
  constructor(private readonly workgroupRepo: WorkgroupRepo) {}

  @Get('/')
  @Authorize.User()
  async list(@CurrentUser() user: User): Promise<Workgroup[]> {
    return this.workgroupRepo.list({ ids: user.isAdmin ? undefined : user.workgroups.map((it) => it.id) });
  }

  @Get('/:id')
  @Authorize.Show({ id: Number })
  async show(@Authorized.Record() workgroup: Workgroup): Promise<Workgroup> {
    return workgroup;
  }

  @Post('/')
  @Authorize.Create()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Transform(WorkgroupDataBoundary)
    data: WorkgroupDataBoundary
  ): Promise<Workgroup> {
    return this.workgroupRepo.create(data);
  }

  @Put('/:id')
  @Authorize.Update({ id: Number })
  async update(
    @Authorized.Record() record: Workgroup,
    @Transform(WorkgroupDataBoundary)
    data: WorkgroupData
  ): Promise<Workgroup> {
    const workgroup = await this.workgroupRepo.update(record.id, data);
    if (workgroup === null) {
      throw new HttpException('not found', 404);
    }
    return workgroup;
  }

  @Delete('/:id')
  @Authorize.Delete({ id: Number })
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Authorized.Record() record: Workgroup): Promise<void> {
    await this.workgroupRepo.delete(record.id);
  }
}

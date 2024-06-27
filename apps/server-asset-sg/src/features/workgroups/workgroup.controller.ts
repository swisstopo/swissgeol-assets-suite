import {
  Body,
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
  ValidationPipe,
} from '@nestjs/common';
import { RequireRole } from '@/core/decorators/require-role.decorator';
import { Role } from '@/features/users/user.model';
import { Workgroup, WorkgroupDataBoundary, WorkgroupId } from '@/features/workgroups/workgroup.model';
import { WorkgroupRepo } from '@/features/workgroups/workgroup.repo';

@Controller('/workgroups')
export class WorkgroupController {
  constructor(private readonly workgroupRepo: WorkgroupRepo) {}

  @Get('/:id')
  async show(@Param('id', ParseIntPipe) id: WorkgroupId): Promise<Workgroup> {
    const workGroup = await this.workgroupRepo.find(id);
    if (workGroup === null) {
      throw new HttpException('not found', 404);
    }
    return workGroup;
  }

  @Get('/')
  @RequireRole(Role.Viewer)
  async list(): Promise<Workgroup[]> {
    return this.workgroupRepo.list();
  }

  @Post('/')
  @RequireRole(Role.Admin)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    data: WorkgroupDataBoundary
  ): Promise<Workgroup> {
    return this.workgroupRepo.create(data);
  }

  @Put('/:id')
  @RequireRole(Role.Admin)
  async update(
    @Param('id', ParseIntPipe) id: WorkgroupId,
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    data: WorkgroupDataBoundary
  ): Promise<Workgroup> {
    const workgroup = await this.workgroupRepo.update(id, data);
    if (workgroup === null) {
      throw new HttpException('not found', 404);
    }
    return workgroup;
  }

  @Delete('/:id')
  @RequireRole(Role.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: WorkgroupId): Promise<void> {
    const isOk = await this.workgroupRepo.delete(id);
    if (!isOk) {
      throw new HttpException('not found', 404);
    }
  }
}

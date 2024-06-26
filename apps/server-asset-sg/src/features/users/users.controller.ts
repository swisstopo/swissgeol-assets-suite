import { User, UserData, UserId } from '@asset-sg/shared/v2';
import { UserDataSchema } from '@asset-sg/shared/v2';
import { Controller, Delete, Get, HttpCode, HttpException, HttpStatus, Param, Put } from '@nestjs/common';
import { Authorize } from '@/core/decorators/authorize.decorator';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { ParseBody } from '@/core/decorators/parse.decorator';
import { UserRepo } from '@/features/users/user.repo';

@Controller('/users')
export class UsersController {
  constructor(private readonly userRepo: UserRepo) {}

  @Get('/current')
  showCurrent(@CurrentUser() user: User | null): User | null {
    return user;
  }

  @Get('/')
  @Authorize.Admin()
  list(): Promise<User[]> {
    return this.userRepo.list();
  }

  @Get('/:id')
  show(@Param('id') id: UserId): Promise<User | null> {
    return this.userRepo.find(id);
  }

  @Put('/:id')
  @Authorize.Admin()
  async update(
    @Param('id') id: UserId,
    @ParseBody(UserDataSchema)
    data: UserData
  ): Promise<User> {
    const user = await this.userRepo.update(id, data);
    if (user === null) {
      throw new HttpException('not found', 404);
    }
    return user;
  }

  @Delete('/:id')
  @Authorize.Admin()
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: UserId): Promise<void> {
    const isOk = await this.userRepo.delete(id);
    if (!isOk) {
      throw new HttpException('not found', 404);
    }
  }
}

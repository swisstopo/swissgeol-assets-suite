import { convert, User, UserData, UserDataSchema, UserId, UserSchema } from '@asset-sg/shared/v2';
import { Controller, Delete, Get, HttpCode, HttpException, HttpStatus, Param, Put } from '@nestjs/common';
import { Authorize } from '@/core/decorators/authorize.decorator';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { ParseBody } from '@/core/decorators/parse.decorator';
import { ParseResourceUuidPipe } from '@/core/pipes/parse-uuid.pipe';
import { UserRepo } from '@/features/users/user.repo';

@Controller('/users')
export class UsersController {
  constructor(private readonly userRepo: UserRepo) {}

  @Get('/current')
  showCurrent(@CurrentUser() user: User | null): User | null {
    if (user == null) {
      return null;
    }
    return convert(UserSchema, user);
  }

  @Get('/')
  @Authorize.Admin()
  async list(): Promise<User[]> {
    return convert(UserSchema, await this.userRepo.list());
  }

  @Get('/:id')
  async show(@Param('id', ParseResourceUuidPipe) id: UserId): Promise<User> {
    const user = await this.userRepo.find(id);
    if (user == null) {
      throw new HttpException('not found', HttpStatus.NOT_FOUND);
    }
    return convert(UserSchema, user);
  }

  @Put('/:id')
  @Authorize.Admin()
  async update(
    @Param('id', ParseResourceUuidPipe) id: UserId,
    @ParseBody(UserDataSchema)
    data: UserData,
  ): Promise<User> {
    const user = await this.userRepo.update(id, data);
    if (user == null) {
      throw new HttpException('not found', HttpStatus.NOT_FOUND);
    }
    return convert(UserSchema, user);
  }

  @Delete('/:id')
  @Authorize.Admin()
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseResourceUuidPipe) id: UserId): Promise<void> {
    const isOk = await this.userRepo.delete(id);
    if (!isOk) {
      throw new HttpException('not found', HttpStatus.NOT_FOUND);
    }
  }
}

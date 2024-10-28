import { Contact, ContactData, ContactDataSchema, ContactPolicy, User } from '@asset-sg/shared/v2';
import { Controller, HttpCode, HttpException, HttpStatus, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { authorize } from '@/core/authorize';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { ParseBody } from '@/core/decorators/parse.decorator';
import { ContactRepo } from '@/features/contacts/contact.repo';

@Controller('/contacts')
export class ContactsController {
  constructor(private readonly contactRepo: ContactRepo) {}

  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  create(@ParseBody(ContactDataSchema) data: ContactData, @CurrentUser() user: User): Promise<Contact> {
    authorize(ContactPolicy, user).canCreate();
    return this.contactRepo.create(data);
  }

  @Put('/:id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @ParseBody(ContactDataSchema) data: ContactData,
    @CurrentUser() user: User
  ): Promise<Contact> {
    const record = await this.contactRepo.find(id);
    if (record == null) {
      throw new HttpException('not found', HttpStatus.NOT_FOUND);
    }
    authorize(ContactPolicy, user).canUpdate(record);
    const contact = await this.contactRepo.update(record.id, data);
    if (contact == null) {
      throw new HttpException('not found', 404);
    }
    return contact;
  }
}

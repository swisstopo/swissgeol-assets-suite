import { Controller, HttpCode, HttpException, HttpStatus, Post, Put } from '@nestjs/common';
import { Authorize } from '@/core/decorators/authorize.decorator';
import { Authorized } from '@/core/decorators/authorized.decorator';
import { Boundary } from '@/core/decorators/boundary.decorator';
import { UsePolicy } from '@/core/decorators/use-policy.decorator';
import { UseRepo } from '@/core/decorators/use-repo.decorator';
import { Contact, ContactData, ContactDataBoundary } from '@/features/contacts/contact.model';
import { ContactPolicy } from '@/features/contacts/contact.policy';
import { ContactRepo } from '@/features/contacts/contact.repo';

@Controller('/contacts')
@UseRepo(ContactRepo)
@UsePolicy(ContactPolicy)
export class ContactsController {
  constructor(private readonly contactRepo: ContactRepo) {}

  @Post('/')
  @Authorize.Create()
  @HttpCode(HttpStatus.CREATED)
  create(@Boundary(ContactDataBoundary) data: ContactData): Promise<Contact> {
    return this.contactRepo.create(data);
  }

  @Put('/:id')
  @Authorize.Update({ id: Number })
  async update(
    @Authorized.Record() record: Contact,
    @Boundary(ContactDataBoundary) data: ContactData
  ): Promise<Contact> {
    const contact = await this.contactRepo.update(record.id, data);
    if (contact == null) {
      throw new HttpException('not found', 404);
    }
    return contact;
  }
}

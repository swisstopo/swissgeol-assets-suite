import {
    Body,
    Controller,
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
import { Contact, ContactDataBoundary, ContactId } from '@/features/contacts/contact.model';
import { ContactRepo } from '@/features/contacts/contact.repo';
import { Role } from '@/features/users/user.model';

@Controller('/contacts')
export class ContactsController {
    constructor(private readonly contactRepo: ContactRepo) {}

    @Post('/')
    @RequireRole(Role.Editor)
    @HttpCode(HttpStatus.CREATED)
    create(
        @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
        data: ContactDataBoundary,
    ): Promise<Contact> {
        return this.contactRepo.create(data);
    }

    @Put('/:id')
    @RequireRole(Role.Editor)
    async update(
        @Param('id', ParseIntPipe) id: ContactId,
        @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
        data: ContactDataBoundary,
    ): Promise<Contact> {
        const contact = await this.contactRepo.update(id, data);
        if (contact == null) {
            throw new HttpException('not found', 404);
        }
        return contact;
    }
}

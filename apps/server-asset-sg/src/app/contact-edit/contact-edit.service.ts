import { Injectable } from '@nestjs/common';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';

import { unknownToUnknownError } from '@asset-sg/core';
import { Contact, PatchContact } from '@asset-sg/shared';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContactEditService {
    constructor(private readonly prismaService: PrismaService) {}

    public createContact(contact: PatchContact) {
        return pipe(
            TE.tryCatch(() => this.prismaService.contact.create({ data: contact }), unknownToUnknownError),
            TE.map(contact => {
                const { contactId: id, ...rest } = contact;
                return Contact.encode({ id, ...rest });
            }),
        );
    }

    public updateContact(contactId: number, contact: PatchContact) {
        return pipe(
            TE.tryCatch(
                () => this.prismaService.contact.update({ where: { contactId }, data: contact }),
                unknownToUnknownError,
            ),
            TE.chain(() =>
                TE.tryCatch(
                    () => this.prismaService.contact.findFirstOrThrow({ where: { contactId } }),
                    unknownToUnknownError,
                ),
            ),
            TE.map(contact => {
                const { contactId: id, ...rest } = contact;
                return Contact.encode({ id, ...rest });
            }),
        );
    }
}

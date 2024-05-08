import { Body, Controller, HttpException, Param, Patch, Put, Req } from '@nestjs/common';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';

import { DT, decodeError } from '@asset-sg/core';
import { PatchContact, isEditor } from '@asset-sg/shared';

import { permissionDeniedError } from '../errors';
import { AuthenticatedRequest } from '../models/request';
import { UserService } from '../user/user.service';

import { ContactEditService } from './contact-edit.service';

@Controller('contact-edit')
export class ContactEditController {
    constructor(private readonly contactEditService: ContactEditService, private readonly userService: UserService) {}

    @Put()
    async createContact(@Req() req: AuthenticatedRequest, @Body() contact: PatchContact) {
        const e = await pipe(
            this.userService.getUser(req.jwtPayload.sub || ''),
            TE.filterOrElseW(
                user => isEditor(user),
                () => permissionDeniedError('Not an editor'),
            ),
            TE.chainW(() => TE.fromEither(pipe(PatchContact.decode(contact), E.mapLeft(decodeError)))),
            TE.chainW(contact => this.contactEditService.createContact(contact)),
        )();

        if (E.isLeft(e)) {
            console.error(e.left);
            // if (e.left._type === 'decodeError') {
            //     throw new HttpException(e.left.message, 400);
            // }
            throw new HttpException(e.left.message, 500);
        }
        return e.right;
    }

    @Patch(':contactId')
    async updateContact(
        @Req() req: AuthenticatedRequest,
        @Param('contactId') id: string,
        @Body() contact: PatchContact,
    ) {
        const e = await pipe(
            this.userService.getUser(req.jwtPayload.sub || ''),
            TE.filterOrElseW(
                user => isEditor(user),
                () => permissionDeniedError('Not an editor'),
            ),
            TE.chainW(() => TE.fromEither(pipe(DT.IntFromString.decode(id), E.mapLeft(decodeError)))),
            TE.bindTo('contactId'),
            TE.bindW('contact', () => TE.fromEither(pipe(PatchContact.decode(contact), E.mapLeft(decodeError)))),
            TE.chainW(({ contactId, contact }) => this.contactEditService.updateContact(contactId, contact)),
        )();

        if (E.isLeft(e)) {
            console.error(e.left);
            // if (e.left._tag === 'decodeError') {
            //     throw new HttpException(e.left.message, 400);
            // }
            throw new HttpException(e.left.message, 500);
        }
        return e.right;
    }
}

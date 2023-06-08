import { Body, Controller, Delete, Get, HttpCode, HttpException, Param, Patch, Post, Req } from '@nestjs/common';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as D from 'io-ts/Decoder';

import { decodeError, serializeError } from '@asset-sg/core';
import { UserPatch, UserPost } from '@asset-sg/shared';

import { AuthenticatedRequest } from '../models/request';

import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    @Get('user')
    async getUsers() {
        const e = await this.adminService.getUsers()();
        if (E.isLeft(e)) {
            console.error(e.left);
            throw new HttpException(e.left.message, 500);
        }
        return e.right;
    }

    @Patch('user/:id')
    @HttpCode(204)
    async updateUser(@Param('id') id: string, @Body() body: UserPatch) {
        const e = await pipe(
            D.string.decode(id),
            E.bindTo('id'),
            E.bind('user', () => UserPatch.decode(body)),
            E.mapLeft(decodeError),
            TE.fromEither,
            TE.chainW(({ id, user }) => this.adminService.updateUser(id, user)),
        )();
        if (E.isLeft(e)) {
            console.error(e.left);
            if (e.left._tag === 'decodeError') {
                throw new HttpException(e.left.message, 400);
            }
            throw new HttpException(e.left.message, 500);
        }
    }

    @Post('user')
    @HttpCode(201)
    async createUser(@Req() req: AuthenticatedRequest, @Body() body: UserPost) {
        const e = await pipe(
            UserPost.decode(body),
            E.mapLeft(decodeError),
            TE.fromEither,
            TE.chainW(user => this.adminService.createUser(req.accessToken, user)),
        )();
        if (E.isLeft(e)) {
            console.error(e.left);
            if (e.left._tag === 'decodeError') {
                console.log(D.draw(e.left.cause));
                throw new HttpException(e.left.message, 400);
            }
            throw new HttpException(e.left.message, 500);
        }
    }

    @Delete('user/:id')
    @HttpCode(201)
    async deleteUser(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
        const e = await this.adminService.deleteUser(req.accessToken, id)();
        if (E.isLeft(e)) {
            console.error(e.left);
            throw new HttpException(serializeError(e.left), 500);
        }
    }
}

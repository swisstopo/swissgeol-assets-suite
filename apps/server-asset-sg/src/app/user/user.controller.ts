import { Controller, Delete, Get, HttpCode, HttpException, Param, Put, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import * as E from 'fp-ts/Either';
import * as D from 'io-ts/Decoder';

import { DT } from '@asset-sg/core';

import { isNotFoundError } from '../errors';
import { cookieKey } from '../jwt/jwt-middleware';
import { AuthenticatedRequest } from '../models/request';

import { UserService } from './user.service';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get('')
    async getUser(@Req() req: AuthenticatedRequest) {
        const e = await this.userService.getUser(req.jwtPayload.sub || '')();
        if (E.isLeft(e)) {
            console.error(e.left);
            req.res?.clearCookie(cookieKey);
            req.res?.clearCookie('asset-sg-refresh-token');
            throw new HttpException('Resource not found', 400);
        }
        return e.right;
    }

    @Get('favourite')
    async getFavourites(@Req() req: AuthenticatedRequest) {
        const e = await this.userService.getFavourites(req.jwtPayload.sub || '')();
        if (E.isLeft(e)) {
            console.error(e.left);
            throw new HttpException(e.left.message, 500);
        }
        return e.right;
    }

    @Put('favourite/:assetId')
    @HttpCode(201)
    async addFavourite(@Req() req: AuthenticatedRequest, @Param('assetId') assetId: string) {
        const maybeAssetId = DT.IntFromString.decode(assetId);
        if (E.isLeft(maybeAssetId)) {
            throw new HttpException(D.draw(maybeAssetId.left), 400);
        }
        const e = await this.userService.addFavourite(req.jwtPayload.sub || '', maybeAssetId.right)();
        if (E.isLeft(e)) {
            console.error(e.left);
            if (isNotFoundError(e.left)) {
                throw new HttpException('Resource not found', 400);
            }
            throw new HttpException(e.left.message, 500);
        }
        return e.right;
    }

    @Delete('favourite/:assetId')
    @HttpCode(204)
    async removeFavourite(@Req() req: AuthenticatedRequest, @Param('assetId') assetId: string) {
        const maybeAssetId = DT.IntFromString.decode(assetId);
        if (E.isLeft(maybeAssetId)) {
            throw new HttpException(D.draw(maybeAssetId.left), 400);
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const e = await this.userService.removeFavourite(req.jwtPayload.sub || '', maybeAssetId.right)();
        if (E.isLeft(e)) {
            console.error(e.left);
            if (isNotFoundError(e.left)) {
                throw new HttpException('Resource not found', 400);
            }
            throw new HttpException(e.left.message, 500);
        }
        return e.right;
    }
}

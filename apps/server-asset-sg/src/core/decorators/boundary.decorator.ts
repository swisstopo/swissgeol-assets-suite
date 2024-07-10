import { decodeError } from '@asset-sg/core';
import { createParamDecorator, ExecutionContext, HttpException, HttpStatus, ValidationPipe } from '@nestjs/common';
import * as E from 'fp-ts/Either';
import * as D from 'io-ts/Decoder';
import { Class } from 'type-fest';
import { JwtRequest } from '@/models/jwt-request';

export type BoundaryType = D.Decoder<any, any> | Class<unknown, []>;

const validationPipe = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });

export const Boundary = createParamDecorator(async (dataType: BoundaryType, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest() as JwtRequest;
  if (dataType instanceof Function) {
    return validationPipe.transform(request.body, { type: 'body', metatype: dataType });
  } else {
    const data = (dataType as D.Decoder<unknown, unknown>).decode(request.body);
    if (E.isLeft(data)) {
      throw new HttpException(
        `invalid request body: ${decodeError(data.left).message}`,
        HttpStatus.UNPROCESSABLE_ENTITY
      );
    }
    return data.right as object;
  }
});

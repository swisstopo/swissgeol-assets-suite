import { decodeError } from '@asset-sg/core';
import { createParamDecorator, ExecutionContext, HttpException, HttpStatus, ValidationPipe } from '@nestjs/common';
import * as E from 'fp-ts/Either';
import * as D from 'io-ts/Decoder';
import { Class } from 'type-fest';
import { JwtRequest } from '@/models/jwt-request';

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export type SchemaType = D.Decoder<any, any> | Class<unknown, []>;

const validationPipe = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });

/**
 * Parses and validates the request body using the given schema type.
 *
 * The schema type can be either a class using `class-validator` and `class-transformer`,
 * or a decoder of `io-ts`.
 *
 * @example
 * show(@Transform(MyValueSchema) myValue: MyValue) {
 *   console.log(`My parsed and validated value is ${myValue}.`);
 * }
 */
export const Transform = createParamDecorator(async (dataType: SchemaType, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest() as JwtRequest;
  if (dataType instanceof Function) {
    // It's a class transformer.
    return validationPipe.transform(request.body, { type: 'body', metatype: dataType });
  } else {
    // It's a decoder.
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

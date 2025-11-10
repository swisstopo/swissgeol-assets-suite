import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter<Prisma.PrismaClientKnownRequestError> {
  private readonly logger = new Logger();

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Unique constraint failed.
    // See https://www.prisma.io/docs/orm/reference/error-reference#p2002.
    if (exception.code === 'P2002') {
      // We assume that the unique constraint was caused by the user passing a duplicate value to a unique field.
      return response.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
        message: 'Unique constraint failed',
        details: {
          fields: (exception.meta as { target: string[] }).target,
        },
      });
    }

    this.logger.error(exception.stack);
    const isDevelopment = process.env.NODE_ENV === 'development';
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'Internal Server Error',
      details: isDevelopment
        ? {
            code: exception.code,
            message: exception.message,
          }
        : undefined,
    });
  }
}

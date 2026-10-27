import { Prisma } from '@prisma/client';

/**
 * Handles an error thrown by a Prisma statement that is mutating an existing entity.
 * @param error
 */
export const handlePrismaMutationError = (error: unknown): null | never => {
  // Check if the error indicates that a required record does not exist.
  // See https://www.prisma.io/docs/orm/reference/error-reference#p2025.
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
    return null;
  }
  throw error;
};

/**
 * Checks whether an error was caused by a row that references a missing row through the given foreign key.
 * See https://www.prisma.io/docs/orm/reference/error-reference#p2003.
 */
export const isForeignKeyViolation = (error: unknown, constraint: string): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === 'P2003' &&
  error.meta?.['constraint'] === constraint;

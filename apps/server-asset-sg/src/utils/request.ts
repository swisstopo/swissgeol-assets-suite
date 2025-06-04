import { HttpException, HttpStatus } from '@nestjs/common';

export function parseEnumFromRequest<I, T extends I>(
  enumType: Record<string, T>,
  value: I | null | undefined,
  message: string,
): T | null;
export function parseEnumFromRequest<I, T extends I>(enumType: Record<string, T>, value: I, message: string): T;
export function parseEnumFromRequest<I, T extends I>(
  enumType: Record<string, T>,
  value: I | null | undefined,
  message: string,
): T | null {
  if (value == null) {
    return null;
  }
  for (const enumValue of Object.values(enumType)) {
    if (value === enumValue) {
      return enumValue;
    }
  }
  throw new HttpException(`${message}: ${value}`, HttpStatus.BAD_REQUEST);
}

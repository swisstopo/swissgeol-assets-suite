import { ValidateIf, ValidationOptions } from 'class-validator';
import { ValidationArguments } from 'class-validator/types/validation/ValidationArguments';

/**
 * Creates a validation failure message that indicates that the given property
 * must be either an integer or `null`.
 * @param property The validated property.
 */
export const messageNullableInt = ({ property }: ValidationArguments): string =>
    `${property} must be an integer number or null`;

/**
 * Creates a validation failure message that indicates that the given property
 * must be either a string or `null`.
 * @param property The validated property.
 */
export const messageNullableString = ({ property }: ValidationArguments): string =>
    `${property} must be a string or null`;

/**
 * Validates if a given value is `null`, and if so,
 * ignores all other validators on the property.
 *
 * @example```ts
 *   @IsNullable()
 *   @IsString()
 *   myProperty!: string | null
 * ```
 */
export function IsNullable(validationOptions?: ValidationOptions) {
    return ValidateIf((_object, value) => value !== null, validationOptions);
}

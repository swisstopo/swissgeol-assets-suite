import { registerDecorator, ValidationOptions } from 'class-validator';
import { ValidationArguments } from 'class-validator/types/validation/ValidationArguments';
import { Asset } from '../../models/asset';
import { LocalDate } from '../../models/base/local-date';

export function IsRestrictionDateNullIfIsPublic(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isRestrictionDateNullIfIsPublic',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: null | LocalDate, args: ValidationArguments) {
          if ((args.object as Asset).isPublic) {
            return value === null;
          }

          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be null when "isPublic" is true`;
        },
      },
    });
  };
}

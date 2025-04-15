import { instanceToPlain, Transform } from 'class-transformer';
import { Class } from 'type-fest';

/**
 * A _schema_ is a class that defines how a specific interface is converted from and to JSON.
 * This is their base type.
 *
 * Schemas support validation using the `class-validator` library and transform values using the `class-transform` library.
 *
 * # Converting plain values
 * A _plain value_ is an object as it is represented in JSON.
 * In other words, it's what you get when converting a schema instance to JSON and then parsing it using {@link JSON.parse}.
 * To convert a plain value into an instance of schema, use {@link plainToInstance}:
 * ```ts
 * const plainValue = JSON.parse(...);
 * const instanceValue = plainToInstance(MySchema, plainValue);
 * ```
 * Whenever you're using a schema, this conversion has to be done right after parsing a value from JSON.
 *
 * > In NestJS, the conversion and validation of values is handled automatically,
 * > as long as you define a `ValidationPipe` and use the schemas in the parameters of your API routes.
 *
 * # Converting instance values
 * Conversion of schema instances is handled automatically by {@link JSON.stringify}.
 * If you ever need to the plain value as a JSON object, use {@link instanceToPlain}:
 * ```ts
 * const instanceValue = ...;
 * const plainValue = instanceToPlain(instanceValue);
 * ```
 *
 * # Converting non-instance values to instance values
 * Often, you will have values that conform to a schema's interface, but are not instances of the schema itself.
 * For these values, conversion to plain values will not happen automatically.
 * To convert them to schema instances, use {@link convert}:
 * ```ts
 * const objectValue = ...
 * const instanceValue = convert(MySchema, objectValue);
 * ```
 * > A common reason for having to deal with non-instance values is due to loading values from a database
 * > or other external service.
 *
 * # Validating instance values
 * After converting a plain value to an instance value, it is often a good idea to validate it,
 * ensuring that it fits all criteria of the schema.
 * This can be done using the {@link validate} function:
 * ```ts
 * const instanceValue = ...;
 * const errors = await validate(instanceValue);
 * ```
 * If you simply want to throw an exception when validation fails, use {@link validateOrReject}:
 * ```ts
 * await validateOrReject(instanceValue);
 * ```
 * > Note that it's perfectly okay to not validate a newly converted instance
 * > in case you trust its source to always provide valid data.
 * > For example, validating API responses will most likely not make much sense.
 */
export class Schema {
  /**
   * Converts the schema instance to a plain value that can be converted to JSON using {@link JSON.stringify}.
   */
  toJSON(): object {
    return instanceToPlain(this);
  }
}

/**
 * Converts an object into a {@link Schema} instance.
 *
 * @param schema The schema class.
 * @param value The value to convert.
 */
export function convert<T extends object, S extends T>(schema: Class<S>, value: T): S;

/**
 * Converts an array of object into an array of {@link Schema} instances.
 *
 * @param schema The schema class.
 * @param value The values to convert.
 */
export function convert<T extends object, S extends T>(schema: Class<S>, value: T[]): S[];

export function convert<T extends object, S extends T>(schema: Class<S>, value: T | T[]): S | S[] {
  return Array.isArray(value) ? value.map((it) => convertSingle(schema, it)) : convertSingle(schema, value);
}

const convertSingle = <T extends object, S extends T>(schema: Class<S>, value: T): S => {
  const instance: S = Object.create(schema.prototype);
  for (const [key, keyValue] of Object.entries(value) as Array<[keyof T, S[keyof T]]>) {
    instance[key] = keyValue;
  }
  return instance;
};

export const TransformMap = (): PropertyDecorator => {
  const transformToClass = Transform(
    ({ value }) => {
      const map = new Map();
      for (const [key, keyValue] of value) {
        map.set(key, keyValue);
      }
      return map;
    },
    { toClassOnly: true },
  );
  const transformToPlain = Transform(({ value }) => [...value.entries()], { toPlainOnly: true });
  return (target, propertyKey) => {
    transformToClass(target, propertyKey);
    transformToPlain(target, propertyKey);
  };
};

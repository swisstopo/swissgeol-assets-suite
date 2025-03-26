type EnvType = typeof String | typeof Number | typeof Boolean;
type Env<T extends EnvType> = T extends typeof String
  ? string
  : T extends typeof Number
  ? number
  : T extends typeof Boolean
  ? boolean
  : never;

export const readEnv = <T extends EnvType = typeof String>(name: string, type: T = String as T): Env<T> | null => {
  const value = process.env[name];
  if (value === undefined || value.length === 0) {
    return null;
  }
  switch (type) {
    case String:
      return value as Env<T>;
    case Number: {
      const numberValue = Number(value);
      return isNaN(numberValue) ? null : (numberValue as Env<T>);
    }
    case Boolean: {
      const norm = value.toLowerCase();
      if (norm === 'false' || norm === 'no' || norm === 'n' || Number(norm) === 0) {
        return false as Env<T>;
      }
      if (norm === 'true' || norm === 'yes' || norm === 'y' || Number(norm) === 1) {
        return true as Env<T>;
      }
      throw new Error(`Unsupported boolean value for environment variable ${name}.`);
    }
  }
  throw new Error(`unknown env type: ${type}`);
};

export const requireEnv = <T extends EnvType = typeof String>(name: string, type: T = String as T): Env<T> => {
  const value = readEnv(name, type);
  if (value == null) {
    console.error(`missing environment variable '${name}'`);
    process.exit(1);
  }
  return value;
};

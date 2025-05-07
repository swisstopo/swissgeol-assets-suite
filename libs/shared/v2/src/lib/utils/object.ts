export const extend = <T>(base: T, extension: Partial<T>): T => {
  const result = { ...base };
  for (const key of Object.keys(extension) as Array<keyof T>) {
    const value = extension[key];
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
};

export const getKeys = Object.keys as <T extends object>(value: T) => Array<keyof T>;

export const getEntries = Object.entries as <T extends object>(value: T) => Array<[keyof T, T[keyof T]]>;

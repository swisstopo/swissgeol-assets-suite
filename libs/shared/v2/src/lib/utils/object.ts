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

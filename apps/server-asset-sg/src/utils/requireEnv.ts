export const readEnv = (name: string): string | null => {
  const value = process.env[name];
  return value == null || value.length === 0 ? null : value;
};

export const requireEnv = (name: string): string => {
  const value = readEnv(name);
  if (value == null) {
    console.error(`missing environment variable '${name}'`);
    process.exit(1);
  }
  return value;
};

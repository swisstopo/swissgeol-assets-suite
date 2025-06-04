export const error = (message: string): never => {
  throw new Error(message);
};

export const run = <T>(action: () => T): T => action();

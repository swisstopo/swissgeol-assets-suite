export const sleep = (millis: number) =>
  new Promise<void>((resolve) => {
    setTimeout(() => resolve(), millis);
  });

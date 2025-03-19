export const sleep = (millis: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, millis);
  });

export const tick = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });

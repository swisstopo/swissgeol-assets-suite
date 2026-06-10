/**
 * Races a promise against a timeout. Rejects with an error if the timeout
 * elapses before the promise settles. The timer is always cleaned up.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, message?: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    promise,
    new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => reject(new Error(message ?? `Timed out after ${ms}ms`)), ms);
    }),
  ]).finally(() => clearTimeout(timer!));
}

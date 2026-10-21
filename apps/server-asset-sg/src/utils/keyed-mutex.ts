/**
 * Serializes tasks by key while allowing tasks with different keys to run concurrently.
 * Exclusive tasks wait for all keyed tasks and block subsequently scheduled tasks.
 *
 * Tasks must not await another task scheduled on the same mutex, as this may deadlock.
 */
export class KeyedMutex<K = string> {
  private readonly tails = new Map<K, Promise<void>>();
  private exclusiveTail: Promise<void> | null = null;

  /**
   * Runs a task after previously scheduled tasks for the same key and any
   * preceding exclusive task.
   */
  async run<T>(key: K, task: () => Promise<T>): Promise<T> {
    const previousForKey = this.tails.get(key);
    const previous = this.waitFor(
      previousForKey === undefined ? [this.exclusiveTail] : [previousForKey, this.exclusiveTail],
    );

    const result = previous.then(task, task);

    // Stored tails must not reject, or they could produce unhandled rejections.
    const tail = guard(result);
    this.tails.set(key, tail);

    try {
      return await result;
    } finally {
      // A newer task may already have replaced this tail.
      if (this.tails.get(key) === tail) {
        this.tails.delete(key);
      }
    }
  }

  /**
   * Runs a task after all previously scheduled tasks and blocks subsequent ones.
   */
  async runExclusive<T>(task: () => Promise<T>): Promise<T> {
    const previous = this.waitFor([...this.tails.values(), this.exclusiveTail]);
    const result = previous.then(task, task);
    const tail = guard(result);
    this.exclusiveTail = tail;

    try {
      return await result;
    } finally {
      // A newer exclusive task may already have replaced this tail.
      if (this.exclusiveTail === tail) {
        this.exclusiveTail = null;
      }
    }
  }

  /** Number of keys with a pending or running task. */
  get size(): number {
    return this.tails.size;
  }

  private waitFor(tails: Array<Promise<void> | null>): Promise<void> {
    const pending = tails.filter((it): it is Promise<void> => it !== null);

    if (pending.length === 0) {
      return Promise.resolve();
    }
    if (pending.length === 1) {
      return pending[0];
    }

    return Promise.all(pending).then(() => undefined);
  }
}

const guard = (promise: Promise<unknown>): Promise<void> =>
  promise.then(
    () => undefined,
    () => undefined,
  );

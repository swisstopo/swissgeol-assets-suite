/**
 * `KeyedMutex` serializes asynchronous operations that share the same key while allowing operations
 * with different keys to run concurrently.
 *
 * It is used to prevent concurrent Elasticsearch index mutations for the same asset. Running such
 * mutations in parallel causes `version_conflict_engine_exception` errors, because a `deleteByQuery`
 * snapshot becomes stale as soon as another operation deletes or overwrites the same documents.
 *
 * The mutex keeps a per-key promise chain. Each task is appended to the tail of its key's chain and
 * only starts once the previous task for that key has settled (regardless of success or failure).
 * Once a key's chain drains, its entry is removed to avoid unbounded memory growth.
 */
export class KeyedMutex<K = string> {
  private readonly tails = new Map<K, Promise<unknown>>();

  /**
   * Runs `task` exclusively for the given `key`. Tasks with the same key run one after another in the
   * order they were scheduled. The returned promise resolves or rejects with the task's own result.
   */
  async run<T>(key: K, task: () => Promise<T>): Promise<T> {
    const previous = this.tails.get(key) ?? Promise.resolve();

    // Chain onto the previous task regardless of whether it resolved or rejected, so that a failing
    // task never blocks subsequent tasks for the same key.
    const result = previous.then(task, task);

    // The new tail must never reject, otherwise it would turn into an unhandled rejection once the
    // next task chains onto it. We therefore store a guarded promise as the tail.
    const tail = result.then(
      () => undefined,
      () => undefined,
    );
    this.tails.set(key, tail);

    try {
      return await result;
    } finally {
      // Only clean up if no other task has chained onto this key in the meantime.
      if (this.tails.get(key) === tail) {
        this.tails.delete(key);
      }
    }
  }

  /**
   * Returns the number of keys that currently have a pending or running task.
   * Exposed primarily for testing and diagnostics.
   */
  get size(): number {
    return this.tails.size;
  }
}

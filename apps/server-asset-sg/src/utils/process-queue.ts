import { sleep } from '@asset-sg/shared/v2';

/**
 * `ProcessQueue` is an async task runner that limits the number of tasks that can be run in parallel.
 */
export class ProcessQueue {
  private readonly buffer: Process[] = [];
  private readonly active = new Map<Process, Promise<void>>();

  constructor(private readonly quantity: number) {
    if (this.quantity < 1) {
      throw new Error('Quantity must a positive integer.');
    }
  }

  /**
   * Registers a new tasks to be run.
   *
   * @param run The task to run.
   */
  add(run: () => void | Promise<void>): Promise<void> {
    if (this.active.size < this.quantity) {
      return new Promise((resolve) => {
        const process: Process = { run, resolve };
        this.run(process).then();
      });
    }
    return new Promise((resolve) => {
      const process: Process = { run, resolve };
      this.buffer.push(process);
    });
  }

  /**
   * Returns a promise that resolves when the queue has no more tasks to run.
   */
  async waitForIdle(): Promise<void> {
    while (true) {
      if (this.active.size === 0 && this.buffer.length === 0) {
        return;
      }
      if (this.active.size > 0) {
        await Promise.all(this.active.values());
      } else {
        await sleep(1);
      }
    }
  }

  /**
   * Runs a task. Automatically continues to run any queued tasks afterward.
   *
   * @param process The task to run.
   * @private
   */
  private async run(process: Process): Promise<void> {
    try {
      const result = process.run();
      const promise = result instanceof Promise ? result : Promise.resolve();
      this.active.set(process, promise);
      await promise;
    } finally {
      this.finalize(process);
    }
  }

  /**
   * Resolves a finished process, and runs the next task in the queue, if present.
   *
   * @param process The task to resolve.
   * @private
   */
  private finalize(process: Process): void {
    this.active.delete(process);
    process.resolve();
    const next = this.buffer.shift();
    if (next !== undefined) {
      this.run(next).then();
    }
  }
}

interface Process {
  run(): void | Promise<void>;
  resolve(): void;
}

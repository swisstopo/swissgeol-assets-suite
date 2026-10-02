import { KeyedMutex } from './keyed-mutex';

const flushMicrotasks = () => new Promise((resolve) => setImmediate(resolve));

describe(KeyedMutex, () => {
  it('runs tasks with the same key sequentially, never overlapping', async () => {
    const mutex = new KeyedMutex<string>();
    let active = 0;
    let maxActive = 0;
    const order: number[] = [];

    const makeTask = (id: number) => async () => {
      active++;
      maxActive = Math.max(maxActive, active);
      // Yield a few times to give overlapping tasks a chance to interleave (they must not).
      await flushMicrotasks();
      await flushMicrotasks();
      order.push(id);
      active--;
    };

    await Promise.all([
      mutex.run('asset-1', makeTask(1)),
      mutex.run('asset-1', makeTask(2)),
      mutex.run('asset-1', makeTask(3)),
    ]);

    expect(maxActive).toBe(1);
    expect(order).toEqual([1, 2, 3]);
  });

  it('runs tasks with different keys concurrently', async () => {
    const mutex = new KeyedMutex<string>();
    let active = 0;
    let maxActive = 0;

    const makeTask = () => async () => {
      active++;
      maxActive = Math.max(maxActive, active);
      await flushMicrotasks();
      await flushMicrotasks();
      active--;
    };

    await Promise.all([mutex.run('a', makeTask()), mutex.run('b', makeTask()), mutex.run('c', makeTask())]);

    expect(maxActive).toBe(3);
  });

  it('does not let a failing task block subsequent tasks for the same key', async () => {
    const mutex = new KeyedMutex<string>();
    const order: string[] = [];

    const failing = mutex.run('asset-1', async () => {
      order.push('start-failing');
      throw new Error('boom');
    });

    const following = mutex.run('asset-1', async () => {
      order.push('start-following');
      return 'ok';
    });

    await expect(failing).rejects.toThrow('boom');
    await expect(following).resolves.toBe('ok');
    expect(order).toEqual(['start-failing', 'start-following']);
  });

  it('propagates the task result and errors to the caller', async () => {
    const mutex = new KeyedMutex<string>();
    await expect(mutex.run('k', async () => 42)).resolves.toBe(42);
    await expect(mutex.run('k', async () => Promise.reject(new Error('nope')))).rejects.toThrow('nope');
  });

  it('cleans up key entries once their chain drains', async () => {
    const mutex = new KeyedMutex<string>();
    await mutex.run('asset-1', async () => undefined);
    expect(mutex.size).toBe(0);

    await Promise.all([mutex.run('asset-1', async () => undefined), mutex.run('asset-2', async () => undefined)]);
    expect(mutex.size).toBe(0);
  });

  describe('runExclusive', () => {
    it('waits for in-flight keyed tasks on multiple keys', async () => {
      const mutex = new KeyedMutex<string>();
      const releaseA = new Deferred();
      const releaseB = new Deferred();
      const order: string[] = [];

      const a = mutex.run('a', async () => {
        await releaseA.promise;
        order.push('a');
      });
      const b = mutex.run('b', async () => {
        await releaseB.promise;
        order.push('b');
      });
      const exclusive = mutex.runExclusive(async () => {
        order.push('exclusive');
      });

      await flushMicrotasks();
      expect(order).toEqual([]);

      releaseB.resolve();
      await flushMicrotasks();
      expect(order).toEqual(['b']);

      releaseA.resolve();
      await Promise.all([a, b, exclusive]);
      expect(order).toEqual(['b', 'a', 'exclusive']);
    });

    it('blocks keyed tasks submitted after it until it settles', async () => {
      const mutex = new KeyedMutex<string>();
      const release = new Deferred();
      const order: string[] = [];

      const exclusive = mutex.runExclusive(async () => {
        await release.promise;
        order.push('exclusive');
      });
      const a = mutex.run('a', async () => {
        order.push('a');
      });
      const b = mutex.run('b', async () => {
        order.push('b');
      });

      await flushMicrotasks();
      expect(order).toEqual([]);

      release.resolve();
      await Promise.all([exclusive, a, b]);
      expect(order).toEqual(['exclusive', 'a', 'b']);
    });

    it('preserves submission order for mixed keyed and exclusive calls', async () => {
      const mutex = new KeyedMutex<string>();
      const order: string[] = [];
      const step = (name: string) => async () => {
        await flushMicrotasks();
        order.push(name);
      };

      // Every call depends on the one before it (same key or an exclusive barrier), so the order is total.
      await Promise.all([
        mutex.run('a', step('a1')),
        mutex.runExclusive(step('x1')),
        mutex.run('a', step('a2')),
        mutex.runExclusive(step('x2')),
        mutex.run('b', step('b1')),
        mutex.runExclusive(step('x3')),
      ]);

      expect(order).toEqual(['a1', 'x1', 'a2', 'x2', 'b1', 'x3']);
    });

    it('runs two exclusive calls sequentially', async () => {
      const mutex = new KeyedMutex<string>();
      let active = 0;
      let maxActive = 0;
      const order: number[] = [];

      const makeTask = (id: number) => async () => {
        active++;
        maxActive = Math.max(maxActive, active);
        await flushMicrotasks();
        await flushMicrotasks();
        order.push(id);
        active--;
      };

      await Promise.all([mutex.runExclusive(makeTask(1)), mutex.runExclusive(makeTask(2))]);

      expect(maxActive).toBe(1);
      expect(order).toEqual([1, 2]);
    });

    it('does not let a failing exclusive task block later keyed or exclusive tasks', async () => {
      const mutex = new KeyedMutex<string>();

      const failing = mutex.runExclusive(async () => {
        throw new Error('boom');
      });
      const keyed = mutex.run('a', async () => 'keyed');
      const exclusive = mutex.runExclusive(async () => 'exclusive');

      await expect(failing).rejects.toThrow('boom');
      await expect(keyed).resolves.toBe('keyed');
      await expect(exclusive).resolves.toBe('exclusive');
    });

    it('releases the mutex after successful and failed exclusive tasks', async () => {
      const mutex = new KeyedMutex<string>();

      await expect(mutex.runExclusive(async () => 1)).resolves.toBe(1);
      await expect(mutex.run('a', async () => 'a')).resolves.toBe('a');
      await expect(mutex.runExclusive(async () => 2)).resolves.toBe(2);

      await expect(mutex.runExclusive(async () => Promise.reject(new Error('nope')))).rejects.toThrow('nope');
      await expect(mutex.run('a', async () => 'a')).resolves.toBe('a');
      await expect(mutex.runExclusive(async () => 3)).resolves.toBe(3);
      expect(mutex.size).toBe(0);
    });

    it('keeps different keys concurrent once no exclusive task is pending', async () => {
      const mutex = new KeyedMutex<string>();
      await mutex.runExclusive(async () => undefined);

      let active = 0;
      let maxActive = 0;
      const makeTask = () => async () => {
        active++;
        maxActive = Math.max(maxActive, active);
        await flushMicrotasks();
        await flushMicrotasks();
        active--;
      };

      await Promise.all([mutex.run('a', makeTask()), mutex.run('b', makeTask())]);

      expect(maxActive).toBe(2);
    });
  });
});

class Deferred {
  readonly promise: Promise<void>;
  resolve!: () => void;

  constructor() {
    this.promise = new Promise<void>((resolve) => {
      this.resolve = resolve;
    });
  }
}

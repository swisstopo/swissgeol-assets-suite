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
});

import * as O from 'fp-ts/Option';

type Values<T> = T[keyof T];

type GetOptional<Obj> = Values<{
  [Prop in keyof Obj]: Obj[Prop] extends O.Option<unknown> ? Prop : never;
}>;

export const sequenceProps = <A, Key extends GetOptional<A>>(
  a: A,
  ...keys: Key[]
): O.Option<{ [K in keyof A]: K extends Key ? (A[K] extends O.Option<infer B> ? B : A[K]) : A[K] }> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const out = {} as any;
  let allSome = true;
  for (const key in a) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (keys.includes(key as any)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const value = a[key] as any;
      if (O.isSome(value)) {
        out[key] = value.value;
      } else {
        allSome = false;
        break;
      }
    } else {
      out[key] = a[key];
    }
  }
  return allSome ? O.some(out) : O.none;
};

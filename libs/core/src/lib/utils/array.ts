export const makePairs = <A>(as: Array<A>): Array<[A, A]> => {
  const bs: Array<[A, A]> = [];
  for (let i = 0; i + 1 < as.length; i += 2) {
    bs.push([as[i], as[i + 1]]);
  }
  return bs;
};

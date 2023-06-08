import { Either, Left, Right, isLeft } from 'fp-ts/Either';
import { Observable, map, partition } from 'rxjs';

export const partitionEither = <L, R>(source: Observable<Either<L, R>>): [Observable<L>, Observable<R>] => {
    const [lefts$, rights$] = partition(source, isLeft) as [Observable<Left<L>>, Observable<Right<R>>];
    return [lefts$.pipe(map(a => a.left)), rights$.pipe(map(a => a.right))];
};

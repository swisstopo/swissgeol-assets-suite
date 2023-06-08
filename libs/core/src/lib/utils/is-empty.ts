import { flow } from 'fp-ts/function';

export const isEmpty = (obj: Record<string, unknown>) => {
    for (const x in obj) {
        return false;
    }
    return true;
};
export const isNotEmpty = flow(isEmpty, a => !a);

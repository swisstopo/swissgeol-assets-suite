export interface Model<Id> {
    id: Id;
}

export type Data<T extends Model<unknown>> = Omit<T, 'id'>;

export const isPersisted = <T extends Model<unknown>>(value: T | Data<T>): value is T =>
    'id' in value && value.id !== undefined;

export const isNotPersisted = <T extends Model<unknown>>(value: T | Data<T>): value is Data<T> => !isPersisted(value);

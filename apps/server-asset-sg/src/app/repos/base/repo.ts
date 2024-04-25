
export interface Repo<T, TId, TData> {
    find(id: TId): Promise<T | null>
    create(data: TData): Promise<T>
    update(id: TId, data: TData): Promise<T | null>
    delete(id: TId): Promise<boolean>
}

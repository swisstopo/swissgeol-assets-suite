
export interface Repo<T, TId, TData> {
    find(id: TId): Promise<T | null>
    list(options: RepoListOptions): Promise<T[]>
    create(data: TData): Promise<T>
    update(id: TId, data: TData): Promise<T | null>
    delete(id: TId): Promise<boolean>
}

export interface RepoListOptions {
    limit: number
    offset?: number
}

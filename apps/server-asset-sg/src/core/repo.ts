export type Repo<T, TId, TData, TUpdate = TData> = ReadRepo<T, TId> & MutateRepo<T, TId, TData, TUpdate>;

export interface FindRepo<T, TId> {
  find(id: TId): Promise<T | null>;
}

export interface ListRepo<T, TId> {
  list(options?: RepoListOptions<TId>): Promise<T[]>;
}

export interface ReadRepo<T, TId> extends FindRepo<T, TId>, ListRepo<T, TId> {}

export interface MutateRepo<T, TId, TData, TUpdate = TData>
  extends CreateRepo<T, TData>,
    UpdateRepo<T, TId, TUpdate>,
    DeleteRepo<TId> {}

export interface CreateRepo<T, TData = T> {
  create(data: TData): Promise<T>;
}

export interface UpdateRepo<T, TId, TUpdate = T> {
  update(id: TId, data: TUpdate): Promise<T | null>;
}

export interface DeleteRepo<TId> {
  delete(id: TId): Promise<boolean>;
}

export interface RepoListOptions<TId> {
  limit?: number;
  offset?: number;
  ids?: TId[];
}

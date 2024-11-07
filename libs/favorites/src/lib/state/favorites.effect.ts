import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType, OnInitEffects } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { filter, map, switchMap } from 'rxjs';
import { FavoritesService } from '../services/favorites.service';
import * as actions from './favorites.actions';
import { FavoritesState } from './favorites.reducer';
import { selectIsInitialized } from './favorites.selector';

@Injectable()
export class FavoritesEffect implements OnInitEffects {
  private readonly store = inject(Store<FavoritesState>);
  private readonly actions$ = inject(Actions);
  private readonly favoritesService = inject(FavoritesService);

  ngrxOnInitEffects(): Action {
    return actions.initialize();
  }

  public loadInitial$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.initialize),
      switchMap(() => this.store.select(selectIsInitialized)),
      filter((isInitialized) => !isInitialized),
      map(() => actions.load())
    )
  );

  public load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(actions.load),
      switchMap(() => this.favoritesService.fetchIds()),
      map((assetIds) => actions.set({ assetIds }))
    )
  );

  public create$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(actions.add),
        switchMap(({ assetId }) => this.favoritesService.create(assetId))
      ),
    { dispatch: false }
  );

  public delete$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(actions.remove),
        switchMap(({ assetId }) => this.favoritesService.delete(assetId))
      ),
    { dispatch: false }
  );
}

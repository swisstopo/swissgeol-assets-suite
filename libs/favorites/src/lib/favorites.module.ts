import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SvgIconComponent } from '@ngneat/svg-icon';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { FavoriteButtonComponent } from './components/favorite-button/favorite-button.component';
import { FavoritesEffect } from './state/favorites.effect';
import { favoritesReducer } from './state/favorites.reducer';

@NgModule({
  declarations: [FavoriteButtonComponent],
  imports: [
    CommonModule,
    StoreModule.forFeature('favorites', favoritesReducer),
    EffectsModule.forFeature(FavoritesEffect),
    TranslateModule.forChild(),
    SvgIconComponent,
  ],
  providers: [],
  exports: [FavoriteButtonComponent],
})
export class FavoritesModule {}

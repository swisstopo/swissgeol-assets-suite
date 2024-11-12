import { ENTER } from '@angular/cdk/keycodes';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { appSharedStateActions, fromAppShared } from '@asset-sg/client-shared';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import * as O from 'fp-ts/Option';
import { EMPTY, filter, map, Observable, Subject, switchMap } from 'rxjs';
import { AuthService } from '../../features/auth/auth.service';
import { AppState } from '../../state/app-state';
import { Version } from './version';

@UntilDestroy()
@Component({
  selector: 'asset-sg-app-bar',
  templateUrl: './app-bar.component.html',
  styleUrls: ['./app-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppBarComponent implements OnInit {
  // TODO use new pattern here
  @Input() currentSearchText$: Observable<O.Option<string>> = EMPTY;
  @Output() public searchTextChanged: Observable<O.Option<string>>;

  @ViewChild('searchInput', { read: ElementRef, static: true }) searchInput!: ElementRef<HTMLInputElement>;

  public readonly searchTextKeyDown$ = new Subject<KeyboardEvent>();

  public version = '';

  private readonly store = inject(Store<AppState>);
  private readonly authService = inject(AuthService);

  public readonly isAnonymous$ = this.store.select(fromAppShared.selectIsAnonymousMode);

  public readonly user$ = this.authService.getUserProfile$();

  private readonly _ngOnInit$ = new Subject<void>();

  constructor(private readonly router: Router, private readonly httpClient: HttpClient) {
    this.httpClient.get<Version>('/assets/version.json').subscribe((v) => (this.version = v.version));
    this.searchTextChanged = this.searchTextKeyDown$.pipe(
      filter((ev) => ev.keyCode === ENTER),
      map((ev) => {
        const value = (ev.target as HTMLInputElement).value;
        return value ? O.some(value) : O.none;
      })
    );
    // TODO use new pattern here
    this._ngOnInit$
      .pipe(switchMap(() => this.currentSearchText$.pipe(map(O.toNullable), untilDestroyed(this))))
      .subscribe((currentSearchText) => {
        if (currentSearchText != this.searchInput.nativeElement.value) {
          this.searchInput.nativeElement.value = currentSearchText || '';
        }
      });
  }

  // TODO use new pattern here
  ngOnInit() {
    this._ngOnInit$.next();
  }

  logout(): void {
    this.authService.logOut();
    this.store.dispatch(appSharedStateActions.logout());
    this.router.navigate(['/']);
  }
}

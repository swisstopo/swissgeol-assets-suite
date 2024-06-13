import { TemplatePortal } from '@angular/cdk/portal';
import { ChangeDetectorRef, Component, TemplateRef, ViewChild, ViewContainerRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@asset-sg/auth';
import {
  ApiError,
  AppPortalService,
  AppState,
  LifecycleHooks,
  LifecycleHooksDirective,
  appSharedStateActions,
} from '@asset-sg/client-shared';
import { rdIsComplete } from '@asset-sg/core';
import { User } from '@asset-sg/shared';
import * as RD from '@devexperts/remote-data-ts';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { Subject, asyncScheduler, observeOn, switchMap } from 'rxjs';

interface ProfileComponentState {
  rdUser: RD.RemoteData<ApiError, User>;
}

@Component({
  selector: 'asset-sg-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  hostDirectives: [LifecycleHooksDirective],
})
export class ProfileComponent extends RxState<ProfileComponentState> {
  @ViewChild('templateDrawerPortalContent') templateDrawerPortalContent!: TemplateRef<unknown>;

  public state$ = this.select();

  private _lc = inject(LifecycleHooks);
  private _appPortalService = inject(AppPortalService);
  private _viewContainerRef = inject(ViewContainerRef);
  private _cd = inject(ChangeDetectorRef);
  private _authService = inject(AuthService);
  private _router = inject(Router);
  private _store = inject(Store<AppState>);

  public logoutClicked$ = new Subject<void>();

  constructor() {
    super();

    this.connect('rdUser', this._authService.getUserProfile());

    this._lc.afterViewInit$.pipe(observeOn(asyncScheduler)).subscribe(() => {
      this._appPortalService.setDrawerPortalContent(
        new TemplatePortal(this.templateDrawerPortalContent, this._viewContainerRef)
      );
      this._cd.detectChanges();
    });

    this.logoutClicked$.pipe(switchMap(async () => this._authService.logOut())).subscribe((rd) => {
      this._store.dispatch(appSharedStateActions.logout());
      this._router.navigate(['/']);
    });
  }
}

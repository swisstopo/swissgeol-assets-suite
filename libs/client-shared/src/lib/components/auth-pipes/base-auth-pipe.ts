import { ChangeDetectorRef, PipeTransform, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { AppState } from '../../state';

export abstract class BaseAuthPipe implements PipeTransform {
  private _store = inject(Store<AppState>);
  private _cdRef = inject(ChangeDetectorRef);

  private _value: boolean;

  constructor(initialValue: boolean, selector: (store: Store<AppState>) => Observable<boolean>) {
    this._value = initialValue;
    selector(this._store).subscribe((value) => {
      this._value = value;
      this._cdRef.markForCheck();
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(_: null): boolean {
    return this._value;
  }
}

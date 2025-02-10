import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  Input,
  NgZone,
  OnDestroy,
  inject,
} from '@angular/core';

import { ButtonComponent } from './button.component';

@Component({
  standalone: true,
  selector: 'a[asset-sg-reset], a[asset-sg-icon-button], a[asset-sg-primary], a[asset-sg-secondary], a[asset-sg-link]',
  template: '<ng-content></ng-content>',
  styleUrls: ['./button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnchorComponent extends ButtonComponent implements AfterViewInit, OnDestroy {
  private _ngZone = inject(NgZone);

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();

    this._ngZone.runOutsideAngular(() => {
      this._host.nativeElement.addEventListener('click', this._haltDisabledEvents);
    });
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this._host.nativeElement.removeEventListener('click', this._haltDisabledEvents);
  }

  _haltDisabledEvents = (event: Event): void => {
    if (this.disabled) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _tabIndex: any;
  @Input()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set tabindex(value: any) {
    this._tabIndex = value;
  }

  @HostBinding('tabindex')
  get calculatedTabIndex(): number {
    return this.disabled ? -1 : this._tabIndex;
  }
}

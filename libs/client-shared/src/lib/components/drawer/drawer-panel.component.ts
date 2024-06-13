import { NumberInput, coerceNumberProperty } from '@angular/cdk/coercion';
import { ChangeDetectionStrategy, Component, ElementRef, HostBinding, Input, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Component({
  standalone: true,
  selector: 'asset-sg-drawer-panel',
  template: '<ng-content></ng-content>',
  styleUrls: ['./drawer-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerPanelComponent {
  public _host = inject(ElementRef<HTMLElement>);

  @HostBinding('attr.data-width-percentage-of-view-panel')
  @Input()
  public set widthPercentageOfViewPanel(value: NumberInput) {
    this._widthPercentageOfViewPanel = coerceNumberProperty(value);
  }
  public get widthPercentageOfViewPanel() {
    return this._widthPercentageOfViewPanel;
  }

  private _widthPercentageOfViewPanel = 0;
  public getWidthPercentageOfViewPanel() {
    return this._widthPercentageOfViewPanel;
  }

  @Input()
  public set display(value: boolean) {
    this._display$.next(value);
  }

  public _display$ = new BehaviorSubject<boolean>(false);
}

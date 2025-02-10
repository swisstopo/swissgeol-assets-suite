import { FocusMonitor } from '@angular/cdk/a11y';
import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostBinding,
  Input,
  OnDestroy,
  inject,
} from '@angular/core';

@Component({
  standalone: true,
  selector:
    'button[asset-sg-reset], button[asset-sg-icon-button], button[asset-sg-primary], button[asset-sg-warn], button[asset-sg-secondary], button[asset-sg-icon-button-tw]',
  template: '<ng-content></ng-content>',
  styleUrls: ['./button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent implements AfterViewInit, OnDestroy {
  protected _host = inject<ElementRef<HTMLElement>>(ElementRef);
  private _focusMonitor = inject(FocusMonitor);
  private _cd = inject(ChangeDetectorRef);

  constructor() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes') {
          if (this._host.nativeElement.attributes.getNamedItem('asset-sg-icon-button-tw')) {
            this._classes = 'bg-white';
            this._cd.detectChanges();
          }
        }
      });
    });

    observer.observe(this._host.nativeElement, {
      attributes: true, //configure it to listen to attribute changes
    });
  }

  @HostBinding('class')
  private _classes: string | undefined;

  private _disabled: true | undefined;
  @HostBinding('[attr.disabled]')
  @HostBinding('[attr.aria-disabled]')
  @Input()
  get disabled(): true | false | undefined {
    return this._disabled;
  }
  set disabled(value: BooleanInput) {
    this._disabled = coerceBooleanProperty(value) || undefined;
  }

  @HostBinding('attr.type')
  @Input()
  public type = this._host.nativeElement.tagName === 'BUTTON' ? 'button' : undefined;

  ngAfterViewInit() {
    this._focusMonitor.monitor(this._host, false);
  }

  ngOnDestroy() {
    this._focusMonitor.stopMonitoring(this._host);
  }
}

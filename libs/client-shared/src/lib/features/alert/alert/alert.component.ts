import { Component, HostBinding, HostListener, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { asyncScheduler, interval, Observable, of, Subscription } from 'rxjs';

import { hideAlert } from '../alert.actions';
import { Alert, AlertType } from '../alert.model';
import { AlertMetadata, AlertState } from '../alert.reducer';

@Component({
  selector: 'li[app-alert]',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
  standalone: false,
})
export class AlertComponent implements OnInit, OnDestroy {
  @Input()
  alert!: Alert;

  @Input()
  metadata!: AlertMetadata;

  progress: number | null = null;

  private isRemoved = false;

  private countdownSubscription: Subscription | null = null;

  private readonly store = inject(Store<AlertState>);

  ngOnInit() {
    if (!this.alert.isPersistent) {
      this.progress = 0;
      this.countdown();
    }
  }

  ngOnDestroy(): void {
    this.countdownSubscription?.unsubscribe();
  }

  @HostBinding('class')
  get hostClass(): object {
    return {
      [`is-${this.alert.type}`]: true,
      ['is-removed']: this.isRemoved,
    };
  }

  @HostListener('click')
  handleClick() {
    this.remove();
  }

  get text$(): Observable<string> {
    const { text } = this.alert;
    return typeof text === 'string' ? of(text) : text;
  }

  get icon(): string {
    switch (this.alert.type) {
      case AlertType.Success:
        return 'checkmark';
      case AlertType.Notice:
        return 'info';
      case AlertType.Warning:
        return 'warn';
      case AlertType.Error:
        return 'failure';
    }
  }

  /**
   * Decrement the alert's progress, and remove the alert when it's progress reaches 0.
   * @private
   */
  private countdown() {
    this.countdownSubscription = interval(25).subscribe(() => {
      const now = Date.now();
      const lifetimeMillis = now - this.metadata.createdAt.getTime();
      this.progress = 1 - lifetimeMillis / TOTAL_LIFETIME_MILLIS;
      if (this.progress < 0) {
        this.remove();
      }
    });
  }

  /**
   * Animate the disappearance of the alert, and remove it from the store after the animation has concluded.
   * @private
   */
  private remove() {
    this.isRemoved = true;
    this.countdownSubscription?.unsubscribe();
    this.countdownSubscription = null;
    asyncScheduler.schedule(() => {
      this.store.dispatch(hideAlert({ id: this.alert.id }));
    }, 300);
  }
}

const TOTAL_LIFETIME_MILLIS = 5_000;

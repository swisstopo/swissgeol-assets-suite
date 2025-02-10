import {
  AfterContentChecked,
  AfterContentInit,
  AfterViewChecked,
  AfterViewInit,
  Directive,
  DoCheck,
  OnDestroy,
  OnInit,
} from '@angular/core';

import { LifecycleHooks } from './lifecycle-hooks.service';

@Directive({
  selector: '[lifecycleHooks]',
  standalone: true,
  providers: [LifecycleHooks],
})
export class LifecycleHooksDirective
  implements OnInit, DoCheck, AfterViewInit, AfterViewChecked, AfterContentInit, AfterContentChecked, OnDestroy
{
  constructor(public lifecycleHooks: LifecycleHooks) {}

  ngOnInit(): void {
    this.lifecycleHooks.onInit$.next();
  }

  ngDoCheck(): void {
    this.lifecycleHooks.onCheck$.next();
  }

  ngAfterViewInit(): void {
    this.lifecycleHooks.afterViewInit$.next();
  }

  ngAfterViewChecked(): void {
    this.lifecycleHooks.afterViewChecked$.next();
  }

  ngAfterContentInit(): void {
    this.lifecycleHooks.afterContentInit$.next();
  }

  ngAfterContentChecked(): void {
    this.lifecycleHooks.afterContentChecked$.next();
  }

  ngOnDestroy(): void {
    this.lifecycleHooks.onDestroy$.next();
  }
}

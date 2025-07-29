import { coerceBooleanProperty } from '@angular/cdk/coercion';

import {
  AfterViewInit,
  Component,
  ElementRef,
  HostBinding,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { v4 as uuid } from 'uuid';
import type { TabsComponent } from '../tabs/tabs.component';

@Component({
  selector: 'asset-sg-tab, a[asset-sg-tab]',
  templateUrl: './tab.component.html',
  styleUrl: './tab.component.scss',
  standalone: true,
  imports: [],
  host: {
    role: 'tab',
  },
})
export class TabComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input({ transform: (it: unknown) => (it === undefined ? null : coerceBooleanProperty(it)) })
  isActive: boolean | null = null;

  @Input()
  panel: HTMLElement | null = null;

  private _isSelected = false;

  @HostBinding('attr.aria-controls')
  private currentPanelId: string | null = null;

  private isManuallySelected = false;

  private currentPanel: HTMLElement | null = null;

  private generatedPanelId: string | null = null;

  private readonly elementRef: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly router = inject(Router);

  private readonly subscription = new Subscription();

  private parent: TabsComponent | null = null;

  ngOnInit(): void {
    this._isSelected = this.checkIfSelected();
    this.subscription.add(
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.syncSelected();
        }
      }),
    );
    this.elementRef.nativeElement.addEventListener('click', () => {
      this.handleClick();
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if ('panel' in changes) {
      this.initializePanel();
    }
    if ('isActive' in changes) {
      this.syncSelected();
    }
  }

  ngAfterViewInit() {
    setTimeout(() => this.syncSelected());
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.disconnectPanel();
  }

  setParent(tabs: TabsComponent): void {
    this.parent = tabs;
  }

  @HostBinding('attr.aria-selected')
  get isSelected(): boolean {
    return this._isSelected;
  }

  get panelId(): string | null {
    return this.generatedPanelId === null ? this.currentPanelId : null;
  }

  select(): void {
    this.isManuallySelected = true;
    this.syncSelected();
  }

  deselect(): void {
    this.isManuallySelected = false;
    this.syncSelected();
  }

  private handleClick(): void {
    this.parent?.selectTab(this);
  }

  private checkIfSelected(): boolean {
    if (this.isActive !== null) {
      return this.isActive;
    }
    const element = this.elementRef.nativeElement;
    if (element.tagName !== 'A') {
      return this.isManuallySelected;
    }
    const anchor = element as HTMLAnchorElement;
    return this.router.isActive(anchor.pathname, {
      paths: 'exact',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored',
    });
  }

  private initializePanel(): void {
    if (this.currentPanel === this.panel) {
      return;
    }
    this.disconnectPanel();
    if (this.panel === null) {
      return;
    }
    if (this.panel.id.length === 0) {
      this.generatedPanelId ??= uuid();
      this.panel.id = this.generatedPanelId;
    }
    this.currentPanel = this.panel;
    this.currentPanelId = this.panel.id;
    this.syncPanelVisibility();
  }

  private syncSelected(): void {
    const isNowSelected = this.checkIfSelected();
    if (this._isSelected === isNowSelected) {
      return;
    }
    this._isSelected = isNowSelected;
    this.syncPanelVisibility();
  }

  private syncPanelVisibility(): void {
    if (this.currentPanel === null) {
      return;
    }
    if (this._isSelected) {
      this.currentPanel.removeAttribute('hidden');
    } else {
      this.currentPanel.setAttribute('hidden', 'true');
    }
  }

  private disconnectPanel(): void {
    if (this.currentPanel === null) {
      return;
    }
    if (this.generatedPanelId !== null && this.currentPanel.id === this.generatedPanelId) {
      this.currentPanel.id = '';
    }
    this.currentPanel = null;
    this.currentPanelId = null;
  }
}

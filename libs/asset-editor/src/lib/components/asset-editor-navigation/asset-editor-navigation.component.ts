import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';

import { filter, startWith, Subscription, tap } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'asset-sg-editor-navigation',
  templateUrl: './asset-editor-navigation.component.html',
  styleUrls: ['./asset-editor-navigation.component.scss'],
  standalone: false,
})
export class AssetEditorNavigationComponent implements OnInit, OnDestroy {
  @Input() assetId = 'new';
  public activeTab = Tab.General;
  public form?: FormGroup;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly subscriptions: Subscription = new Subscription();

  readonly activeItem$ = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    startWith(() => undefined),
    tap(() => {
      const segments = (this.router.getCurrentNavigation() ?? this.router.lastSuccessfulNavigation)?.finalUrl?.root
        .children?.['primary']?.segments;
      if (segments !== undefined && segments.length > 0) {
        this.activeTab = segments.pop()?.path as Tab;
        console.log(this.activeTab);
      }
    })
  );

  public get tabs(): Tab[] {
    return Object.values(Tab);
  }

  public ngOnInit() {
    this.subscriptions.add(this.activeItem$.subscribe());
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  selectTab(tab: Tab): void {
    if (this.activeTab === tab) {
      return;
    }
    this.activeTab = tab;
    this.router.navigate(['../', tab], { relativeTo: this.route });
  }
}

enum Tab {
  General = 'general',
  Files = 'files',
  Usage = 'usage',
  Contacts = 'contacts',
  References = 'references',
  Geometries = 'geometries',
  Administration = 'administration',
}

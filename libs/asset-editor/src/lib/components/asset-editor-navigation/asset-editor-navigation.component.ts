import { Component, inject, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'asset-sg-editor-navigation',
  templateUrl: './asset-editor-navigation.component.html',
  styleUrls: ['./asset-editor-navigation.component.scss'],
  standalone: false,
})
export class AssetEditorNavigationComponent {
  @Input() public activeTab = Tab.General;
  public form?: FormGroup;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  public get tabs(): Tab[] {
    return Object.values(Tab);
  }

  selectTab(tab: Tab): void {
    if (this.activeTab === tab) {
      return;
    }
    this.activeTab = tab;
    this.router.navigate(['../', tab], { relativeTo: this.route });
  }
}

export enum Tab {
  General = 'general',
  Files = 'files',
  Usage = 'usage',
  Contacts = 'contacts',
  References = 'references',
  Geometries = 'geometries',
  Administration = 'administration',
}

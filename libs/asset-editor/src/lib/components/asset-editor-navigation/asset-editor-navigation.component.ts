import { Component, HostBinding, inject, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { EditorMode } from '../../models';

@UntilDestroy()
@Component({
  selector: 'asset-sg-editor-navigation',
  templateUrl: './asset-editor-navigation.component.html',
  styleUrls: ['./asset-editor-navigation.component.scss'],
  standalone: false,
})
export class AssetEditorNavigationComponent {
  @Input({ required: true })
  public activeTab!: Tab;

  @Input({ required: true })
  public mode!: EditorMode;

  @Input({ required: true })
  public tabs!: Tab[];

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  selectTab(tab: Tab): void {
    if (this.activeTab === tab) {
      return;
    }
    this.activeTab = tab;
    this.router.navigate(['../', tab], { relativeTo: this.route }).then();
  }

  @HostBinding('class')
  get hostClasses(): Record<string, boolean> {
    return {
      'is-create': this.mode === EditorMode.Create,
      'is-edit': this.mode === EditorMode.Edit,
    };
  }
}

export enum Tab {
  General = 'general',
  Files = 'files',
  Contacts = 'contacts',
  References = 'references',
  Geometries = 'geometries',
  LegacyData = 'legacyData',
  Status = 'status',
}

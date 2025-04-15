import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { fromAppShared, Translation } from '@asset-sg/client-shared';
import { Role, SimpleWorkgroup, WorkgroupId } from '@asset-sg/shared/v2';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { map, Subscription } from 'rxjs';
// TODO: move selector to different module so it can be used in all modules
// eslint-disable-next-line @nx/enforce-module-boundaries
import { selectLanguageFilters } from '../../../../../../asset-viewer/src/lib/state/asset-search/asset-search.selector';
import { AssetForm } from '../../asset-editor-page/asset-editor-page.component';

@UntilDestroy()
@Component({
  selector: 'asset-sg-editor-general',
  styleUrls: ['./asset-editor-general.component.scss'],
  templateUrl: './asset-editor-general.component.html',
  standalone: false,
})
export class AssetEditorGeneralComponent implements OnInit, OnDestroy {
  @Input() formGroup!: AssetForm['controls']['general'];

  public workgroups: SimpleWorkgroup[] = [];
  public languages: { name: Translation; value: string }[] = [];
  public selectedLanguages: string[] = [];
  private readonly store = inject(Store);
  private readonly subscription: Subscription = new Subscription();
  public readonly languageSelector$ = this.store.select(selectLanguageFilters).pipe(
    map((languageFilters) => {
      return languageFilters.map((lang) => ({ name: lang.name, value: lang.value }));
    })
  );

  public readonly availableWorkgroups$ = this.store
    .select(fromAppShared.selectWorkgroups)
    .pipe(map((workgroups) => workgroups.filter((it) => it.role != Role.Viewer)));

  public ngOnInit() {
    this.subscription.add(this.availableWorkgroups$.subscribe((workgroups) => (this.workgroups = workgroups)));
    this.subscription.add(this.languageSelector$.subscribe((languages) => (this.languages = languages)));
    this.subscription.add(this.formGroup.valueChanges.subscribe((v) => console.log(v)));
    this.selectedLanguages = this.formGroup.controls.assetLanguages.value?.map((lang) => lang.languageItemCode) ?? [];
  }

  public ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  public setIdFromWorkgroup(id: WorkgroupId) {
    this.formGroup.controls.workgroupId.setValue(id);
  }

  public setLangFromLangs(langs: string[]) {
    const languages = langs.map((l) => ({
      languageItemCode: l,
    }));
    this.formGroup.controls.assetLanguages.setValue(languages);
  }
}

import { Component, inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { fromAppShared } from '@asset-sg/client-shared';
import { isNotNull } from '@asset-sg/core';
import { Asset, LanguageCode, LocalizedItem, Role, SimpleWorkgroup } from '@asset-sg/shared/v2';
import { Store } from '@ngrx/store';
import { combineLatestWith, filter, map, Observable, startWith, Subscription } from 'rxjs';
import { AssetForm } from '../../asset-editor-page/asset-editor-page.component';

@Component({
  selector: 'asset-sg-editor-general',
  styleUrls: ['./asset-editor-general.component.scss'],
  templateUrl: './asset-editor-general.component.html',
  standalone: false,
})
export class AssetEditorGeneralComponent implements OnInit, OnChanges, OnDestroy {
  @Input() form!: AssetForm['controls']['general'];
  @Input() asset: Asset | null = null;
  @Input() hasReferences = false;

  public workgroups: SimpleWorkgroup[] = [];
  public selectedLanguageCodes: LanguageCode[] = [];
  public selectedTopics: LocalizedItem[] = [];
  public selectedNationalInterestTypes: LocalizedItem[] = [];

  private readonly store = inject(Store);

  public readonly nationalInterestTypes$: Observable<LocalizedItem[]> = this.store
    .select(fromAppShared.selectReferenceNationalInterestTypes)
    .pipe(
      filter(isNotNull),
      map((it) => [...it.values()]),
    );

  public readonly assetTopics$: Observable<LocalizedItem[]> = this.store
    .select(fromAppShared.selectReferenceAssetTopics)
    .pipe(
      filter(isNotNull),
      map((it) => [...it.values()]),
    );

  public readonly assetFormats$: Observable<LocalizedItem[]> = this.store
    .select(fromAppShared.selectReferenceAssetFormats)
    .pipe(
      filter(isNotNull),
      map((it) => [...it.values()]),
    );

  public readonly assetKinds$: Observable<LocalizedItem[]> = this.store
    .select(fromAppShared.selectReferenceAssetKinds)
    .pipe(
      filter(isNotNull),
      map((it) => [...it.values()]),
    );

  public readonly languages$: Observable<LocalizedItem<LanguageCode>[]> = this.store
    .select(fromAppShared.selectReferenceLanguages)
    .pipe(
      filter(isNotNull),
      map((it) => [...it.values()]),
    );

  public readonly availableWorkgroups$ = this.store
    .select(fromAppShared.selectWorkgroups)
    .pipe(map((workgroups) => workgroups.filter((it) => it.role != Role.Reader)));

  private readonly subscription: Subscription = new Subscription();

  public ngOnInit() {
    this.subscription.add(this.availableWorkgroups$.subscribe((workgroups) => (this.workgroups = workgroups)));
    this.subscription.add(
      this.form.controls.topicCodes.valueChanges
        .pipe(startWith(this.form.controls.topicCodes.value), combineLatestWith(this.assetTopics$))
        .subscribe(([selectedTopics, topics]) => {
          this.selectedTopics = topics.filter((item) => selectedTopics.includes(item.code));
        }),
    );
    this.subscription.add(
      this.form.controls.nationalInterestTypeCodes.valueChanges
        .pipe(
          startWith(this.form.controls.nationalInterestTypeCodes.value),
          combineLatestWith(this.nationalInterestTypes$),
        )
        .subscribe(([selectCodes, nationalInterestTypes]) => {
          this.selectedNationalInterestTypes = nationalInterestTypes.filter((item) => selectCodes?.includes(item.code));
        }),
    );
    this.subscription.add(
      this.form.controls.languageCodes.valueChanges
        .pipe(startWith(this.form.controls.languageCodes.value))
        .subscribe((codes) => {
          this.selectedLanguageCodes = codes;
        }),
    );
  }

  public ngOnChanges(changes: SimpleChanges) {
    if ('hasReferences' in changes) {
      const { workgroupId: workgroupIdControl } = this.form.controls;
      if (this.hasReferences) {
        workgroupIdControl.disable();
      } else {
        workgroupIdControl.enable();
      }
    }
  }

  public ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  public setLanguageCodes(codes: LanguageCode[]) {
    this.form.controls.languageCodes.setValue(codes);
    this.form.markAsDirty();
  }

  public removeItemFromForm(item: LocalizedItem, controlName: 'topicCodes' | 'nationalInterestTypeCodes') {
    const currentCodes = this.form.controls[controlName].value ?? [];
    const newValues = currentCodes.filter((value: string) => value !== item.code);
    this.form.controls[controlName].setValue(newValues);
    this.form.markAsDirty();
  }

  public addNewAlternativeId() {
    this.form.controls.identifiers.setValue([
      ...this.form.controls.identifiers.value,
      {
        value: '',
        description: '',
      },
    ]);
    this.form.markAsDirty();
  }
}

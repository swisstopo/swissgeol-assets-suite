// The `@asset-sg/client-shared` barrel and the viewer pull in OpenLayers (ESM), which Jest can't load.
// They are replaced by the few members the editor needs; the editor page, the general tab and the
// select component under test are the real implementations.
jest.mock('@asset-sg/client-shared', () => {
  const { InjectionToken } = jest.requireActual('@angular/core');
  const state = (key: string) => (s: Record<string, unknown>) => s[key];
  return {
    fromAppShared: {
      selectCurrentAssetAndGeometries: state('currentAsset'),
      selectReferenceAssetKinds: state('kinds'),
      selectReferenceAssetFormats: state('formats'),
      selectReferenceAssetTopics: state('topics'),
      selectReferenceLanguages: state('languages'),
      selectReferenceNationalInterestTypes: state('nationalInterestTypes'),
      selectWorkgroups: state('workgroups'),
    },
    LanguageService: jest.requireActual('../../../../../client-shared/src/lib/services/language.service')
      .LanguageService,
    AssetExportService: class {},
    ConfirmDialogComponent: class {},
    ROUTER_SEGMENTS: new InjectionToken('ROUTER_SEGMENTS'),
  };
});
jest.mock('@asset-sg/asset-viewer', () => ({ AssetSearchService: class {} }));
// Other tabs of the editor are not part of this test and need OpenLayers or the ui-core web components.
jest.mock('../asset-editor-tabs/asset-editor-files/asset-editor-files.component', () => ({
  isExistingAssetFile: (file: object) => 'id' in file,
}));
jest.mock('../asset-editor-tabs/asset-editor-geometry/asset-editor-geometries.component', () => {
  const { FormControl, FormGroup } = jest.requireActual('@angular/forms');
  return { makeGeometryForm: () => new FormGroup({ studies: new FormControl([], { nonNullable: true }) }) };
});

import { Directive, forwardRef, NO_ERRORS_SCHEMA, Pipe, PipeTransform, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { AssetSearchService } from '@asset-sg/asset-viewer';
import { AssetExportService, LanguageService, ROUTER_SEGMENTS } from '@asset-sg/client-shared';
import { Asset, fixtures, LocalizedItem, LocalizedItemCode } from '@asset-sg/shared/v2';
import { provideMockStore } from '@ngrx/store/testing';
import { TranslateModule } from '@ngx-translate/core';
import { RxPush } from '@rx-angular/template/push';
import { of } from 'rxjs';

// eslint-disable-next-line @nx/enforce-module-boundaries
import { SelectComponent } from '../../../../../client-shared/src/lib/components/select/select.component';
import { AssetEditorService } from '../../services/asset-editor.service';
import { AssetEditorGeneralComponent } from '../asset-editor-tabs/asset-editor-general/asset-editor-general.component';
import { AssetEditorPageComponent } from './asset-editor-page.component';

const item = (code: string): LocalizedItem =>
  ({ code, name: `name-${code}`, description: code, geolCode: '' }) as unknown as LocalizedItem;

const KINDS = ['report', 'map', 'log'].map(item);
const TOPICS = ['water'].map(item);

// Form fields of the general tab that are unrelated to asset types need a value accessor to render.
@Directive({
  selector: 'asset-sg-text-area, asset-sg-date-picker, mat-checkbox',
  standalone: false,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NoopValueAccessor), multi: true }],
})
class NoopValueAccessor implements ControlValueAccessor {
  writeValue(): void {
    // no-op
  }
  registerOnChange(): void {
    // no-op
  }
  registerOnTouched(): void {
    // no-op
  }
}

@Pipe({ name: 'smartTranslate', standalone: false })
class PassThroughSmartTranslatePipe implements PipeTransform {
  transform(value: unknown): unknown {
    return value;
  }
}

describe('asset types in the asset editor', () => {
  let fixture: ComponentFixture<AssetEditorPageComponent>;
  const updateAsset = jest.fn();
  const asset: Asset = {
    ...fixtures.assets.minimal,
    kindCodes: ['report', 'log'],
    topicCodes: ['water'],
  };

  const form = () => fixture.componentInstance['form'];
  const kindsControl = () => form().controls.general.controls.kindCodes;
  const kindsSelect = (): SelectComponent<LocalizedItem, LocalizedItemCode> =>
    fixture.debugElement
      .queryAll(By.directive(SelectComponent))
      .map((it) => it.componentInstance as SelectComponent<LocalizedItem, LocalizedItemCode>)
      .find((it) => it.title === 'edit.tabs.general.type') as SelectComponent<LocalizedItem, LocalizedItemCode>;

  const toMap = (items: LocalizedItem[]) => new Map(items.map((it) => [it.code, it]));
  const selectedCodes = () => (kindsSelect().selectedValues as LocalizedItem[]).map((it) => it.code);

  // Selects an option through the real overlay, as a user would.
  const toggleOption = async (label: string) => {
    const kindsElement = fixture.debugElement
      .queryAll(By.directive(SelectComponent))
      .find((it) => it.componentInstance.title === 'edit.tabs.general.type');
    kindsElement?.nativeElement.querySelector('.mat-mdc-select-trigger').click();
    fixture.detectChanges();
    await fixture.whenStable();
    const option = Array.from(document.querySelectorAll<HTMLElement>('mat-option')).find((it) =>
      it.textContent?.includes(label),
    );
    if (option === undefined) {
      throw new Error(`no option ${label}`);
    }
    option.click();
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    updateAsset.mockReset().mockReturnValue(of({ ...asset, kindCodes: ['report'] }));
    await TestBed.configureTestingModule({
      declarations: [
        AssetEditorPageComponent,
        AssetEditorGeneralComponent,
        NoopValueAccessor,
        PassThroughSmartTranslatePipe,
      ],
      imports: [
        ReactiveFormsModule,
        FormsModule,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
        RxPush,
        SelectComponent,
      ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideMockStore({
          initialState: {
            editor: { workflow: null },
            currentAsset: { asset, geometries: [] },
            kinds: toMap(KINDS),
            formats: toMap([item('binary')]),
            topics: toMap(TOPICS),
            languages: toMap([item('de')]),
            nationalInterestTypes: toMap([]),
            workgroups: [],
          },
        }),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ assetId: String(asset.id) })) } },
        { provide: Router, useValue: { navigate: jest.fn().mockResolvedValue(true) } },
        { provide: MatDialog, useValue: {} },
        { provide: LanguageService, useValue: { language: 'de' } },
        { provide: ROUTER_SEGMENTS, useValue: of([]) },
        { provide: AssetExportService, useValue: { isExporting: signal(false) } },
        {
          provide: AssetEditorService,
          useValue: { updateAsset, uploadFilesForAsset: jest.fn().mockReturnValue(of([])) },
        },
        { provide: AssetSearchService, useValue: { fetchGeometries: jest.fn().mockReturnValue(of([])) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AssetEditorPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    document.querySelectorAll('.cdk-overlay-container').forEach((it) => (it.innerHTML = ''));
  });

  it('loads every stored type into the form and the select', () => {
    expect(kindsControl().value).toEqual(['report', 'log']);
    expect(selectedCodes()).toEqual(['report', 'log']);
    expect(form().dirty).toBe(false);
    expect(kindsControl().valid).toBe(true);
  });

  it('adds a type to the selection and marks the form as changed', async () => {
    await toggleOption('name-map');

    expect(kindsControl().value).toEqual(['report', 'map', 'log']);
    expect(selectedCodes()).toEqual(['report', 'map', 'log']);
    expect(form().dirty).toBe(true);
  });

  it('removes a type from the selection', async () => {
    await toggleOption('name-report');

    expect(kindsControl().value).toEqual(['log']);
    expect(form().dirty).toBe(true);
    expect(kindsControl().valid).toBe(true);
  });

  it('is invalid and cannot be saved once the last type is removed', async () => {
    await toggleOption('name-report');
    await toggleOption('name-log');

    expect(kindsControl().value).toEqual([]);
    expect(kindsControl().hasError('required')).toBe(true);
    const saveBar = fixture.debugElement.query(By.css('asset-sg-editor-save'));
    expect(saveBar.properties['isSaveDisabled']).toBe(true);
  });

  it('saves all selected types', async () => {
    await toggleOption('name-map');

    const saveBar = fixture.debugElement.query(By.css('asset-sg-editor-save'));
    expect(saveBar.properties['isSaveDisabled']).toBe(false);
    saveBar.triggerEventHandler('save');

    expect(updateAsset).toHaveBeenCalledTimes(1);
    const [assetId, payload] = updateAsset.mock.calls[0];
    expect(assetId).toBe(asset.id);
    expect(payload.kindCodes).toEqual(['report', 'map', 'log']);
    expect(payload).not.toHaveProperty('kindCode');
  });

  it('restores the stored types when the changes are discarded', async () => {
    await toggleOption('name-map');

    fixture.debugElement.query(By.css('asset-sg-editor-save')).triggerEventHandler('discard');
    fixture.detectChanges();

    expect(kindsControl().value).toEqual(['report', 'log']);
    expect(form().dirty).toBe(false);
  });
});

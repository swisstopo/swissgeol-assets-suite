// The `@asset-sg/client-shared` barrel and the map controller pull in OpenLayers (ESM), which Jest can't load.
// They are reduced to the members the detail view uses; the component and its template are the real ones.
jest.mock('@asset-sg/client-shared', () => {
  const { of } = jest.requireActual('rxjs');
  const store = jest.requireActual('@ngrx/store');
  const state = (key: string) => (s: Record<string, unknown>) => s[key];
  return {
    // The state selectors of the viewer are built from many shared selectors; unused ones resolve to null.
    fromAppShared: new Proxy(
      {
        selectCurrentAsset: state('currentAsset'),
        selectIsAnonymousMode: state('isAnonymous'),
        selectReferenceContacts: state('contacts'),
      } as Record<string, unknown>,
      { get: (target, key: string) => target[key] ?? (() => null) },
    ),
    appSharedStateActions: {
      setCurrentAsset: store.createAction('[Asset Search] Set Current Asset', store.props()),
      removeAsset: store.createAction('[Asset Shared] Remove Asset', store.props()),
      updateAsset: store.createAction('[Asset Shared] Update Asset', store.props()),
    },
    AlertType: {},
    AssetExportService: class {},
    LanguageService: class {},
    can$: () => of(false),
    showAlert: jest.fn(),
  };
});
jest.mock('../map/map-controller', () => ({ DEFAULT_MAP_POSITION: { x: 0, y: 0, z: 0 }, MapController: class {} }));
jest.mock('ol/extent', () => ({ getCenter: jest.fn(() => [0, 0]) }));
jest.mock('ol/geom', () => ({ LineString: class {}, Polygon: class {} }));

import { Clipboard } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA, Pipe, PipeTransform, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AssetExportService, LanguageService } from '@asset-sg/client-shared';
import { Asset, fixtures } from '@asset-sg/shared/v2';
import { provideMockStore } from '@ngrx/store/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { ViewerControllerService } from '../../services/viewer-controller.service';
import { AssetSearchDetailComponent } from './asset-search-detail.component';

const REFERENCES: Record<string, Record<string, string>> = {
  assetKinds: { report: 'Bericht', map: 'Karte', log: 'Log' },
  assetFormats: { binary: 'Binär' },
};

@Pipe({ name: 'reference', standalone: false })
class StubReferencePipe implements PipeTransform {
  transform(code: string, key: string): string {
    return REFERENCES[key]?.[code] ?? '';
  }
}

@Pipe({ name: 'assetSgDate', standalone: false })
class StubDatePipe implements PipeTransform {
  transform(): string {
    return '';
  }
}

describe(AssetSearchDetailComponent, () => {
  let fixture: ComponentFixture<AssetSearchDetailComponent>;

  const render = (asset: Asset) => {
    TestBed.configureTestingModule({
      declarations: [AssetSearchDetailComponent, StubReferencePipe, StubDatePipe],
      imports: [CommonModule, TranslateModule.forRoot()],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideMockStore({
          initialState: { currentAsset: asset, isAnonymous: true, contacts: new Map() },
        }),
        { provide: Clipboard, useValue: {} },
        { provide: Router, useValue: {} },
        { provide: LanguageService, useValue: { language$: of('de') } },
        { provide: ViewerControllerService, useValue: {} },
        { provide: AssetExportService, useValue: { isExporting: signal(false) } },
      ],
    });
    fixture = TestBed.createComponent(AssetSearchDetailComponent);
    fixture.detectChanges();
  };

  const kindChips = (): string[] =>
    Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('[data-testid="assetKindCode"] asset-sg-chip'),
    ).map((it) => it.textContent?.trim() ?? '');

  it('shows a chip for every type of the asset', () => {
    render({ ...fixtures.assets.minimal, kindCodes: ['report', 'map', 'log'] });

    expect(kindChips()).toEqual(['Bericht', 'Karte', 'Log']);
  });

  it('shows a single chip for an asset with one type', () => {
    render({ ...fixtures.assets.minimal, kindCodes: ['map'] });

    expect(kindChips()).toEqual(['Karte']);
  });

  it('keeps the format in its own card', () => {
    render({ ...fixtures.assets.minimal, kindCodes: ['report', 'map'], formatCode: 'binary' });

    const format = (fixture.nativeElement as HTMLElement).querySelectorAll('[data-testid="assetFormat"] asset-sg-chip');
    expect(Array.from(format).map((it) => it.textContent?.trim())).toEqual(['Binär']);
  });
});

// The `@asset-sg/client-shared` barrel and the map controller pull in OpenLayers (ESM), which Jest can't load.
// They are reduced to the members the results table uses; the component and its template are the real ones.
jest.mock('@asset-sg/client-shared', () => {
  const store = jest.requireActual('@ngrx/store');
  return {
    appSharedStateActions: {
      setCurrentAsset: store.createAction('[Asset Search] Set Current Asset', store.props()),
      removeAsset: store.createAction('[Asset Shared] Remove Asset', store.props()),
      updateAsset: store.createAction('[Asset Shared] Update Asset', store.props()),
    },
    // The state selectors of the viewer are built from many shared selectors; they all resolve to `null`.
    fromAppShared: new Proxy({}, { get: () => () => null }),
    AssetExportService: class {},
    PdfOverlayService: class {},
  };
});
jest.mock('../map/map-controller', () => ({ DEFAULT_MAP_POSITION: { x: 0, y: 0, z: 0 }, MapController: class {} }));
jest.mock('ol/extent', () => ({ getCenter: jest.fn(() => [0, 0]) }));
jest.mock('ol/geom', () => ({ LineString: class {}, Polygon: class {} }));

import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA, Pipe, PipeTransform, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTableModule } from '@angular/material/table';
import { AssetExportService, PdfOverlayService } from '@asset-sg/client-shared';
import { AssetSearchResultItem, LocalDate, SearchType } from '@asset-sg/shared/v2';
import { provideMockStore } from '@ngrx/store/testing';
import { TranslateModule } from '@ngx-translate/core';
import { RxPush } from '@rx-angular/template/push';
import { NEVER } from 'rxjs';
import { AssetSearchService } from '../../services/asset-search.service';
import { ViewerControllerService } from '../../services/viewer-controller.service';
import {
  selectFileSearchResultItems,
  selectFileTotal,
  selectIsResultsOpen,
  selectScrollOffsetForResults,
  selectSearchQuery,
  selectSearchResultItems,
  selectSearchResults,
  selectSearchStats,
} from '../../state/asset-search/asset-search.selector';
import { AssetSearchResultsComponent } from './asset-search-results.component';

const REFERENCES: Record<string, Record<string, string>> = {
  assetKinds: { report: 'Bericht', map: 'Karte', log: 'Log' },
  assetFormats: { binary: 'PDF' },
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

const makeItem = (id: number, kindCodes: string[]): AssetSearchResultItem =>
  ({
    id,
    title: `Asset ${id}`,
    kindCodes,
    formatCode: 'binary',
    topicCodes: [],
    contacts: [],
    createdAt: LocalDate.of(2025, 1, 1),
  }) as unknown as AssetSearchResultItem;

describe(AssetSearchResultsComponent, () => {
  let fixture: ComponentFixture<AssetSearchResultsComponent>;

  const render = (items: AssetSearchResultItem[]) => {
    TestBed.configureTestingModule({
      declarations: [AssetSearchResultsComponent, StubReferencePipe, StubDatePipe],
      imports: [CommonModule, MatTableModule, RxPush, TranslateModule.forRoot()],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectIsResultsOpen, value: true },
            { selector: selectSearchQuery, value: { type: SearchType.Asset } },
            { selector: selectSearchResultItems, value: items },
            { selector: selectFileSearchResultItems, value: [] },
            { selector: selectSearchStats, value: { total: items.length } },
            { selector: selectFileTotal, value: 0 },
            { selector: selectScrollOffsetForResults, value: 0 },
            { selector: selectSearchResults, value: { page: { total: items.length } } },
          ],
        }),
        // The viewer never becomes ready, so the table is filled directly below.
        { provide: ViewerControllerService, useValue: { viewerReady$: NEVER } },
        { provide: PdfOverlayService, useValue: {} },
        { provide: AssetSearchService, useValue: {} },
        { provide: AssetExportService, useValue: { isExporting: signal(false) } },
      ],
    });
    fixture = TestBed.createComponent(AssetSearchResultsComponent);
    fixture.componentInstance.resultsToDisplay = items;
    fixture.detectChanges();
  };

  const kindCells = (): string[] =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('td.mat-column-assetFormat')).map((it) =>
      (it.textContent ?? '').replace(/\s+/g, ' ').trim(),
    );

  afterEach(() => fixture.destroy());

  it('lists every type of an asset in front of its format', () => {
    render([makeItem(1, ['report', 'map', 'log'])]);

    expect(kindCells()).toEqual(['Bericht, Karte, Log – PDF']);
  });

  it('shows a single type without separator', () => {
    render([makeItem(1, ['map'])]);

    expect(kindCells()).toEqual(['Karte – PDF']);
  });

  it('shows the types of each asset in its own row', () => {
    render([makeItem(1, ['report', 'map']), makeItem(2, ['log'])]);

    expect(kindCells()).toEqual(['Bericht, Karte – PDF', 'Log – PDF']);
  });
});

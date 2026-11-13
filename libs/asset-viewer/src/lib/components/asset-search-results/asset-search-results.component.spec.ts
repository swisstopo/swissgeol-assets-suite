// The `@asset-sg/client-shared` barrel and the map controller pull in OpenLayers (ESM), which Jest can't load.
// They are reduced to the members the results table uses; the component and its template are the real ones.
jest.mock('@asset-sg/client-shared', () =>
  jest
    .requireActual<
      typeof import('../../../testing/asset-search-test-helpers')
    >('../../../testing/asset-search-test-helpers')
    .createClientSharedMock({ PdfOverlayService: class {} }),
);
jest.mock('../map/map-controller', () => ({ DEFAULT_MAP_POSITION: { x: 0, y: 0, z: 0 }, MapController: class {} }));
jest.mock('ol/extent', () => ({ getCenter: jest.fn(() => [0, 0]) }));
jest.mock('ol/geom', () => ({ LineString: class {}, Polygon: class {} }));

import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTableModule } from '@angular/material/table';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { AssetExportService, PdfOverlayService } from '@asset-sg/client-shared';
import { AssetSearchResultItem, LocalDate, SearchType } from '@asset-sg/shared/v2';
import { provideMockStore } from '@ngrx/store/testing';
import { TranslateModule } from '@ngx-translate/core';
import { RxPush } from '@rx-angular/template/push';
import { NEVER } from 'rxjs';
import { StubDatePipe, StubReferencePipe } from '../../../testing/asset-search-test-helpers';
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

const makeItem = (id: number, kindCodes: string[], formatCodes: string[] = ['pdf']): AssetSearchResultItem =>
  ({
    id,
    title: `Asset ${id}`,
    kindCodes,
    formatCodes,
    topicCodes: [],
    contacts: [],
    createdAt: LocalDate.of(2025, 1, 1),
  }) as unknown as AssetSearchResultItem;

describe(AssetSearchResultsComponent, () => {
  let fixture: ComponentFixture<AssetSearchResultsComponent>;

  const render = (items: AssetSearchResultItem[]) => {
    TestBed.configureTestingModule({
      declarations: [AssetSearchResultsComponent],
      imports: [
        CommonModule,
        MatTableModule,
        MatTooltipModule,
        RxPush,
        TranslateModule.forRoot(),
        StubReferencePipe,
        StubDatePipe,
      ],
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

  const formatLines = (): HTMLElement[] =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('td.mat-column-assetFormat div.format'));

  const formats = (): string[] => formatLines().map((it) => (it.textContent ?? '').trim());

  const kindLines = (): string[][] =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('td.mat-column-assetFormat')).map((it) =>
      Array.from(it.querySelectorAll('div.kind')).map((div) => (div.textContent ?? '').trim()),
    );

  afterEach(() => fixture.destroy());

  it('lists every type of an asset in its own line above its format', () => {
    render([makeItem(1, ['report', 'map', 'log'])]);

    expect(kindLines()).toEqual([['Bericht', 'Karte', 'Log']]);
    expect(formats()).toEqual(['PDF']);
  });

  it('shows a single type in a single div', () => {
    render([makeItem(1, ['map'])]);

    expect(kindLines()).toEqual([['Karte']]);
    expect(formats()).toEqual(['PDF']);
  });

  it('shows the types of each asset in its own row', () => {
    render([makeItem(1, ['report', 'map']), makeItem(2, ['log'])]);

    expect(kindLines()).toEqual([['Bericht', 'Karte'], ['Log']]);
    expect(formats()).toEqual(['PDF', 'PDF']);
  });

  it('shows all formats of an asset comma-separated in a single line after its types', () => {
    render([makeItem(1, ['report'], ['pdf', 'GISFormat', 'segy', 'las'])]);

    expect(kindLines()).toEqual([['Bericht']]);
    expect(formats()).toEqual(['PDF, Shapefile, SEG, LAS']);
    const lines = (fixture.nativeElement as HTMLElement).querySelector('td.mat-column-assetFormat .line-list');
    expect(lines?.lastElementChild?.classList).toContain('format');
  });

  it('shows the full format list in a tooltip', () => {
    render([makeItem(1, ['report'], ['pdf', 'GISFormat', 'segy', 'las'])]);

    const tooltip = fixture.debugElement.query(By.css('td.mat-column-assetFormat div.format')).injector.get(MatTooltip);
    expect(tooltip.message).toEqual('PDF, Shapefile, SEG, LAS');
  });

  it('omits the format line for an asset without formats', () => {
    render([makeItem(1, ['report'], []), makeItem(2, ['map'], ['las'])]);

    expect(kindLines()).toEqual([['Bericht'], ['Karte']]);
    expect(formats()).toEqual(['LAS']);
  });
});

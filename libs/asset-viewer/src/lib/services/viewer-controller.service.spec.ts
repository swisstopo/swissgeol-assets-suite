// The viewer controller transitively imports the `@asset-sg/client-shared` barrel and the
// OpenLayers-based map controller, both of which pull in ESM modules that Jest does not transform.
// We only need a handful of lightweight actions/selectors from them for these unit tests, so we
// stub the heavy modules (matching the pattern used by other component/service specs in the repo).
jest.mock('@asset-sg/client-shared', () => {
  const store = jest.requireActual('@ngrx/store');
  const stubSelector = () => null;
  return {
    appSharedStateActions: {
      setCurrentAsset: store.createAction('[Asset Search] Set Current Asset', store.props()),
      removeAsset: store.createAction('[Asset Shared] Remove Asset', store.props()),
      updateAsset: store.createAction('[Asset Shared] Update Asset', store.props()),
    },
    fromAppShared: {
      selectCurrentAsset: stubSelector,
      selectHasCurrentAsset: stubSelector,
      selectReferenceContacts: stubSelector,
      selectReferenceData: stubSelector,
      selectWorkgroups: stubSelector,
      selectUser: stubSelector,
      selectIsAnonymousMode: stubSelector,
    },
    LanguageService: class MockLanguageService {},
  };
});

jest.mock('../components/map/map-controller', () => ({
  DEFAULT_MAP_POSITION: { x: 2660000, y: 1190000, z: 8 },
  MapController: class MockMapController {},
}));

// The state reducer pulls in OpenLayers (ESM) purely for geometry-center helpers that are
// irrelevant to these tests, so we stub those modules to keep the reducer importable.
jest.mock('ol/extent', () => ({ getCenter: jest.fn(() => [0, 0]) }));
jest.mock('ol/geom', () => ({ LineString: class {}, Polygon: class {} }));

import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import {
  AssetSearchQuery,
  AssetSearchResult,
  makeEmptyAssetSearchStats,
  makeEmptyFileSearchResults,
  SearchType,
} from '@asset-sg/shared/v2';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';

import { PanelState, setScrollOffsetForResults } from '../state/asset-search/asset-search.actions';
import {
  assetSearchReducer,
  AppStateWithAssetSearch,
  AssetSearchState,
} from '../state/asset-search/asset-search.reducer';
import { selectScrollOffsetForResults } from '../state/asset-search/asset-search.selector';
import { AssetSearchService } from './asset-search.service';
import { GeometryService } from './geometry.service';
import { isFavoritesOnlyChange, ViewerControllerService } from './viewer-controller.service';
import { ViewerParamsService } from './viewer-params.service';

const SET_CURRENT_ASSET = '[Asset Search] Set Current Asset';
const SET_RESULTS_STATE = '[Asset Search] Set Results Open';

const makeResults = (count: number): AssetSearchResult => ({
  page: { size: count, offset: 0, total: count },
  // The content of the items is irrelevant for these tests.
  data: Array.from({ length: count }, (_, i) => ({ id: i + 1 }) as never),
});

const makeSearchState = (overrides: Partial<AssetSearchState['ui']> = {}): AssetSearchState =>
  ({
    query: { type: SearchType.Asset },
    geometries: [],
    results: makeResults(5),
    fileResults: makeEmptyFileSearchResults(),
    stats: makeEmptyAssetSearchStats(),
    ui: {
      filtersState: PanelState.OpenedAutomatically,
      resultsState: PanelState.OpenedAutomatically,
      scrollOffsetForResults: 500,
      map: { x: 1, y: 2, z: 3 },
      ...overrides,
    },
    scrollOffsetForFavorites: 0,
    isLoadingGeometries: false,
    isLoadingResults: false,
    isLoadingFileResults: false,
    isLoadingStats: false,
  }) as AssetSearchState;

describe('isFavoritesOnlyChange', () => {
  it('returns true when only favoritesOnly is toggled on', () => {
    const previous: AssetSearchQuery = { type: SearchType.Asset, text: 'hydro' };
    const current: AssetSearchQuery = { type: SearchType.Asset, text: 'hydro', favoritesOnly: true };
    expect(isFavoritesOnlyChange(previous, current)).toBe(true);
  });

  it('returns true when only favoritesOnly is toggled off', () => {
    const previous: AssetSearchQuery = { type: SearchType.Asset, text: 'hydro', favoritesOnly: true };
    const current: AssetSearchQuery = { type: SearchType.Asset, text: 'hydro', favoritesOnly: false };
    expect(isFavoritesOnlyChange(previous, current)).toBe(true);
  });

  it('treats undefined and false favoritesOnly as equivalent (no change)', () => {
    const previous: AssetSearchQuery = { type: SearchType.Asset, text: 'hydro' };
    const current: AssetSearchQuery = { type: SearchType.Asset, text: 'hydro', favoritesOnly: false };
    expect(isFavoritesOnlyChange(previous, current)).toBe(false);
  });

  it('returns false when a search filter changed as well', () => {
    const previous: AssetSearchQuery = { type: SearchType.Asset, text: 'hydro' };
    const current: AssetSearchQuery = { type: SearchType.Asset, text: 'geo', favoritesOnly: true };
    expect(isFavoritesOnlyChange(previous, current)).toBe(false);
  });

  it('returns false when nothing changed', () => {
    const previous: AssetSearchQuery = { type: SearchType.Asset, text: 'hydro', favoritesOnly: true };
    const current: AssetSearchQuery = { type: SearchType.Asset, text: 'hydro', favoritesOnly: true };
    expect(isFavoritesOnlyChange(previous, current)).toBe(false);
  });
});

describe(ViewerControllerService.name, () => {
  let service: ViewerControllerService;
  let store: MockStore<AppStateWithAssetSearch>;
  let assetSearchService: { search: jest.Mock; searchStats: jest.Mock };
  let dispatchSpy: jest.SpyInstance;

  const setup = (ui?: Partial<AssetSearchState['ui']>) => {
    assetSearchService = {
      search: jest.fn().mockReturnValue(of(makeResults(5))),
      searchStats: jest.fn().mockReturnValue(of(makeEmptyAssetSearchStats())),
    };

    TestBed.configureTestingModule({
      providers: [
        ViewerControllerService,
        provideMockStore({ initialState: { assetSearch: makeSearchState(ui) } as AppStateWithAssetSearch }),
        { provide: AssetSearchService, useValue: assetSearchService },
        { provide: ViewerParamsService, useValue: {} },
        { provide: GeometryService, useValue: {} },
        { provide: Router, useValue: { events: of() } },
      ],
    });

    service = TestBed.inject(ViewerControllerService);
    store = TestBed.inject(MockStore);
    dispatchSpy = jest.spyOn(store, 'dispatch');
  };

  const dispatchedTypes = (): string[] => dispatchSpy.mock.calls.map(([action]) => (action as { type: string }).type);

  const updateByQuery = (current: AssetSearchQuery, previous: AssetSearchQuery): Promise<void> =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (service as any).updateByQuery(current, previous);

  it('preserves the selected asset and results panel when toggling favoritesOnly', async () => {
    setup();
    const previous: AssetSearchQuery = { type: SearchType.Asset, text: 'hydro' };
    const current: AssetSearchQuery = { type: SearchType.Asset, text: 'hydro', favoritesOnly: true };

    await updateByQuery(current, previous);

    const types = dispatchedTypes();
    // The selected asset must not be reset when switching to the Favorites tab.
    expect(types).not.toContain(SET_CURRENT_ASSET);
    // The results panel state must be preserved across the tab switch.
    expect(types).not.toContain(SET_RESULTS_STATE);
  });

  it('does not auto-select even when the favorites result set has a single asset', async () => {
    setup();
    assetSearchService.search.mockReturnValue(of(makeResults(1)));
    const previous: AssetSearchQuery = { type: SearchType.Asset, text: 'hydro' };
    const current: AssetSearchQuery = { type: SearchType.Asset, text: 'hydro', favoritesOnly: true };

    await updateByQuery(current, previous);

    expect(dispatchedTypes()).not.toContain(SET_CURRENT_ASSET);
  });

  it('resets the selected asset and recomputes the results panel on an actual search change', async () => {
    setup();
    const previous: AssetSearchQuery = { type: SearchType.Asset, text: 'hydro' };
    const current: AssetSearchQuery = { type: SearchType.Asset, text: 'geo' };

    await updateByQuery(current, previous);

    const types = dispatchedTypes();
    // A real search change resets the previously selected asset...
    expect(types).toContain(SET_CURRENT_ASSET);
    const resetAsset = dispatchSpy.mock.calls
      .map(([action]) => action as { type: string; asset?: unknown })
      .find((action) => action.type === SET_CURRENT_ASSET);
    expect(resetAsset?.asset).toBeNull();
    // ...and recomputes the results panel state (open, since there are results).
    expect(types).toContain(SET_RESULTS_STATE);
  });
});

describe('result-list scroll offset decoupling (Filter vs Favorites)', () => {
  const favoritesQuery = { type: SearchType.Asset, favoritesOnly: true } as const;

  describe('reducer', () => {
    it('routes the offset to the Filter view when not in favorites mode', () => {
      const state = makeSearchState({ scrollOffsetForResults: 0 });

      const next = assetSearchReducer(state, setScrollOffsetForResults({ offset: 1000 }));

      expect(next.ui.scrollOffsetForResults).toBe(1000);
      expect(next.scrollOffsetForFavorites).toBe(0);
    });

    it('routes the offset to the Favorites view when in favorites mode', () => {
      const state: AssetSearchState = { ...makeSearchState({ scrollOffsetForResults: 500 }), query: favoritesQuery };

      const next = assetSearchReducer(state, setScrollOffsetForResults({ offset: 1000 }));

      expect(next.scrollOffsetForFavorites).toBe(1000);
      // The Filter view's offset must remain untouched.
      expect(next.ui.scrollOffsetForResults).toBe(500);
    });

    it('keeps the Filter scroll position when scrolling in the Favorites view', () => {
      // Filter view scrolled to 1000.
      let state = assetSearchReducer(
        makeSearchState({ scrollOffsetForResults: 0 }),
        setScrollOffsetForResults({ offset: 1000 }),
      );
      // Switch to the Favorites tab and scroll there.
      state = assetSearchReducer(
        { ...state, query: { ...state.query, favoritesOnly: true } },
        setScrollOffsetForResults({ offset: 200 }),
      );

      expect(state.ui.scrollOffsetForResults).toBe(1000);
      expect(state.scrollOffsetForFavorites).toBe(200);
    });
  });

  describe('selector', () => {
    it('returns the Filter offset in Filter mode', () => {
      const state: AssetSearchState = {
        ...makeSearchState({ scrollOffsetForResults: 1000 }),
        scrollOffsetForFavorites: 200,
      };

      expect(selectScrollOffsetForResults.projector(state)).toBe(1000);
    });

    it('returns the Favorites offset in Favorites mode', () => {
      const state: AssetSearchState = {
        ...makeSearchState({ scrollOffsetForResults: 1000 }),
        query: favoritesQuery,
        scrollOffsetForFavorites: 200,
      };

      expect(selectScrollOffsetForResults.projector(state)).toBe(200);
    });
  });
});

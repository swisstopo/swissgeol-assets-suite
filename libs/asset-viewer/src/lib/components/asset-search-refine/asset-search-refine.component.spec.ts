// The component transitively imports the `@asset-sg/client-shared` barrel and the
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
      selectWorkgroups: () => [],
      selectUser: stubSelector,
      selectIsAnonymousMode: stubSelector,
    },
    LanguageService: class MockLanguageService {},
  };
});

jest.mock('../../components/map/map-controller', () => ({
  DEFAULT_MAP_POSITION: { x: 2660000, y: 1190000, z: 8 },
  MapController: class MockMapController {},
}));

// The state reducer pulls in OpenLayers (ESM) purely for geometry-center helpers that are
// irrelevant to these tests, so we stub those modules to keep the reducer importable.
jest.mock('ol/extent', () => ({ getCenter: jest.fn(() => [0, 0]) }));
jest.mock('ol/geom', () => ({ LineString: class {}, Polygon: class {} }));

import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA, Pipe, PipeTransform } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Contact, ContactKindCode, LocalDate, SearchType } from '@asset-sg/shared/v2';
import { StoreModule, Store } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TranslateModule } from '@ngx-translate/core';
import { RxPush } from '@rx-angular/template/push';

import { resetSearch as resetSearchAction, updateSearchQuery } from '../../state/asset-search/asset-search.actions';
import { AppStateWithAssetSearch, assetSearchReducer } from '../../state/asset-search/asset-search.reducer';
import {
  selectActiveFilters,
  selectAvailableAuthors,
  selectCreatedAt,
  selectIsFiltersOpen,
} from '../../state/asset-search/asset-search.selector';
import { mapControlReducer } from '../../state/map-control/map-control.reducer';
import { AssetSearchRefineComponent } from './asset-search-refine.component';

const makeContact = (id: number, name: string): Contact => ({
  id,
  name,
  street: null,
  houseNumber: null,
  plz: null,
  locality: null,
  country: null,
  telephone: null,
  email: null,
  website: null,
  kindCode: ContactKindCode.Private,
});

// The template's generic filter chips (workgroup/usage/language/... filters) use the real
// `smartTranslate` pipe from `@asset-sg/client-shared`, which is stubbed out above. This local
// pass-through stand-in only exists to satisfy the template compiler; it plays no part in the
// author/date-chip regression under test.
@Pipe({ name: 'smartTranslate', standalone: false })
class TestSmartTranslatePipe implements PipeTransform {
  transform(value: unknown): unknown {
    return value;
  }
}

describe('AssetSearchRefineComponent', () => {
  let component: AssetSearchRefineComponent;
  let store: MockStore<AppStateWithAssetSearch>;

  const initialState: AppStateWithAssetSearch['assetSearch'] = assetSearchReducer(undefined, { type: '@@INIT' });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AssetSearchRefineComponent,
        provideMockStore({
          initialState: { assetSearch: initialState },
          selectors: [
            { selector: selectIsFiltersOpen, value: true },
            { selector: selectActiveFilters, value: [] },
            { selector: selectCreatedAt, value: null },
            { selector: selectAvailableAuthors, value: [] },
          ],
        }),
      ],
    });

    store = TestBed.inject(MockStore);
    component = TestBed.inject(AssetSearchRefineComponent);
    component.ngOnInit();
    component.ngAfterViewInit();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('clears the author, both date fields, and dispatches resetSearch when reset is triggered', () => {
    // Arrange: simulate a user having selected an author and both document dates.
    component.authorAutoCompleteControl.setValue('Jane Doe');
    component.filteredAuthors = [{ value: makeContact(1, 'Jane Doe'), count: 3 }];
    component.updateAuthor({ isUserInput: true } as never, 1);

    component.minDateControl.setValue(new Date(2020, 0, 1));
    component.maxDateControl.setValue(new Date(2021, 0, 1));

    expect(component.selectedAuthor?.value.id).toBe(1);
    expect(component.minDateControl.value).not.toBeNull();
    expect(component.maxDateControl.value).not.toBeNull();

    const dispatchSpy = jest.spyOn(store, 'dispatch');

    // Act
    component.resetSearch();

    // Assert: local/UI state is fully cleared.
    expect(component.authorAutoCompleteControl.value).toBe('');
    expect(component.selectedAuthor).toBeUndefined();
    expect(component.minDateControl.value).toBeNull();
    expect(component.maxDateControl.value).toBeNull();

    // Assert: the reset action was dispatched to clear the effective search state.
    expect(dispatchSpy).toHaveBeenCalledWith(resetSearchAction());
  });

  it('resets correctly when only the min date is set', () => {
    component.minDateControl.setValue(new Date(2020, 0, 1));
    expect(component.minDateControl.value).not.toBeNull();

    component.resetSearch();

    expect(component.minDateControl.value).toBeNull();
    expect(component.maxDateControl.value).toBeNull();
    expect(component.authorAutoCompleteControl.value).toBe('');
  });

  it('resets correctly when only the max date is set', () => {
    component.maxDateControl.setValue(new Date(2021, 0, 1));
    expect(component.maxDateControl.value).not.toBeNull();

    component.resetSearch();

    expect(component.minDateControl.value).toBeNull();
    expect(component.maxDateControl.value).toBeNull();
    expect(component.authorAutoCompleteControl.value).toBe('');
  });

  it('resets correctly when only an author is set', () => {
    component.authorAutoCompleteControl.setValue('John Smith');
    component.filteredAuthors = [{ value: makeContact(2, 'John Smith'), count: 1 }];
    component.updateAuthor({ isUserInput: true } as never, 2);

    expect(component.selectedAuthor?.value.id).toBe(2);

    component.resetSearch();

    expect(component.selectedAuthor).toBeUndefined();
    expect(component.authorAutoCompleteControl.value).toBe('');
  });
});

// This suite renders the component's real template (chips, author input, date inputs) against a
// real Store + real `assetSearchReducer`/selectors (instead of hardcoding `selectActiveFilters`),
// so it reproduces the actual reported regression: after clicking "Filter zurücksetzen", the author
// and date chips - and the values shown in their inputs - stayed on screen even though the search
// itself was reset. If `resetSearch()` regresses to only clearing one of the two date controls (or
// forgets to clear `selectedAuthor`), this suite fails.
describe('AssetSearchRefineComponent (DOM regression: chips & inputs after reset)', () => {
  let fixture: ComponentFixture<AssetSearchRefineComponent>;
  let component: AssetSearchRefineComponent;

  const author = makeContact(7, 'Jane Doe');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AssetSearchRefineComponent, TestSmartTranslatePipe],
      imports: [
        ReactiveFormsModule,
        CommonModule,
        NoopAnimationsModule,
        MatAutocompleteModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatFormFieldModule,
        MatInputModule,
        RxPush,
        TranslateModule.forRoot(),
        StoreModule.forRoot({ assetSearch: assetSearchReducer, mapControl: mapControlReducer }),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AssetSearchRefineComponent);
    component = fixture.componentInstance;

    fixture.detectChanges(); // ngOnInit
    fixture.detectChanges(); // ngAfterViewInit wiring happens after the first change detection pass

    // Make the author available for selection, as the real `selectAvailableAuthors` selector would.
    // (Assigned after init, since `ngOnInit` subscribes to the store-backed `availableAuthors$` and
    // would otherwise immediately overwrite this with the empty/null reference-data stub.)
    component.availableAuthors = [{ value: author, count: 1 }];
    component.filteredAuthors = [{ value: author, count: 1 }];
  });

  const chipTexts = (): string[] =>
    Array.from(fixture.nativeElement.querySelectorAll('asset-sg-chip')).map((el) =>
      (el as HTMLElement).textContent!.trim(),
    );

  const authorInput = (): HTMLInputElement => fixture.nativeElement.querySelector('input[placeholder="Autor wählen"]');
  const dateInputs = (): HTMLInputElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('mat-form-field input[type="text"]')).filter(
      (el) => el !== authorInput(),
    ) as HTMLInputElement[];

  it('shows author and date chips/values while active, and removes them after reset', async () => {
    // Arrange: select an author and both document dates, exactly like the reported repro steps.
    component.authorAutoCompleteControl.setValue('Jane Doe');
    component.updateAuthor({ isUserInput: true } as never, author.id);
    component.minDateControl.setValue(new Date(2020, 0, 1));
    component.maxDateControl.setValue(new Date(2021, 0, 1));
    fixture.detectChanges();
    // MatAutocompleteTrigger#writeValue defers writing the input's DOM value to a microtask.
    await fixture.whenStable();
    fixture.detectChanges();

    // Assert: chips for author + both dates are rendered in the DOM.
    const textsBeforeReset = chipTexts();
    expect(textsBeforeReset.some((text) => text.includes('Jane Doe'))).toBe(true);
    expect(textsBeforeReset.some((text) => text.includes('01.01.2020'))).toBe(true);
    expect(textsBeforeReset.some((text) => text.includes('01.01.2021'))).toBe(true);

    // Assert: the input fields reflect the selected values.
    expect(authorInput().value).toBe('Jane Doe');
    const [dateInput1, dateInput2] = dateInputs();
    expect(dateInput1.value).not.toBe('');
    expect(dateInput2.value).not.toBe('');

    // Act: click the actual "Filter zurücksetzen" button.
    const resetButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find((button) =>
      (button as HTMLElement).textContent!.includes('search.resetSearch'),
    ) as HTMLButtonElement;
    expect(resetButton).toBeTruthy();
    resetButton.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // Assert: chips for author + both dates are gone from the DOM.
    const textsAfterReset = chipTexts();
    expect(textsAfterReset.some((text) => text.includes('Jane Doe'))).toBe(false);
    expect(textsAfterReset.some((text) => text.includes('01.01.2020'))).toBe(false);
    expect(textsAfterReset.some((text) => text.includes('01.01.2021'))).toBe(false);

    // Assert: the input fields are empty again.
    expect(authorInput().value).toBe('');
    for (const input of dateInputs()) {
      expect(input.value).toBe('');
    }

    // Assert: the effective search/filter model (real store, real reducer) no longer contains
    // the author or the date range, and a follow-up search would not reuse them.
    const state = TestBed.inject(Store).select((state: AppStateWithAssetSearch) => state.assetSearch.query);
    let latestQuery: AppStateWithAssetSearch['assetSearch']['query'] | undefined;
    state.subscribe((query) => (latestQuery = query));
    expect(latestQuery?.authorId).toBeUndefined();
    expect(latestQuery?.createdAt).toBeUndefined();
  });
});

describe('assetSearchReducer resetSearch', () => {
  it('clears createdAt, authorId, and other query criteria while keeping type/favoritesOnly', () => {
    const stateWithFilters = assetSearchReducer(
      undefined,
      updateSearchQuery({
        query: {
          authorId: 42,
          createdAt: { min: LocalDate.fromDate(new Date(2020, 0, 1)), max: LocalDate.fromDate(new Date(2021, 0, 1)) },
        },
      }),
    );

    expect(stateWithFilters.query.authorId).toBe(42);
    expect(stateWithFilters.query.createdAt).toBeDefined();

    const resetState = assetSearchReducer(stateWithFilters, resetSearchAction());

    expect(resetState.query).toEqual({ type: SearchType.Asset, favoritesOnly: undefined });
    expect(resetState.query.authorId).toBeUndefined();
    expect(resetState.query.createdAt).toBeUndefined();
  });
});

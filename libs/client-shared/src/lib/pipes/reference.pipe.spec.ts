import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LocalizedItem, ReferenceDataMapping } from '@asset-sg/shared/v2';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { LanguageService } from '../services/language.service';
import { selectReferenceData } from '../state/app-shared-state.selectors';
import { ReferencePipe } from './reference.pipe';

const item = (code: string, de: string, fr: string): [string, LocalizedItem] => [
  code,
  { code, name: { default: de, de, fr } } as unknown as LocalizedItem,
];

describe(ReferencePipe, () => {
  const create = (language: string): ReferencePipe => {
    const referenceData = {
      assetFormats: new Map([
        item('pdf', 'PDF', 'PDF'),
        item('GISFormat', 'Shapefile', 'Shapefile'),
        item('db', 'Datenbank', 'Base de données'),
      ]),
    } as unknown as ReferenceDataMapping;
    TestBed.configureTestingModule({
      providers: [
        ReferencePipe,
        provideMockStore({ selectors: [{ selector: selectReferenceData, value: referenceData }] }),
        { provide: LanguageService, useValue: { language, language$: of(language) } },
        { provide: ChangeDetectorRef, useValue: { markForCheck: jest.fn() } },
      ],
    });
    return TestBed.inject(ReferencePipe);
  };

  it('localizes a single code', () => {
    expect(create('de').transform('db', 'assetFormats')).toEqual('Datenbank');
  });

  it('joins a list of codes with commas, keeping their order', () => {
    expect(create('fr').transform(['pdf', 'GISFormat', 'db'], 'assetFormats')).toEqual(
      'PDF, Shapefile, Base de données',
    );
  });

  it('skips unknown codes and returns an empty string for an empty list', () => {
    const pipe = create('de');
    expect(pipe.transform(['pdf', 'unknown'], 'assetFormats')).toEqual('PDF');
    expect(pipe.transform([], 'assetFormats')).toEqual('');
  });
});

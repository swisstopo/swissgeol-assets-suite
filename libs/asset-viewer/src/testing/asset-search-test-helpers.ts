import { Pipe, PipeTransform } from '@angular/core';

const REFERENCES: Record<string, Record<string, string>> = {
  assetKinds: { report: 'Bericht', map: 'Karte', log: 'Log' },
  assetFormats: { pdf: 'PDF', GISFormat: 'Shapefile', segy: 'SEG', las: 'LAS' },
};

// Mirrors the real pipe: a list of codes is localized and joined with commas.
@Pipe({ name: 'reference', standalone: true })
export class StubReferencePipe implements PipeTransform {
  transform(code: string | string[], key: string): string {
    if (Array.isArray(code)) {
      return code.map((it) => this.transform(it, key)).join(', ');
    }
    return REFERENCES[key]?.[code] ?? '';
  }
}

@Pipe({ name: 'assetSgDate', standalone: true })
export class StubDatePipe implements PipeTransform {
  transform(): string {
    return '';
  }
}

/**
 * Builds the reduced `@asset-sg/client-shared` module used by the asset search specs.
 * The real barrel pulls in OpenLayers (ESM), which Jest can't load.
 *
 * Must be called from within a `jest.mock` factory, as it relies on `jest.requireActual`.
 *
 * @param members Additional members of the module.
 * @param selectors Shared state selectors that should resolve to something other than `null`.
 */
export const createClientSharedMock = (
  members: Record<string, unknown> = {},
  selectors: Record<string, unknown> = {},
): Record<string, unknown> => {
  const store = jest.requireActual('@ngrx/store');
  return {
    appSharedStateActions: {
      setCurrentAsset: store.createAction('[Asset Search] Set Current Asset', store.props()),
      removeAsset: store.createAction('[Asset Shared] Remove Asset', store.props()),
      updateAsset: store.createAction('[Asset Shared] Update Asset', store.props()),
    },
    fromAppShared: new Proxy(selectors, { get: (target, key: string) => target[key] ?? (() => null) }),
    AssetExportService: class {},
    ...members,
  };
};

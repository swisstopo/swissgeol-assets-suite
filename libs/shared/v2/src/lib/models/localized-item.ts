import { LocalizedString } from './base/localized-string';

/**
 * DB:
 * - `asset_kind_item`
 * - `asset_format_item`
 */
export interface LocalizedItem {
  /**
   * DB: `{table-name}_code`
   */
  code: LocalizedItemCode;

  name: LocalizedString;

  description: LocalizedString;

  // TODO This field is always set to same same default value.
  //      We should consider removing it completely.
  /**
   * DB: `geol_code`
   */
  geolCode: 'No-GeolCode-specified';
}

export type LocalizedItemCode = string;

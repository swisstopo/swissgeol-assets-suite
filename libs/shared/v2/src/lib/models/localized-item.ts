import { LocalizedString } from './base/localized-string';

/**
 * DB:
 * - `asset_kind_item`
 * - `asset_format_item`
 */
export interface LocalizedItem<TCode extends LocalizedItemCode = LocalizedItemCode> {
  /**
   * DB: `{table-name}_code`
   */
  code: TCode;

  name: LocalizedString;

  description: LocalizedString;
}

export type LocalizedItemCode = string;

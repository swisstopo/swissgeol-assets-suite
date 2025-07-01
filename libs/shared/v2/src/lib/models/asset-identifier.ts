/**
 * DB: `id`
 */
export interface AssetIdentifier {
  /**
   * DB: `id_id`
   */
  id: AssetIdentifierId;

  /**
   * DB: `id`
   */
  value: string;

  /**
   * DB: `description`
   */
  description: string;
}

export type AssetIdentifierId = number;

export type AssetIdentifierData = Omit<AssetIdentifier, 'id'>;

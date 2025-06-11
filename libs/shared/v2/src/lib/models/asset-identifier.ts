/**
 * DB: `id`
 */
export interface AssetIdentifier {
  /**
   * DB: `id_id`
   */
  id: IdentifierId;

  /**
   * DB: `id`
   */
  value: string;

  /**
   * DB: `description`
   */
  description: string;
}

export type IdentifierId = number;

export type AssetIdentifierData = Omit<AssetIdentifier, 'id'>;

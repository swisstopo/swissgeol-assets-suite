import { FulltextContent } from '../models/fulltext-content';

export const transformJsonToFulltextContent = (value: unknown): FulltextContent[] => {
  if (value == null) {
    return [];
  }

  if (!Array.isArray(value)) {
    return [];
  }

  if (value.length === 0) {
    return [];
  }

  // Validate that all items have the expected structure
  const isValid = value.every(
    (item) =>
      item != null &&
      typeof item === 'object' &&
      'page' in item &&
      'content' in item &&
      typeof item.page === 'number' &&
      typeof item.content === 'string',
  );

  if (!isValid) {
    return [];
  }

  return value as FulltextContent[];
};

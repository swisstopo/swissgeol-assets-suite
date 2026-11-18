import { LegalDocCode } from './asset-file';
import { LocalizedItemCode } from './localized-item';

export const OTHER_ASSET_FORMAT_CODE: LocalizedItemCode = 'other';

export const ASSET_FORMAT_EXTENSIONS: ReadonlyArray<readonly [LocalizedItemCode, readonly string[]]> = [
  ['pdf', ['pdf']],
  ['GISFormat', ['shp', 'shx', 'dbf', 'prj', 'cpg', 'sbn', 'sbx', 'gpkg', 'qml', 'qmd', 'qix', 'tfw']],
  ['segy', ['segy', 'sgy']],
  ['las', ['las']],
  ['db', ['sqlite', 'db', 'sqlite3', 'accdb', 'mdb', 'sql', 'csv']],
  ['textDigital', ['doc', 'docx', 'txt', 'odt', 'rtf', 'md']],
  ['graphicRaster', ['jpg', 'jpeg', 'tif', 'tiff', 'png', 'webp', 'gif']],
  ['graphicVector', ['ai', 'svg', 'cdr', 'eps']],
  ['multimedia', ['mp4', 'mkv', 'mov', 'avi', 'webm']],
  ['archive', ['zip', 'rar', '7z']],
  ['spreadsheet', ['xls', 'xlsx']],
  ['presentation', ['pptx']],
  ['3D', ['off', '3dx', 'move', 'movz']],
];

const FORMAT_CODE_BY_EXTENSION = new Map<string, LocalizedItemCode>(
  ASSET_FORMAT_EXTENSIONS.flatMap(([code, extensions]) => extensions.map((extension) => [extension, code] as const)),
);

const CANONICAL_FORMAT_INDEX = new Map<LocalizedItemCode, number>(
  ASSET_FORMAT_EXTENSIONS.map(([code], index) => [code, index]),
);

/**
 * Determines the format of a file from the last extension of its name, compared case-insensitively.
 * Falls back to {@link OTHER_ASSET_FORMAT_CODE} for missing or unknown extensions.
 */
export const getFormatCodeForFileName = (name: string): LocalizedItemCode => {
  const lastDotIndex = name.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return OTHER_ASSET_FORMAT_CODE;
  }
  const extension = name.substring(lastDotIndex + 1).toLowerCase();
  return FORMAT_CODE_BY_EXTENSION.get(extension) ?? OTHER_ASSET_FORMAT_CODE;
};

/**
 * Compares format codes by the canonical format order:
 * mapped formats in mapping order, then all other codes by code, with {@link OTHER_ASSET_FORMAT_CODE} last.
 */
export const compareAssetFormatCodes = (a: LocalizedItemCode, b: LocalizedItemCode): number => {
  const rank = (code: LocalizedItemCode): number =>
    CANONICAL_FORMAT_INDEX.get(code) ??
    (code === OTHER_ASSET_FORMAT_CODE ? CANONICAL_FORMAT_INDEX.size + 1 : CANONICAL_FORMAT_INDEX.size);
  const rankDifference = rank(a) - rank(b);
  if (rankDifference !== 0) {
    return rankDifference;
  }
  if (a < b) {
    return -1;
  } else if (a > b) {
    return 1;
  }
  return 0;
};

export interface AssetFormatSource {
  formatCode: LocalizedItemCode;
  legalDocCode: LegalDocCode | null;
}

/**
 * Derives an asset's formats: the distinct formats of its non-legal files, in canonical format order.
 */
export const getAssetFormatCodes = (files: readonly AssetFormatSource[]): LocalizedItemCode[] => {
  const codes = new Set<LocalizedItemCode>();
  for (const file of files) {
    if (file.legalDocCode === null) {
      codes.add(file.formatCode);
    }
  }
  return [...codes].sort(compareAssetFormatCodes);
};

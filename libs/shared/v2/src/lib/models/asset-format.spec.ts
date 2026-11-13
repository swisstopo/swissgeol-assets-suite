import { LegalDocCode } from './asset-file';
import {
  ASSET_FORMAT_EXTENSIONS,
  compareAssetFormatCodes,
  getAssetFormatCodes,
  getFormatCodeForFileName,
} from './asset-format';

describe('getFormatCodeForFileName', () => {
  it.each([
    ['pdf', 'pdf'],
    ['shp', 'GISFormat'],
    ['shx', 'GISFormat'],
    ['dbf', 'GISFormat'],
    ['prj', 'GISFormat'],
    ['cpg', 'GISFormat'],
    ['sbn', 'GISFormat'],
    ['sbx', 'GISFormat'],
    ['gpkg', 'GISFormat'],
    ['qml', 'GISFormat'],
    ['qmd', 'GISFormat'],
    ['qix', 'GISFormat'],
    ['tfw', 'GISFormat'],
    ['segy', 'segy'],
    ['sgy', 'segy'],
    ['las', 'las'],
    ['sqlite', 'db'],
    ['db', 'db'],
    ['sqlite3', 'db'],
    ['accdb', 'db'],
    ['mdb', 'db'],
    ['sql', 'db'],
    ['csv', 'db'],
    ['doc', 'textDigital'],
    ['docx', 'textDigital'],
    ['txt', 'textDigital'],
    ['odt', 'textDigital'],
    ['rtf', 'textDigital'],
    ['md', 'textDigital'],
    ['jpg', 'graphicRaster'],
    ['jpeg', 'graphicRaster'],
    ['tif', 'graphicRaster'],
    ['tiff', 'graphicRaster'],
    ['png', 'graphicRaster'],
    ['webp', 'graphicRaster'],
    ['gif', 'graphicRaster'],
    ['ai', 'graphicVector'],
    ['svg', 'graphicVector'],
    ['cdr', 'graphicVector'],
    ['eps', 'graphicVector'],
    ['mp4', 'multimedia'],
    ['mkv', 'multimedia'],
    ['mov', 'multimedia'],
    ['avi', 'multimedia'],
    ['webm', 'multimedia'],
    ['zip', 'archive'],
    ['rar', 'archive'],
    ['7z', 'archive'],
    ['xls', 'spreadsheet'],
    ['xlsx', 'spreadsheet'],
    ['pptx', 'presentation'],
    ['off', '3D'],
    ['3dx', '3D'],
    ['move', '3D'],
    ['movz', '3D'],
  ])('maps .%s to %s', (extension, formatCode) => {
    expect(getFormatCodeForFileName(`report.${extension}`)).toBe(formatCode);
  });

  it('compares extensions case-insensitively', () => {
    expect(getFormatCodeForFileName('REPORT.PDF')).toBe('pdf');
    expect(getFormatCodeForFileName('layer.Shp')).toBe('GISFormat');
  });

  it('uses only the last extension', () => {
    expect(getFormatCodeForFileName('archive.pdf.zip')).toBe('archive');
    expect(getFormatCodeForFileName('archive.tar.gz')).toBe('other');
    expect(getFormatCodeForFileName('data.backup.csv')).toBe('db');
  });

  it.each(['README', 'report.', 'metadata.xml', 'METADATA.XML', 'slides.ppt', 'model.3ds', ''])(
    'assigns other to "%s"',
    (name) => {
      expect(getFormatCodeForFileName(name)).toBe('other');
    },
  );
});

describe('compareAssetFormatCodes', () => {
  it('orders mapped formats by mapping order, then other codes by code, with other last', () => {
    const codes = [
      'other',
      'unknown',
      'presentation',
      'multimedia',
      '3D',
      'pdf',
      'textAnalog',
      'GISFormat',
      'binary',
      'db',
    ];
    expect([...codes].sort(compareAssetFormatCodes)).toEqual([
      'pdf',
      'GISFormat',
      'db',
      'multimedia',
      'presentation',
      '3D',
      'binary',
      'textAnalog',
      'unknown',
      'other',
    ]);
  });

  it('keeps every mapped format in the order of the mapping', () => {
    const mappedCodes = ASSET_FORMAT_EXTENSIONS.map(([code]) => code);
    expect([...mappedCodes].reverse().sort(compareAssetFormatCodes)).toEqual(mappedCodes);
  });
});

describe('getAssetFormatCodes', () => {
  it('returns each format of the non-legal files once, in canonical order', () => {
    expect(
      getAssetFormatCodes([
        { formatCode: 'las', legalDocCode: null },
        { formatCode: 'pdf', legalDocCode: null },
        { formatCode: 'other', legalDocCode: null },
        { formatCode: 'pdf', legalDocCode: null },
        { formatCode: 'GISFormat', legalDocCode: null },
        { formatCode: 'segy', legalDocCode: null },
      ]),
    ).toEqual(['pdf', 'GISFormat', 'segy', 'las', 'other']);
  });

  it('ignores the formats of legal files', () => {
    expect(
      getAssetFormatCodes([
        { formatCode: 'db', legalDocCode: null },
        { formatCode: 'pdf', legalDocCode: LegalDocCode.Contract },
      ]),
    ).toEqual(['db']);
  });

  it('returns an empty list without non-legal files', () => {
    expect(getAssetFormatCodes([])).toEqual([]);
    expect(getAssetFormatCodes([{ formatCode: 'pdf', legalDocCode: LegalDocCode.FederalData }])).toEqual([]);
  });
});

import { AssetId, MAX_EXPORT_ASSETS } from '@asset-sg/shared/v2';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { clearPrismaAssets, setupDB } from '../../../../../../test/setup-db';
import { PrismaService } from '@/core/prisma.service';
import { AssetExportMetadataService } from '@/features/assets/export/asset-export-metadata.service';
import { CSV_COLUMN_HEADERS, CSV_COLUMN_KEYS, CSV_PUBLIC_COLUMNS } from '@/features/assets/export/asset-export.i18n';
import { AssetExportService } from '@/features/assets/export/asset-export.service';
import { createExportRepos, ExportFixture, seedExportFixture } from '@/features/assets/export/asset-export.test-utils';

const createService = (prisma: PrismaService): AssetExportService => {
  const { assetRepo, contactRepo, workgroupRepo } = createExportRepos(prisma);
  return new AssetExportService(new AssetExportMetadataService(prisma, assetRepo, contactRepo, workgroupRepo));
};

describe(AssetExportService, () => {
  const prisma = new PrismaService();
  const service = createService(prisma);
  let fixture: ExportFixture;

  const header = CSV_COLUMN_KEYS.map((key) => CSV_COLUMN_HEADERS[key].de).join(';');
  const fullRow = (): string =>
    [
      '"Alpha; ""quoted"""',
      'Draft',
      'gesperrt bis',
      '2030-01-15',
      'Bohrungen',
      '2D-Seismik,Bericht',
      'englisch',
      '3D-spezifisches Format',
      'Original A',
      '2020-03-04',
      '2020-05-06',
      'Ja',
      'Test nationales Interesse',
      'Auftraggeber,Autor,Einlieferer',
      'Bundesbehörde,Privatfirma oder Privatperson,Andere',
      'Initiator AG,Author GmbH,Supplier SA',
      `${fixture.full.id}`,
      '4711',
      'ID-1,ID-2',
      'Desc 1,Desc 2',
      `export-test-${fixture.full.id}.pdf`,
      'Default',
    ].join(';');
  const minimalRow = (): string =>
    [
      'Beta',
      'Draft',
      'frei',
      '',
      '',
      'Bericht',
      '',
      'PDF',
      '',
      '2021-01-02',
      '',
      'Nein',
      '',
      '',
      '',
      '',
      `${fixture.minimal.id}`,
      '',
      '',
      '',
      '',
      'Default',
    ].join(';');

  beforeAll(async () => {
    await setupDB(prisma);
  });

  beforeEach(async () => {
    await clearPrismaAssets(prisma);
    fixture = await seedExportFixture(prisma);
  });

  afterEach(() => {
    delete process.env.ANONYMOUS_MODE;
  });

  describe('exportAssetsAsCsv', () => {
    it('exports all metadata columns in request order', async () => {
      const csv = await service.exportAssetsAsCsv([fixture.minimal.id, fixture.full.id], fixture.user, 'de');
      expect(csv).toEqual([header, minimalRow(), fullRow()].join('\n'));
    });

    it('omits unauthorized, unknown and duplicate assets', async () => {
      const csv = await service.exportAssetsAsCsv(
        [fixture.full.id, fixture.foreign.id, 999_999, fixture.full.id],
        fixture.user,
        'de',
      );
      expect(csv).toEqual([header, fullRow()].join('\n'));
    });

    it('exports only the header for an empty selection', async () => {
      const csv = await service.exportAssetsAsCsv([], fixture.user, 'de');
      expect(csv).toEqual(header);
    });

    it(`only considers the first ${MAX_EXPORT_ASSETS} unique ids`, async () => {
      const unknownIds: AssetId[] = Array.from({ length: MAX_EXPORT_ASSETS }, (_, i) => 900_000 + i);
      const csv = await service.exportAssetsAsCsv(
        [fixture.minimal.id, ...unknownIds, fixture.full.id],
        fixture.user,
        'de',
      );
      expect(csv).toEqual([header, minimalRow()].join('\n'));
    });

    it('omits non-public columns in anonymous mode', async () => {
      process.env.ANONYMOUS_MODE = 'true';
      const csv = await service.exportAssetsAsCsv([fixture.full.id], fixture.user, 'de');

      const publicIndices = CSV_COLUMN_KEYS.map((key, i) => (CSV_PUBLIC_COLUMNS[key] ? i : -1)).filter((i) => i >= 0);
      const [expectedHeader, expectedRow] = [header, fullRow()].map((line) =>
        splitCsvLine(line)
          .filter((_, i) => publicIndices.includes(i))
          .join(';'),
      );
      expect(csv).toEqual([expectedHeader, expectedRow].join('\n'));
      expect(csv).not.toContain('Original A');
      expect(csv).not.toContain('4711');
      expect(csv).not.toContain('ID-1');
    });

    it('localizes headers and labels', async () => {
      const csv = await service.exportAssetsAsCsv([fixture.full.id], fixture.user, 'fr');
      const [headerLine, row] = csv.split('\n');
      expect(headerLine).toEqual(CSV_COLUMN_KEYS.map((key) => CSV_COLUMN_HEADERS[key].fr).join(';'));
      expect(row).toContain(";bloqué jusqu'au;");
      expect(row).toContain(';Forages;');
      expect(row).toContain(';anglais;');
      expect(row).toContain(';Oui;');
      expect(row).toContain(';Test intérêt national;');
    });
  });
});

const splitCsvLine = (line: string): string[] => {
  const cells: string[] = [];
  let current = '';
  let isQuoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      isQuoted = !isQuoted;
      current += char;
    } else if (char === ';' && !isQuoted) {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
};

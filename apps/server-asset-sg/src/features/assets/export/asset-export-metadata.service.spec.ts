import { LocalDate } from '@asset-sg/shared/v2';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { clearPrismaAssets, setupDB } from '../../../../../../test/setup-db';
import { PrismaService } from '@/core/prisma.service';
import { AssetExportDataset, ExportValue, ExportValueType } from '@/features/assets/export/asset-export-metadata';
import { AssetExportMetadataService } from '@/features/assets/export/asset-export-metadata.service';
import { CSV_COLUMN_KEYS, CSV_PUBLIC_COLUMNS } from '@/features/assets/export/asset-export.i18n';
import { createExportRepos, ExportFixture, seedExportFixture } from '@/features/assets/export/asset-export.test-utils';

describe(AssetExportMetadataService, () => {
  const prisma = new PrismaService();
  const { assetRepo, contactRepo, workgroupRepo } = createExportRepos(prisma);
  const service = new AssetExportMetadataService(prisma, assetRepo, contactRepo, workgroupRepo);
  let fixture: ExportFixture;

  const valuesByName = (dataset: AssetExportDataset, index: number): Record<string, ExportValue> =>
    Object.fromEntries(dataset.columns.map((column, i) => [column.name, dataset.records[index].values[i]]));

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

  it('resolves typed values for all columns', async () => {
    const dataset = await service.load([fixture.full.id, fixture.minimal.id], fixture.user, 'de');

    expect(dataset.language).toEqual('de');
    expect(dataset.columns.map((column) => column.key)).toEqual(CSV_COLUMN_KEYS);
    expect(dataset.records.map((record) => record.asset.id)).toEqual([fixture.full.id, fixture.minimal.id]);

    expect(valuesByName(dataset, 0)).toEqual({
      title: 'Alpha; "quoted"',
      status: 'Draft',
      restriction_type: 'gesperrt bis',
      restriction_date: LocalDate.of(2030, 1, 15),
      topic: ['Bohrungen'],
      kind: '2D-Seismik',
      language: ['englisch'],
      format: '3D-spezifisches Format',
      original_title: 'Original A',
      created_at: LocalDate.of(2020, 3, 4),
      received_at: LocalDate.of(2020, 5, 6),
      national_interest: true,
      national_interest_type: ['Test nationales Interesse'],
      contact_role: ['Auftraggeber', 'Autor', 'Einlieferer'],
      contact_kind: ['Bundesbehörde', 'Privatfirma oder Privatperson', 'Andere'],
      contact_name: ['Initiator AG', 'Author GmbH', 'Supplier SA'],
      asset_id: fixture.full.id,
      sgs_id: 4711,
      alternative_ids: ['ID-1', 'ID-2'],
      alternative_id_descriptions: ['Desc 1', 'Desc 2'],
      documents: [`export-test-${fixture.full.id}.pdf`],
      workgroup: 'Default',
    });

    expect(valuesByName(dataset, 1)).toEqual({
      title: 'Beta',
      status: 'Draft',
      restriction_type: 'frei',
      restriction_date: null,
      topic: [],
      kind: 'Bericht',
      language: [],
      format: 'PDF',
      original_title: null,
      created_at: LocalDate.of(2021, 1, 2),
      received_at: null,
      national_interest: false,
      national_interest_type: [],
      contact_role: [],
      contact_kind: [],
      contact_name: [],
      asset_id: fixture.minimal.id,
      sgs_id: null,
      alternative_ids: [],
      alternative_id_descriptions: [],
      documents: [],
      workgroup: 'Default',
    });
  });

  it('returns values matching the declared column types', async () => {
    const dataset = await service.load([fixture.full.id, fixture.minimal.id], fixture.user, 'de');
    for (const record of dataset.records) {
      dataset.columns.forEach((column, i) => {
        const value = record.values[i];
        switch (column.type) {
          case ExportValueType.Text:
            expect(value === null || typeof value === 'string').toBe(true);
            break;
          case ExportValueType.TextList:
            expect(Array.isArray(value)).toBe(true);
            break;
          case ExportValueType.Integer:
            expect(value === null || Number.isInteger(value)).toBe(true);
            break;
          case ExportValueType.Date:
            expect(value === null || value instanceof LocalDate).toBe(true);
            break;
          case ExportValueType.Boolean:
            expect(typeof value).toEqual('boolean');
            break;
        }
      });
    }
  });

  it('uses unique snake_case column names', async () => {
    const dataset = await service.load([], fixture.user, 'de');
    const names = dataset.columns.map((column) => column.name);
    expect(new Set(names).size).toEqual(names.length);
    names.forEach((name) => expect(name).toMatch(/^[a-z][a-z0-9_]*$/));
  });

  it('omits unauthorized assets', async () => {
    const dataset = await service.load([fixture.foreign.id, fixture.minimal.id], fixture.user, 'de');
    expect(dataset.records.map((record) => record.asset.id)).toEqual([fixture.minimal.id]);
  });

  it('omits non-public columns in anonymous mode', async () => {
    process.env.ANONYMOUS_MODE = 'true';
    const dataset = await service.load([fixture.full.id], fixture.user, 'de');
    expect(dataset.columns.map((column) => column.key)).toEqual(
      CSV_COLUMN_KEYS.filter((key) => CSV_PUBLIC_COLUMNS[key]),
    );
    expect(dataset.records[0].values).toHaveLength(dataset.columns.length);
  });
});

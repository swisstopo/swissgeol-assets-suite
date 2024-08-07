import { PrismaClient } from '@prisma/client';
import { assetFormatItems } from './data/asset-format-item';
import { assetKindItems } from './data/asset-kind-item';
import { contactKindItems } from './data/contact-kind-item';
import { languageItems } from './data/language-items';
import { manCatLabelItems } from './data/man-cat-label-item';
import { statusAssetUseItems } from './data/status-asset-use-item';
import { statusWorkItems } from './data/status-work-item';

const clearDB = async (prisma: PrismaClient, dbName: string): Promise<void> => {
  const tables = await prisma.$queryRawUnsafe(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = '${dbName}'
      AND table_type = 'BASE TABLE'
    `);

  // Iterate over each table and delete all data
  for (const table of tables as Array<{ table_name: string }>) {
    const tableName = table.table_name;
    if (tableName === 'schema_migrations') {
      continue;
    }
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${dbName}.${tableName} CASCADE`);
  }
};

export const setupDB = async (prisma: PrismaClient): Promise<void> => {
  await clearDB(prisma, 'public');

  await prisma.statusAssetUseItem.createMany({ data: statusAssetUseItems, skipDuplicates: true });
  await prisma.assetKindItem.createMany({ data: assetKindItems, skipDuplicates: true });
  await prisma.assetFormatItem.createMany({ data: assetFormatItems, skipDuplicates: true });
  await prisma.languageItem.createMany({ data: languageItems, skipDuplicates: true });
  await prisma.statusWorkItem.createMany({ data: statusWorkItems, skipDuplicates: true });
  await prisma.manCatLabelItem.createMany({ data: manCatLabelItems, skipDuplicates: true });
  await prisma.contactKindItem.createMany({ data: contactKindItems, skipDuplicates: true });
  await setupDefaultWorkgroup(prisma);
};

export const clearPrismaAssets = async (prisma: PrismaClient): Promise<void> => {
  await prisma.manCatLabelRef.deleteMany();
  await prisma.assetContact.deleteMany();
  await prisma.assetLanguage.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.id.deleteMany();
  await prisma.typeNatRel.deleteMany();
  await prisma.statusWork.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.internalUse.deleteMany();
  await prisma.publicUse.deleteMany();
  await prisma.workgroupsOnUsers.deleteMany();
  await prisma.workgroup.deleteMany({ where: { id: { not: 1 } } });
};

export const setupDefaultWorkgroup = async (prisma: PrismaClient): Promise<void> => {
  await prisma.workgroup.create({
    data: {
      id: 1,
      created_at: new Date(),
      disabled_at: new Date(),
      name: 'Default',
    },
  });
};

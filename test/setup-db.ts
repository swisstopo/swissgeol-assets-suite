import { PrismaClient } from '@prisma/client';
import { assetKindItems } from './data/asset-kind-item';
import { statusAssetUseItems } from './data/status-asset-use-item';
import { assetFormatItems } from './data/asset-format-item';
import { languageItems } from './data/language-items';
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
}

export const setupDB = async (prisma: PrismaClient): Promise<void> => {
    await clearDB(prisma, 'auth');
    await clearDB(prisma, 'public');

    await prisma.statusAssetUseItem.createMany({ data: statusAssetUseItems });
    await prisma.assetKindItem.createMany({ data: assetKindItems });
    await prisma.assetFormatItem.createMany({ data: assetFormatItems })
    await prisma.languageItem.createMany({ data: languageItems });
    await prisma.statusWorkItem.createMany({ data: statusWorkItems });
};

export const clearPrismaAssets = async (prisma: PrismaClient): Promise<void> => {
    await prisma.manCatLabelRef.deleteMany();
    await prisma.assetContact.deleteMany();
    await prisma.id.deleteMany();
    await prisma.typeNatRel.deleteMany();
    await prisma.statusWork.deleteMany();
    await prisma.asset.deleteMany();
    await prisma.internalUse.deleteMany();
    await prisma.publicUse.deleteMany();
}

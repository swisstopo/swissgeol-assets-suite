// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as cp from 'child_process';
import * as fs from 'node:fs';
import * as readline from 'node:readline';
import { promisify } from 'util';

import { unknownToError } from '@asset-sg/core';
import { Asset, PrismaClient } from '@prisma/client';
import { parse as parseCsv } from 'csv-parse/sync';
import { parseISO } from 'date-fns';
import * as A from 'fp-ts/Array';
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as TE from 'fp-ts/TaskEither';

import { queryFiles } from './seed-files';

const exec = promisify(cp.exec);

const prisma = new PrismaClient();

export const importAssets = async () => {
  await prisma.$executeRawUnsafe(`truncate table public.asset_format_item cascade;`);
  await prisma.$executeRawUnsafe(`truncate table public.asset_kind_item cascade;`);
  await prisma.$executeRawUnsafe(`truncate table public.auto_object_cat_item cascade;`);
  await prisma.$executeRawUnsafe(`truncate table public.auto_cat_label_item cascade;`);
  await prisma.$executeRawUnsafe(`truncate table public.contact_kind_item cascade;`);
  await prisma.$executeRawUnsafe(`truncate table public.geom_quality_item cascade;`);
  await prisma.$executeRawUnsafe(`truncate table public.language_item cascade;`);
  await prisma.$executeRawUnsafe(`truncate table public.legal_doc_item cascade;`);
  await prisma.$executeRawUnsafe(`truncate table public.status_asset_use_item cascade;`);
  await prisma.$executeRawUnsafe(`truncate table public.man_cat_label_item cascade;`);
  await prisma.$executeRawUnsafe(`truncate table public.man_cat_label_ref cascade;`);
  await prisma.$executeRawUnsafe(`truncate table public.nat_rel_item cascade;`);
  await prisma.$executeRawUnsafe(`truncate table public.pub_channel_item cascade;`);
  await prisma.$executeRawUnsafe(`truncate table public.status_work_item cascade;`);
  await prisma.$executeRawUnsafe(`truncate table public.asset_x_asset_y cascade;`);
  await prisma.$executeRawUnsafe(`truncate table public.asset cascade;`);
  await prisma.$executeRawUnsafe(`truncate table public.study_area cascade;`);
  await prisma.$executeRawUnsafe(`truncate table public.study_location cascade;`);
  await prisma.$executeRawUnsafe(`truncate table public.study_trace cascade;`);
  await prisma.$executeRawUnsafe(`truncate table public.file cascade;`);
  await prisma.$executeRawUnsafe(`truncate table public.asset_file cascade;`);
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS public.tmp_geom_quality_mapping;`);
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS public.tmp_study_area;`);
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS public.tmp_study_location;`);
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS public.tmp_study_trace;`);

  await updateSequences(false);

  await prisma.$executeRawUnsafe(`
        create table if not exists public.tmp_geom_quality_mapping
        (
            id integer not null,
            code text collate pg_catalog."default" not null,
            constraint tmp_geom_quality_mapping_pkey primary key (id)
        );
    `);
  // await prisma.$executeRawUnsafe(`alter table tmp_geom_quality_mapping owner to swissgeol_asset;`);
  //

  const assetFormItems = await importValueList('AssetFormatItem', 'assetformatitem', 'assetFormatItemCode');
  const assetKindItems = await importValueList('AssetKindItem', 'assetkinditem', 'assetKindItemCode');
  const autoCatLabelItems = await importValueList('AutoCatLabelItem', 'autocatlabelitem', 'autoCatLabelItemCode');
  const autoObjectCatItems = await importValueList('AutoObjectCatItem', 'autoobjectcatitem', 'autoObjectCatItemCode');
  const contactKindItems = await importValueList('ContactKindItem', 'contactkinditem', 'contactKindItemCode');

  const geomQualityItems = await importValueList('GeomQualityItem', 'geomqualityitem', 'geomQualityItemCode');
  for await (const item of geomQualityItems) {
    await prisma.$executeRawUnsafe(
      `insert into public.tmp_geom_quality_mapping (id, code) values (${item.id}, '${item.code}')`,
    );
  }

  const manCatLabelItems = await importValueList('ManCatLabelItem', 'mancatlabelitem', 'manCatLabelItemCode');
  const natRelItems = await importValueList('NatRelItem', 'natrelitem', 'natRelItemCode');
  const languageItems = await importValueList('LanguageItem', 'languageitem', 'languageItemCode');
  const legalDocItems = await importValueList('LegalDocItem', 'legaldocitem', 'legalDocItemCode');
  const pubChannelItems = await importValueList('PubChannelItem', 'pubchannelitem', 'pubChannelItemCode');
  const statusAssetUseItems = await importValueList(
    'StatusAssetUseItem',
    'statusassetuseitem',
    'statusAssetUseItemCode',
  );
  const statusWorkItems = await importValueList('StatusWorkItem', 'statusworkitem', 'statusWorkItemCode');

  const lookupCode = (items: (ValueList & { id: number; code: string })[], id: number): string => {
    const item = items.find((i) => i.id === id);
    if (!item) {
      throw new Error(`Item with id ${id} not found`);
    }
    return item.code;
  };

  await importToTable('InternalUse', buildPath('internaluse'), (parsed) => ({
    internalUseId: Number(parsed[0]),
    isAvailable: toBoolean(parsed[2]),
    statusAssetUseItemCode: lookupCode(statusAssetUseItems, Number(parsed[3])),
    startAvailabilityDate: createDate(parsed[4]),
  }));

  await importToTable('PublicUse', buildPath('publicuse'), (parsed) => ({
    publicUseId: Number(parsed[0]),
    isAvailable: toBoolean(parsed[2]),
    statusAssetUseItemCode: lookupCode(statusAssetUseItems, Number(parsed[3])),
    startAvailabilityDate: createDate(parsed[4]),
  }));

  const internalUse = await readFromFileToModel(buildPath('internaluse'), (parsed) => ({
    internalUseId: Number(parsed[0]),
    assetId: Number(parsed[1]),
    isAvailable: toBoolean(parsed[2]),
    statusAssetUseItemCode: lookupCode(statusAssetUseItems, Number(parsed[3])),
    startAvailabilityDate: createDate(parsed[4]),
  }));

  const publicUse = await readFromFileToModel(buildPath('publicuse'), (parsed) => ({
    publicUseId: Number(parsed[0]),
    assetId: Number(parsed[1]),
    isAvailable: toBoolean(parsed[2]),
    statusAssetUseItemCode: lookupCode(statusAssetUseItems, Number(parsed[3])),
    startAvailabilityDate: createDate(parsed[4]),
  }));

  const createAssetModelFromParsedCsv = (parsed: string[]): Asset => ({
    assetId: Number(parsed[0]),
    titlePublic: parsed[1],
    titleOriginal: parsed[2],
    isNatRel: toBoolean(parsed[3]),
    receiptDate: createDate(parsed[4]),
    municipality: parsed[5] || null,
    url: parsed[6] || null,
    locationAnalog: parsed[8],
    processor: parsed[9] || null,
    lastProcessedDate: createDate(parsed[10]),
    textBody: parsed[11] || null,
    sgsId: Number(parsed[12]),
    geolDataInfo: parsed[13],
    geolContactDataInfo: parsed[14],
    geolAuxDataInfo: parsed[15],
    remark: parsed[16] || null,
    assetKindItemCode: lookupCode(assetKindItems, Number(parsed[17])),
    createDate: createDate(parsed[18]),
    languageItemCode: lookupCode(languageItems, Number(parsed[19])),
    assetFormatItemCode: lookupCode(assetFormItems, Number(parsed[20])),
    authorBiblio: parsed[21] || null,
    sourceProject: parsed[22] || null,
    description: parsed[23] || null,
    isExtract: toBoolean(parsed[24]),
    internalUseId: internalUse!.models.find((i) => i.assetId === Number(parsed[0]))?.internalUseId || -1,
    publicUseId: publicUse!.models.find((i) => i.assetId === Number(parsed[0]))?.publicUseId || -1,
    assetMainId: Number(parsed[25]) || null,
  });

  const assets = (await readFromFileToModel(buildPath('asset'), createAssetModelFromParsedCsv))?.models || [];

  await importToTable('Asset', buildPath('asset'), createAssetModelFromParsedCsv);

  await importToTable('Id', buildPath('id'), (parsed) => ({
    idId: Number(parsed[0]),
    assetId: Number(parsed[1]),
    id: parsed[2],
    description: parsed[3],
  }));

  const insertFilesResult = await pipe(
    queryFiles,
    TE.bindTo('result'),
    TE.bindW('writeFiles', ({ result }) => {
      // console.log('result', JSON.stringify(result, null, 2));
      return TE.tryCatch(
        () =>
          prisma.file.createMany({
            data: pipe(
              result.files,
              A.map((f) => ({
                fileName: f.name.replace('asset_files/', ''),
                fileSize: f.size,
                lastModified: f.lastModified,
              })),
            ),
          }),
        unknownToError,
      );
    }),
    TE.bindW('readFiles', () => TE.tryCatch(() => prisma.file.findMany(), unknownToError)),
    TE.map(({ readFiles, result }) =>
      pipe(
        result.matches,
        A.map((m) =>
          pipe(
            assets,
            A.findFirst((asset) => asset.sgsId === m.sgsId),
            O.map((asset) => ({ assetId: asset.assetId, filenames: m.filenames })),
          ),
        ),
        A.compact,
        A.map((m) =>
          pipe(
            m.filenames,
            A.map((f) =>
              pipe(
                readFiles,
                A.findFirst((rf) => rf.name === f),
                O.map((a) => ({ assetId: m.assetId, fileId: a.fileId })),
              ),
            ),
          ),
        ),
        A.flatten,
        A.compact,
      ),
    ),
    TE.chainW((files) => TE.tryCatch(() => prisma.assetFile.createMany({ data: files }), unknownToError)),
  )();
  if (E.isLeft(insertFilesResult)) {
    throw insertFilesResult.left;
  }
  console.log(`✅ Imported ${insertFilesResult.right.count} rows to table AssetFile`);

  await importToTable('ManCatLabelRef', buildPath('mancatlabel'), (parsed) => ({
    manCatLabelItemCode: lookupCode(manCatLabelItems, Number(parsed[0])),
    assetId: Number(parsed[1]),
  }));

  await importToTable('AssetKindComposition', buildPath('assetkindcomposition'), (parsed) => ({
    assetKindItemCode: lookupCode(assetKindItems, Number(parsed[0])),
    assetId: Number(parsed[1]),
  }));

  await importToTable('StatusWork', buildPath('statuswork'), (parsed) => ({
    statusWorkId: Number(parsed[0]),
    statusWorkItemCode: lookupCode(statusWorkItems, Number(parsed[1])),
    statusWorkDate: createDate(parsed[2]),
    assetId: Number(parsed[3]),
  }));

  await importToTable('AutoCat', buildPath('autocat'), (parsed) => ({
    autoCatId: Number(parsed[0]),
    assetId: Number(parsed[1]),
    autoCatLabelItemCode: lookupCode(autoCatLabelItems, Number(parsed[2])),
    autoCatLabelScore: Number(parsed[3]),
  }));

  await importToTable('TypeNatRel', buildPath('typenatrel'), (parsed) => ({
    typeNatRelId: Number(parsed[0]),
    assetId: Number(parsed[1]),
    natRelItemCode: lookupCode(natRelItems, Number(parsed[2])),
  }));

  await importToTable('LegalDoc', buildPath('legaldoc'), (parsed) => ({
    legalDocId: Number(parsed[0]),
    assetId: Number(parsed[1]),
    legalDocItemCode: lookupCode(legalDocItems, Number(parsed[2])),
  }));

  await importToTable('AssetXAssetY', buildPath('assetX_assetY'), (parsed) => ({
    assetXId: Number(parsed[0]),
    assetYId: Number(parsed[1]),
  }));

  await importToTable('Contact', buildPath('contact'), (parsed) => ({
    contactId: Number(parsed[0]),
    contactKindItemCode: lookupCode(contactKindItems, Number(parsed[1])),
    name: parsed[2],
    street: parsed[3] || null,
    houseNumber: parsed[4] || null,
    plz: parsed[5] || null,
    locality: parsed[6] || null,
    country: parsed[7] || null,
    telephone: parsed[8] || null,
    email: parsed[9] || null,
    website: parsed[10] || null,
  }));

  await importToTable('AssetContact', buildPath('asset_contact'), (parsed) => ({
    assetId: Number(parsed[0]),
    contactId: Number(parsed[1]),
    role: parsed[2],
  }));

  await importToTable('Publication', buildPath('publication'), (parsed) => ({
    publicationId: Number(parsed[0]),
    pubChannelItemCode: lookupCode(pubChannelItems, Number(parsed[1])),
    datePublication: createDate(parsed[2]),
    description: parsed[3] || null,
    link: parsed[4] || null,
  }));

  await importToTable('AssetPublication', buildPath('asset_publication'), (parsed) => ({
    assetId: Number(parsed[0]),
    publicationId: Number(parsed[1]),
  }));

  await importToTable('InternalProject', buildPath('internalproject'), (parsed) => ({
    internalProjectId: Number(parsed[0]),
    name: parsed[1],
    description: parsed[2] || null,
    dateDelivered: createDate(parsed[3]),
  }));

  await importToTable('AssetInternalProject', buildPath('asset_internalproject'), (parsed) => ({
    assetId: Number(parsed[0]),
    internalProjectId: Number(parsed[1]),
  }));

  await exec('./import-shapes.sh');

  const shapeAreasRaw = (
    (await prisma.$queryRawUnsafe(`
        select a.study_area_id, a.asset_id, m.code as geom_quality_item_code, st_astext(a.wkb_geometry) as geom
        from tmp_study_area a
        inner join tmp_geom_quality_mapping m
        on a.geom_quality_item_id = m.id
    `)) as any[]
  )
    .map(
      (a) =>
        `(${a.study_area_id}, ${a.asset_id}, '${a.geom_quality_item_code}', st_geomfromtext('${a.geom.replace(
          /(\d+\.\d+)/g,
          (a) => Math.round(a * 1000) / 1000,
        )}', 2056))`,
    )
    .join(',\n');

  await prisma.$queryRawUnsafe(
    `insert into study_area (study_area_id, asset_id, geom_quality_item_code, geom) values ${shapeAreasRaw}`,
  );
  console.log(`✅ Successfully imported area shape file (${shapeAreasRaw.length} rows)`);

  const shapeLocationsRaw = (
    (await prisma.$queryRawUnsafe(`
        select a.study_location_id, a.asset_id, m.code as geom_quality_item_code, st_astext(a.wkb_geometry) as geom
        from tmp_study_location a
        inner join tmp_geom_quality_mapping m
        on a.geom_quality_item_id = m.id
    `)) as any[]
  )
    .map(
      (a) =>
        `(${a.study_location_id}, ${a.asset_id}, '${a.geom_quality_item_code}', st_geomfromtext('${a.geom.replace(
          /(\d+\.\d+)/g,
          (a) => Math.round(a * 1000) / 1000,
        )}', 2056))`,
    )
    .join(',\n');

  await prisma.$queryRawUnsafe(
    `insert into study_location (study_location_id, asset_id, geom_quality_item_code, geom) values ${shapeLocationsRaw}`,
  );
  console.log(`✅ Successfully imported location shape file (${shapeLocationsRaw.length} rows)`);

  const shapeTracesRaw = (
    (await prisma.$queryRawUnsafe(`
        select a.study_trace_id, a.asset_id, m.code as geom_quality_item_code, st_astext(a.wkb_geometry) as geom
        from tmp_study_trace a
        inner join tmp_geom_quality_mapping m
        on a.geom_quality_item_id = m.id
    `)) as any[]
  )
    .map(
      (a) =>
        `(${a.study_trace_id}, ${a.asset_id}, '${a.geom_quality_item_code}', st_geomfromtext('${a.geom.replace(
          /(\d+\.\d+)/g,
          (a) => Math.round(a * 1000) / 1000,
        )}', 2056))`,
    )
    .join(',\n');

  await prisma.$queryRawUnsafe(
    `insert into study_trace (study_trace_id, asset_id, geom_quality_item_code, geom) values ${shapeTracesRaw}`,
  );
  console.log(`✅ Successfully imported trace shape file (${shapeTracesRaw.length} rows)`);

  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS public.tmp_geom_quality_mapping;`);
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS public.tmp_study_area;`);
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS public.tmp_study_location;`);
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS public.tmp_study_trace;`);

  await updateAllValueListData20230309();
  await updateAllValueListData20230405();

  await updateSequences(true);

  await prisma.$disconnect();
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  console.log(`\nThe script uses approximately ${Math.round(used * 100) / 100} MB memory.`);
};

type ValueList = {
  id: number;
  code: string;
  GeolCode: string | null;
  Name: string;
  NameDe: string;
  NameFr: string;
  NameIt: string;
  NameEn: string;
  Description: string;
  DescriptionDe: string;
  DescriptionFr: string;
  DescriptionIt: string;
  DescriptionEn: string;
};

const makeImportValueList =
  (path: string, doImportToTable: boolean) =>
  async <T extends string>(
    tableName: string,
    valueListFileName: string,
    codeName: T,
  ): Promise<(ValueList & { id: number })[]> => {
    const createModelFromParsedCsv = (withKey: boolean) => (parsed: string[]) => {
      const model = {
        [codeName]: parsed[1],
        geolCode: parsed[2] || null,
        name: parsed[3],
        nameDe: parsed[4],
        nameFr: parsed[5],
        nameIt: parsed[7],
        nameEn: parsed[8],
        description: parsed[9],
        descriptionDe: parsed[10],
        descriptionFr: parsed[11],
        descriptionIt: parsed[13],
        descriptionEn: parsed[14],
      };
      if (withKey) {
        (model as unknown as { id: number }).id = Number(parsed[0]);
        (model as unknown as { code: string }).code = parsed[1];
      }
      return model;
    };

    if (doImportToTable) {
      await importToTable(tableName, buildPath(`wertelisten/${valueListFileName}`), createModelFromParsedCsv(false));
    }

    return (
      (await readFromFileToModel(buildPath(`${path}/${valueListFileName}`), createModelFromParsedCsv(true))) as any
    ).models;
  };

const importToTable = async <T>(
  tableName: string,
  filePath: string,
  createModelFromParsedCsv: (parsed: string[]) => T,
) => {
  try {
    const { models, count } = (await readFromFileToModel(filePath, createModelFromParsedCsv))!;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any)[tableName].createMany({ data: models });

    console.log(`✅ Imported ${count} rows to table ${tableName}`);
  } catch (err) {
    console.error(err);
  }
};

const readFromFileToModel = async <T>(filePath: string, createModelFromParsedCsv: (parsed: string[]) => T) => {
  try {
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath, 'utf-8'),
      crlfDelay: Infinity,
    });

    let count = 0;
    let firstRow = true;

    const models: T[] = [];

    rl.on('line', async (line) => {
      if (firstRow) {
        firstRow = false;
        return;
      }
      const cleanLine = line.replace(/^\uFEFF/, '');
      const parsed = parseCsv(cleanLine, {
        delimiter: ';',
        escape: '"',
      })[0];
      const model = createModelFromParsedCsv(parsed);
      models.push(model);
      count++;
    });

    await new Promise((resolve) => rl.on('close', resolve));

    return { models, count };
  } catch (err) {
    console.error(err);
  }
};

const importValueList = makeImportValueList('wertelisten', true);
const importValueListUpdatedData20230309 = makeImportValueList('wertelisten_20230309', false);
const importValueListUpdatedData20230405 = makeImportValueList('wertelisten_20230405', false);

const updateAllValueListData20230309 = async () => {
  await updateValueListData(
    importValueListUpdatedData20230309,
    'AssetFormatItem',
    'assetformatitem',
    'assetFormatItemCode',
  );
  await updateValueListData(importValueListUpdatedData20230309, 'AssetKindItem', 'assetkinditem', 'assetKindItemCode');
  await updateValueListData(
    importValueListUpdatedData20230309,
    'AutoCatLabelItem',
    'autocatlabelitem',
    'autoCatLabelItemCode',
  );
  await updateValueListData(
    importValueListUpdatedData20230309,
    'AutoObjectCatItem',
    'autoobjectcatitem',
    'autoObjectCatItemCode',
  );
  await updateValueListData(
    importValueListUpdatedData20230309,
    'ContactKindItem',
    'contactkinditem',
    'contactKindItemCode',
  );
  await updateValueListData(
    importValueListUpdatedData20230309,
    'GeomQualityItem',
    'geomqualityitem',
    'geomQualityItemCode',
  );
  await updateValueListData(importValueListUpdatedData20230309, 'LanguageItem', 'languageitem', 'languageItemCode');
  await updateValueListData(importValueListUpdatedData20230309, 'LegalDocItem', 'legaldocitem', 'legalDocItemCode');
  await updateValueListData(
    importValueListUpdatedData20230309,
    'ManCatLabelItem',
    'mancatlabelitem',
    'manCatLabelItemCode',
    async () => {
      const { count } = await prisma.manCatLabelRef.updateMany({ data: { manCatLabelItemCode: 'other' } });
      console.log(`✅ Updated ${count} rows from 'unknown' to 'other' in table ManCatLabelRef`);
    },
  );
  await updateValueListData(importValueListUpdatedData20230309, 'NatRelItem', 'natrelitem', 'natRelItemCode');
  await updateValueListData(
    importValueListUpdatedData20230309,
    'PubChannelItem',
    'pubchannelitem',
    'pubChannelItemCode',
  );
  await updateValueListData(
    importValueListUpdatedData20230309,
    'StatusAssetUseItem',
    'statusassetuseitem',
    'statusAssetUseItemCode',
  );
  await updateValueListData(
    importValueListUpdatedData20230309,
    'StatusWorkItem',
    'statusworkitem',
    'statusWorkItemCode',
  );
};

const updateAllValueListData20230405 = async () => {
  await updateValueListData(
    importValueListUpdatedData20230405,
    'ContactKindItem',
    'contactkinditem',
    'contactKindItemCode',
  );
};

const updateValueListData = async <T extends string>(
  importFn: ReturnValue<typeof makeImportValueList>,
  tableName: string,
  valueListFileName: string,
  codeName: T,
  operationBeforeDelete?: () => any,
) => {
  const items = await importFn(tableName, valueListFileName, codeName);

  const fromDb = await (prisma as any)[tableName].findMany();

  const toDelete = fromDb.filter((item) => !items.find((i) => i.code === item[codeName]));
  const toInsert = items
    .filter((item) => !fromDb.find((i) => i[codeName] === item.code))
    .map(({ code, id, ...rest }: any) => rest);
  const toUpdate = items
    .filter((item) => fromDb.find((i) => i[codeName] === item.code))
    .map(({ code, id, ...rest }: any) => rest);

  if (toInsert.length) {
    const { count } = await prisma[tableName].createMany({ data: toInsert });
    console.log(`✅ Inserted ${count} new rows to table ${tableName}`);
  }

  if (toUpdate.length) {
    for await (const item of toUpdate) {
      await prisma[tableName].update({
        where: { [codeName]: item[codeName] },
        data: item,
      });
    }
    console.log(`✅ Updated ${toUpdate.length} rows in table ${tableName}`);
  }

  if (operationBeforeDelete) {
    await operationBeforeDelete();
  }

  if (toDelete.length) {
    const { count } = await (prisma as any)[tableName].deleteMany({
      where: { [codeName]: { in: toDelete.map((item) => item[codeName]) } },
    });

    console.log(`✅ Deleted ${count} rows from table ${tableName}`);
  }
};

const updateSequences = async (toMax: boolean) => {
  const sequences = [
    ['asset', 'asset_id'],
    ['asset_format_composition', 'asset_format_composition_id'],
    ['asset_kind_composition', 'asset_kind_composition_id'],
    ['asset_object_info', 'asset_object_info_id'],
    ['auto_cat', 'auto_cat_id'],
    ['contact', 'contact_id'],
    ['file', 'file_id'],
    ['id', 'id_id'],
    ['internal_use', 'internal_use_id'],
    ['internal_project', 'internal_project_id'],
    ['legal_doc', 'legal_doc_id'],
    ['public_use', 'public_use_id'],
    ['publication', 'publication_id'],
    ['status_work', 'status_work_id'],
    ['study_area', 'study_area_id'],
    ['study_location', 'study_location_id'],
    ['study_trace', 'study_trace_id'],
    ['type_nat_rel', 'type_nat_rel_id'],
  ];

  await sequences.forEach(async (seq) => {
    const result = await prisma.$queryRawUnsafe(
      `select setval(pg_get_serial_sequence('${seq[0]}', '${seq[1]}'), ${
        toMax ? `(select max(${seq[1]}) + 1 from ${seq[0]})` : 1
      });`,
    );
    if (toMax) {
      console.log(`✅ Set ${seq[0]}_${seq[1]} to ${result[0]['setval']}`);
    }
  });
};

const createDate = (s: string) => parseISO(s + 'T00:00:00.000Z');

const toBoolean = (s: string) => {
  if (s === 'True') return true;
  if (s === 'False') return false;
  throw new Error(`Cannot convert ${s} to boolean`);
};

const buildPath = (filename: string) => `./swisstopo-lambda_prodDaten_asset_swissgeol/db/${filename}.csv`;

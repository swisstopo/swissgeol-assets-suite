import {
  Asset,
  AssetContactRole,
  ContactKindCode,
  CreateGeometryData,
  GeometryMutationType,
  GeometryType,
  LanguageCode,
  LocalDate,
  Role,
  User,
  WorkgroupId,
} from '@asset-sg/shared/v2';
import { PrismaService } from '@/core/prisma.service';
import { fakeContact, fakeCreateAssetData, fakeUserData } from '@/features/assets/asset.fake';
import { AssetRepo } from '@/features/assets/asset.repo';
import { FileRepo } from '@/features/assets/files/file.repo';
import { ContactRepo } from '@/features/contacts/contact.repo';
import { UserRepo } from '@/features/users/user.repo';
import { WorkgroupRepo } from '@/features/workgroups/workgroup.repo';

export const TEST_NAT_REL_ITEM_CODE = 'testNatRel';

/**
 * - `full`: asset with all metadata fields set, multiple values and point/line/polygon geometries.
 * - `minimal`: public asset without optional values and without geometries.
 * - `foreign`: asset in a workgroup the export user does not have access to.
 */
export interface ExportFixture {
  user: User;
  full: Asset;
  minimal: Asset;
  foreign: Asset;
}

export const createExportRepos = (prisma: PrismaService) => {
  const fileRepo = new FileRepo(prisma);
  return {
    assetRepo: new AssetRepo(prisma, fileRepo),
    contactRepo: new ContactRepo(prisma),
    workgroupRepo: new WorkgroupRepo(prisma),
    userRepo: new UserRepo(prisma),
  };
};

export const createGeometry = (type: GeometryType, text: string): CreateGeometryData => ({
  mutation: GeometryMutationType.Create,
  type,
  text,
});

export const makeExportUser = (workgroupIds: WorkgroupId[] = [1]): User => ({
  id: 'export-test-user',
  email: 'export@example.com',
  firstName: 'Export',
  lastName: 'User',
  lang: 'de',
  isAdmin: false,
  roles: new Map(workgroupIds.map((id) => [id, Role.Reader])),
});

export const seedExportFixture = async (prisma: PrismaService): Promise<ExportFixture> => {
  const { assetRepo, contactRepo, workgroupRepo, userRepo } = createExportRepos(prisma);

  await prisma.natRelItem.upsert({
    where: { natRelItemCode: TEST_NAT_REL_ITEM_CODE },
    update: {},
    create: {
      natRelItemCode: TEST_NAT_REL_ITEM_CODE,
      geolCode: 'No-GeolCode-specified',
      name: 'Test national interest',
      nameDe: 'Test nationales Interesse',
      nameFr: 'Test intérêt national',
      nameIt: 'Test interesse nazionale',
      nameEn: 'Test national interest',
      description: '',
      descriptionDe: '',
      descriptionFr: '',
      descriptionIt: '',
      descriptionEn: '',
    },
  });

  const creator = await userRepo.create(fakeUserData());
  const initiator = await contactRepo.create({
    ...fakeContact(),
    name: 'Initiator AG',
    kindCode: 'fedAdmin' as ContactKindCode,
  });
  const author = await contactRepo.create({
    ...fakeContact(),
    name: 'Author GmbH',
    kindCode: 'private' as ContactKindCode,
  });
  const supplier = await contactRepo.create({
    ...fakeContact(),
    name: 'Supplier SA',
    kindCode: 'other' as ContactKindCode,
  });

  const created = await assetRepo.create({
    ...fakeCreateAssetData(),
    creatorId: creator.id,
    workgroupId: 1,
    title: 'Alpha; "quoted"',
    originalTitle: 'Original A',
    kindCodes: ['report', '2Dseismic'],
    formatCode: '3D',
    languageCodes: [LanguageCode.English],
    topicCodes: ['borehole'],
    isOfNationalInterest: true,
    nationalInterestTypeCodes: [TEST_NAT_REL_ITEM_CODE],
    isPublic: false,
    restrictionDate: LocalDate.of(2030, 1, 15),
    createdAt: LocalDate.of(2020, 3, 4),
    receivedAt: LocalDate.of(2020, 5, 6),
    identifiers: [
      { value: 'ID-1', description: 'Desc 1' },
      { value: 'ID-2', description: 'Desc 2' },
    ],
    contacts: [
      { id: author.id, role: AssetContactRole.Author },
      { id: initiator.id, role: AssetContactRole.Initiator },
      { id: supplier.id, role: AssetContactRole.Supplier },
    ],
    geometries: [
      createGeometry(GeometryType.Point, 'POINT(2600000 1200000)'),
      createGeometry(GeometryType.Point, 'POINT(2600100.5 1200200.25)'),
      createGeometry(GeometryType.LineString, 'LINESTRING(2600000 1200000, 2601000 1201000, 2602000 1200500)'),
      createGeometry(
        GeometryType.Polygon,
        'POLYGON((2600000 1200000, 2601000 1200000, 2601000 1201000, 2600000 1200000))',
      ),
    ],
  });
  await prisma.asset.update({ where: { assetId: created.id }, data: { sgsId: 4711 } });
  await prisma.file.create({
    data: { name: `export-test-${created.id}.pdf`, size: 1, lastModifiedAt: new Date(), assetId: created.id },
  });
  const full = (await assetRepo.find(created.id)) as Asset;

  const minimal = await assetRepo.create({
    ...fakeCreateAssetData(),
    creatorId: creator.id,
    workgroupId: 1,
    title: 'Beta',
    originalTitle: null,
    kindCodes: ['report'],
    formatCode: 'pdf',
    languageCodes: [],
    topicCodes: [],
    isOfNationalInterest: false,
    nationalInterestTypeCodes: [],
    isPublic: true,
    restrictionDate: null,
    createdAt: LocalDate.of(2021, 1, 2),
    receivedAt: null,
    identifiers: [],
    contacts: [],
    geometries: [],
  });

  const foreignWorkgroup = await workgroupRepo.create({ name: 'Foreign', disabledAt: null, users: new Map() });
  const foreign = await assetRepo.create({
    ...fakeCreateAssetData(),
    creatorId: creator.id,
    workgroupId: foreignWorkgroup.id,
    title: 'Foreign',
    geometries: [createGeometry(GeometryType.Point, 'POINT(2700000 1250000)')],
  });

  return { user: makeExportUser([1]), full, minimal, foreign };
};

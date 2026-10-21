import 'reflect-metadata';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LocalDate } from '../models/base/local-date';
import { CreateAssetDataSchema, UpdateAssetDataSchema } from './asset.schema';

const makePlainData = (): Record<string, unknown> => ({
  title: 'Title',
  originalTitle: null,
  isOfNationalInterest: false,
  isPublic: false,
  restrictionDate: null,
  formatCode: 'format',
  kindCode: 'kind',
  languageCodes: [],
  nationalInterestTypeCodes: [],
  topicCodes: [],
  identifiers: [],
  contacts: [],
  parent: null,
  siblings: [],
  workgroupId: 1,
  createdAt: '2024-01-02',
  receivedAt: '2024-03-04',
  geometries: [],
  files: [],
});

describe.each<[string, ClassConstructor<CreateAssetDataSchema | UpdateAssetDataSchema>]>([
  ['CreateAssetDataSchema', CreateAssetDataSchema],
  ['UpdateAssetDataSchema', UpdateAssetDataSchema],
])('%s receivedAt', (_name, schema) => {
  const parse = async (data: Record<string, unknown>) => {
    const instance = plainToInstance(schema, data) as CreateAssetDataSchema | UpdateAssetDataSchema;
    return { instance, errors: await validate(instance) };
  };

  it('accepts a valid date', async () => {
    const { instance, errors } = await parse(makePlainData());
    expect(errors).toEqual([]);
    expect(instance.receivedAt).toEqual(LocalDate.of(2024, 3, 4));
  });

  it('accepts `null`', async () => {
    const { instance, errors } = await parse({ ...makePlainData(), receivedAt: null });
    expect(errors).toEqual([]);
    expect(instance.receivedAt).toBeNull();
  });

  it('accepts a missing value', async () => {
    const data = makePlainData();
    delete data['receivedAt'];
    const { instance, errors } = await parse(data);
    expect(errors).toEqual([]);
    expect(instance.receivedAt ?? null).toBeNull();
  });

  it('still requires `createdAt`', async () => {
    const { errors } = await parse({ ...makePlainData(), createdAt: null });
    expect(errors.map((it) => it.property)).toContain('createdAt');
  });
});

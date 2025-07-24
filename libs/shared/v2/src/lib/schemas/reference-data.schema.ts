import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsObject, IsString, ValidateNested } from 'class-validator';
import { LegalDocCode } from '../models/asset-file';
import { ContactKindCode, Contact } from '../models/contact';
import { LocalizedItem } from '../models/localized-item';
import { LanguageCode, ReferenceData } from '../models/reference-data';
import { Schema } from './base/schema';
import { ContactSchema } from './contact.schema';

export class ReferenceDataSchema extends Schema implements ReferenceData {
  @IsArray()
  @IsString({ each: true })
  nationalInterestTypes!: LocalizedItem[];

  @IsArray()
  @IsString({ each: true })
  assetTopics!: LocalizedItem[];

  @IsArray()
  @IsString({ each: true })
  assetFormats!: LocalizedItem[];

  @IsArray()
  @IsString({ each: true })
  assetKinds!: LocalizedItem[];

  @IsArray()
  @IsEnum(ContactKindCode, { each: true })
  contactKinds!: LocalizedItem<ContactKindCode>[];

  @IsArray()
  @IsEnum(ContactKindCode, { each: true })
  languages!: LocalizedItem<LanguageCode>[];

  @IsArray()
  @IsEnum(LegalDocCode, { each: true })
  legalDocs!: LocalizedItem<LegalDocCode>[];

  @IsArray()
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => ContactSchema)
  contacts!: Contact[];
}

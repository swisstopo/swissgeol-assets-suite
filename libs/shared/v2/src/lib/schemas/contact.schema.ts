import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Contact, ContactData, ContactId, ContactKindCode } from '../models/contact';
import { Schema } from './base/schema';

export class ContactDataSchema extends Schema implements ContactData {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  street!: string | null;

  @IsString()
  @IsOptional()
  houseNumber!: string | null;

  @IsString()
  @IsOptional()
  plz!: string | null;

  @IsString()
  @IsOptional()
  locality!: string | null;

  @IsString()
  @IsOptional()
  country!: string | null;

  @IsString()
  @IsOptional()
  telephone!: string | null;

  @IsString()
  @IsOptional()
  email!: string | null;

  @IsString()
  @IsOptional()
  website!: string | null;

  @IsEnum(ContactKindCode)
  kindCode!: ContactKindCode;
}

export class ContactSchema extends ContactDataSchema implements Contact {
  @IsString()
  id!: ContactId;
}

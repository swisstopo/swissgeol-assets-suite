import { IsOptional, IsString } from 'class-validator';
import { ContactData } from '../models/contact';

export class ContactDataSchema implements ContactData {
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

  @IsString()
  contactKindItemCode!: string;
}

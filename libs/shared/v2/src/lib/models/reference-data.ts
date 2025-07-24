import { LegalDocCode } from './asset-file';
import { Contact, ContactId, ContactKindCode } from './contact';
import { LocalizedItem, LocalizedItemCode } from './localized-item';

export interface ReferenceData {
  nationalInterestTypes: LocalizedItem[];
  assetTopics: LocalizedItem[];
  assetFormats: LocalizedItem[];
  assetKinds: LocalizedItem[];
  contactKinds: LocalizedItem<ContactKindCode>[];
  languages: LocalizedItem<LanguageCode>[];
  legalDocs: LocalizedItem<LegalDocCode>[];
  contacts: Contact[];
}

export interface ReferenceDataMapping {
  nationalInterestTypes: Map<LocalizedItemCode, LocalizedItem>;
  assetTopics: Map<LocalizedItemCode, LocalizedItem>;
  assetFormats: Map<LocalizedItemCode, LocalizedItem>;
  assetKinds: Map<LocalizedItemCode, LocalizedItem>;
  contactKinds: Map<ContactKindCode, LocalizedItem<ContactKindCode>>;
  languages: Map<LanguageCode, LocalizedItem<LanguageCode>>;
  legalDocs: Map<LegalDocCode, LocalizedItem<LegalDocCode>>;
  contacts: Map<ContactId, Contact>;
}

export enum LanguageCode {
  English = 'EN',
  German = 'DE',
  French = 'FR',
  Italian = 'IT',
  Numeric = 'NUM',
  Other = 'other',
}

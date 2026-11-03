import {
  Asset,
  Contact,
  ContactId,
  LocalDate,
  LocalizedItem,
  LocalizedItemCode,
  WorkgroupId,
} from '@asset-sg/shared/v2';
import {
  CONTACT_ROLE_LABELS,
  CONTACT_ROLE_ORDER,
  CsvColumnKey,
  ExportLanguage,
  RESTRICTION_TYPE_LABELS,
  WORKFLOW_STATUS_LABELS,
} from '@/features/assets/export/asset-export.i18n';

export enum ExportValueType {
  Text = 'text',
  TextList = 'textList',
  Integer = 'integer',
  Date = 'date',
  Boolean = 'boolean',
}

export type ExportValue = string | number | boolean | LocalDate | string[] | null;

export type ExportColumnKey = CsvColumnKey;

export interface ExportColumn {
  key: ExportColumnKey;
  type: ExportValueType;
  name: string;
}

export const EXPORT_COLUMN_DEFINITIONS: Record<ExportColumnKey, Omit<ExportColumn, 'key'>> = {
  title: { type: ExportValueType.Text, name: 'title' },
  status: { type: ExportValueType.Text, name: 'status' },
  restrictionType: { type: ExportValueType.Text, name: 'restriction_type' },
  restrictionDate: { type: ExportValueType.Date, name: 'restriction_date' },
  topic: { type: ExportValueType.TextList, name: 'topic' },
  kind: { type: ExportValueType.TextList, name: 'kind' },
  language: { type: ExportValueType.TextList, name: 'language' },
  format: { type: ExportValueType.Text, name: 'format' },
  originalTitle: { type: ExportValueType.Text, name: 'original_title' },
  createdAt: { type: ExportValueType.Date, name: 'created_at' },
  receivedAt: { type: ExportValueType.Date, name: 'received_at' },
  nationalInterest: { type: ExportValueType.Boolean, name: 'national_interest' },
  nationalInterestType: { type: ExportValueType.TextList, name: 'national_interest_type' },
  contactRole: { type: ExportValueType.TextList, name: 'contact_role' },
  contactKind: { type: ExportValueType.TextList, name: 'contact_kind' },
  contactName: { type: ExportValueType.TextList, name: 'contact_name' },
  assetId: { type: ExportValueType.Integer, name: 'asset_id' },
  sgsId: { type: ExportValueType.Integer, name: 'sgs_id' },
  alternativeIds: { type: ExportValueType.TextList, name: 'alternative_ids' },
  alternativeIdDescriptions: { type: ExportValueType.TextList, name: 'alternative_id_descriptions' },
  documents: { type: ExportValueType.TextList, name: 'documents' },
  workgroup: { type: ExportValueType.Text, name: 'workgroup' },
};

export type LabelMap = Map<LocalizedItemCode, LocalizedItem>;

export interface ReferenceLabels {
  topics: LabelMap;
  kinds: LabelMap;
  formats: LabelMap;
  nationalInterestTypes: LabelMap;
  languages: LabelMap;
  contactKinds: LabelMap;
}

export interface ExportContext {
  references: ReferenceLabels;
  contactsById: Map<ContactId, Contact>;
  workgroupNameById: Map<WorkgroupId, string>;
}

export interface AssetExportRecord {
  asset: Asset;
  values: ExportValue[];
}

export interface AssetExportDataset {
  language: ExportLanguage;
  columns: ExportColumn[];
  records: AssetExportRecord[];
}

export const resolveExportValue = (
  key: ExportColumnKey,
  asset: Asset,
  language: ExportLanguage,
  context: ExportContext,
): ExportValue => {
  const { references, contactsById, workgroupNameById } = context;
  const localize = (item: LocalizedItem | undefined): string | null =>
    item === undefined ? null : (item.name[language] ?? item.name.default);
  const localizeCode = (code: LocalizedItemCode, map: LabelMap): string | null => localize(map.get(code));
  const localizeCodes = (codes: LocalizedItemCode[], map: LabelMap): string[] =>
    codes.map((code) => localizeCode(code, map) ?? '');

  switch (key) {
    case 'title':
      return asset.title;
    case 'status':
      return WORKFLOW_STATUS_LABELS[asset.workflowStatus]?.[language] ?? asset.workflowStatus;
    case 'restrictionType': {
      if (asset.isPublic) {
        return RESTRICTION_TYPE_LABELS.free[language];
      }
      return asset.restrictionDate != null
        ? RESTRICTION_TYPE_LABELS.lockedUntil[language]
        : RESTRICTION_TYPE_LABELS.locked[language];
    }
    case 'restrictionDate':
      return asset.restrictionDate ?? null;
    case 'topic':
      return localizeCodes(asset.topicCodes, references.topics);
    case 'kind':
      return localizeCodes(asset.kindCodes, references.kinds);
    case 'language':
      return localizeCodes(asset.languageCodes, references.languages);
    case 'format':
      return localizeCode(asset.formatCode, references.formats);
    case 'originalTitle':
      return asset.originalTitle ?? null;
    case 'createdAt':
      return asset.createdAt;
    case 'receivedAt':
      return asset.receivedAt ?? null;
    case 'nationalInterest':
      return asset.isOfNationalInterest;
    case 'nationalInterestType':
      return localizeCodes(asset.nationalInterestTypeCodes, references.nationalInterestTypes);
    case 'contactRole':
      return orderContacts(asset).map((contact) => CONTACT_ROLE_LABELS[contact.role][language]);
    case 'contactKind':
      return orderContacts(asset).map((contact) => {
        const kindCode = contactsById.get(contact.id)?.kindCode;
        return kindCode == null ? '' : (localizeCode(kindCode, references.contactKinds) ?? '');
      });
    case 'contactName':
      return orderContacts(asset).map((contact) => contactsById.get(contact.id)?.name ?? '');
    case 'assetId':
      return asset.id;
    case 'sgsId':
      return asset.legacyData?.sgsId ?? null;
    case 'alternativeIds':
      return asset.identifiers.map((identifier) => identifier.value);
    case 'alternativeIdDescriptions':
      return asset.identifiers.map((identifier) => identifier.description);
    case 'documents':
      return asset.files.map((file) => file.name);
    case 'workgroup':
      return workgroupNameById.get(asset.workgroupId) ?? null;
  }
};

const orderContacts = (asset: Asset): Asset['contacts'] =>
  [...asset.contacts].sort((a, b) => CONTACT_ROLE_ORDER.indexOf(a.role) - CONTACT_ROLE_ORDER.indexOf(b.role));

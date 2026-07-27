import {
  Asset,
  AssetId,
  AssetPolicy,
  Contact,
  ContactId,
  ContactKindCode,
  LanguageCode,
  LocalizedItem,
  LocalizedItemCode,
  MAX_EXPORT_ASSETS,
  User,
  WorkgroupId,
} from '@asset-sg/shared/v2';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/prisma.service';
import { AssetRepo } from '@/features/assets/asset.repo';
import {
  BOOLEAN_LABELS,
  CONTACT_ROLE_LABELS,
  CONTACT_ROLE_ORDER,
  CSV_COLUMN_HEADERS,
  CSV_COLUMN_KEYS,
  CSV_PUBLIC_COLUMNS,
  CsvColumnKey,
  ExportLanguage,
  WORKFLOW_STATUS_LABELS,
} from '@/features/assets/export/asset-export.i18n';
import { ContactRepo } from '@/features/contacts/contact.repo';
import { localizedItemSelection, mapItems } from '@/features/reference-data/prisma-reference-data';
import { WorkgroupRepo } from '@/features/workgroups/workgroup.repo';

const CSV_DELIMITER = ';';
const MULTI_VALUE_SEPARATOR = ',';

type LabelMap = Map<LocalizedItemCode, LocalizedItem>;

@Injectable()
export class AssetExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly assetRepo: AssetRepo,
    private readonly contactRepo: ContactRepo,
    private readonly workgroupRepo: WorkgroupRepo,
  ) {}

  async exportAssetsAsCsv(assetIds: AssetId[], user: User, language: ExportLanguage): Promise<string> {
    const isAnonymous = process.env.ANONYMOUS_MODE === 'true';
    const ids = [...new Set(assetIds)].slice(0, MAX_EXPORT_ASSETS);

    const assets = await this.assetRepo.list({ ids });
    const policy = new AssetPolicy(user);
    const assetById = new Map(assets.map((asset) => [asset.id, asset]));

    // Preserve the order in which the assets were requested and drop unauthorized ones.
    const orderedAssets = ids
      .map((id) => assetById.get(id))
      .filter((asset): asset is Asset => asset != null && policy.canShow(asset));

    const [references, contactsById, workgroupNameById] = await Promise.all([
      this.loadReferenceLabels(),
      this.loadContacts(orderedAssets),
      this.loadWorkgroupNames(orderedAssets),
    ]);

    const columns = CSV_COLUMN_KEYS.filter((key) => !isAnonymous || CSV_PUBLIC_COLUMNS[key]);

    const headerRow = this.toCsvRow(columns.map((key) => CSV_COLUMN_HEADERS[key][language]));
    const dataRows = orderedAssets.map((asset) =>
      this.toCsvRow(
        columns.map((key) => this.resolveCell(key, asset, language, { references, contactsById, workgroupNameById })),
      ),
    );

    return [headerRow, ...dataRows].join('\n');
  }

  private resolveCell(
    key: CsvColumnKey,
    asset: Asset,
    language: ExportLanguage,
    context: {
      references: ReferenceLabels;
      contactsById: Map<ContactId, Contact>;
      workgroupNameById: Map<WorkgroupId, string>;
    },
  ): string {
    const { references, contactsById, workgroupNameById } = context;
    const localize = (item: LocalizedItem | undefined): string =>
      item === undefined ? '' : (item.name[language] ?? item.name.default);
    const localizeCode = (code: LocalizedItemCode, map: LabelMap): string => localize(map.get(code));
    const joinCodes = (codes: LocalizedItemCode[], map: LabelMap): string =>
      codes.map((code) => localizeCode(code, map)).join(MULTI_VALUE_SEPARATOR);

    const orderedContacts = this.orderContacts(asset);

    switch (key) {
      case 'title':
        return asset.title;
      case 'status':
        return WORKFLOW_STATUS_LABELS[asset.workflowStatus]?.[language] ?? asset.workflowStatus;
      case 'restriction':
        return asset.restrictionDate?.toString() ?? '';
      case 'topic':
        return joinCodes(asset.topicCodes, references.topics);
      case 'kind':
        return localizeCode(asset.kindCode, references.kinds);
      case 'language':
        return joinCodes(asset.languageCodes, references.languages);
      case 'format':
        return localizeCode(asset.formatCode, references.formats);
      case 'originalTitle':
        return asset.originalTitle ?? '';
      case 'createdAt':
        return asset.createdAt.toString();
      case 'receivedAt':
        return asset.receivedAt.toString();
      case 'nationalInterest':
        return BOOLEAN_LABELS[asset.isOfNationalInterest ? 'true' : 'false'][language];
      case 'nationalInterestType':
        return joinCodes(asset.nationalInterestTypeCodes, references.nationalInterestTypes);
      case 'contactRole':
        return orderedContacts
          .map((contact) => CONTACT_ROLE_LABELS[contact.role][language])
          .join(MULTI_VALUE_SEPARATOR);
      case 'contactKind':
        return orderedContacts
          .map((contact) => {
            const kindCode = contactsById.get(contact.id)?.kindCode;
            return kindCode == null ? '' : localizeCode(kindCode, references.contactKinds);
          })
          .join(MULTI_VALUE_SEPARATOR);
      case 'contactName':
        return orderedContacts.map((contact) => contactsById.get(contact.id)?.name ?? '').join(MULTI_VALUE_SEPARATOR);
      case 'assetId':
        return String(asset.id);
      case 'sgsId':
        return asset.legacyData?.sgsId?.toString() ?? '';
      case 'alternativeIds':
        return asset.identifiers.map((identifier) => identifier.value).join(MULTI_VALUE_SEPARATOR);
      case 'alternativeIdDescriptions':
        return asset.identifiers.map((identifier) => identifier.description).join(MULTI_VALUE_SEPARATOR);
      case 'documents':
        return asset.files.map((file) => file.name).join(MULTI_VALUE_SEPARATOR);
      case 'workgroup':
        return workgroupNameById.get(asset.workgroupId) ?? '';
    }
  }

  private orderContacts(asset: Asset): Asset['contacts'] {
    return [...asset.contacts].sort((a, b) => CONTACT_ROLE_ORDER.indexOf(a.role) - CONTACT_ROLE_ORDER.indexOf(b.role));
  }

  private async loadReferenceLabels(): Promise<ReferenceLabels> {
    const [topics, kinds, formats, nationalInterestTypes, languages, contactKinds] = await Promise.all([
      mapItems(
        'manCatLabelItemCode',
        this.prisma.manCatLabelItem.findMany({ select: { ...localizedItemSelection, manCatLabelItemCode: true } }),
      ),
      mapItems(
        'assetKindItemCode',
        this.prisma.assetKindItem.findMany({ select: { ...localizedItemSelection, assetKindItemCode: true } }),
      ),
      mapItems(
        'assetFormatItemCode',
        this.prisma.assetFormatItem.findMany({ select: { ...localizedItemSelection, assetFormatItemCode: true } }),
      ),
      mapItems(
        'natRelItemCode',
        this.prisma.natRelItem.findMany({ select: { ...localizedItemSelection, natRelItemCode: true } }),
      ),
      mapItems(
        'languageItemCode',
        this.prisma.languageItem.findMany({ select: { ...localizedItemSelection, languageItemCode: true } }),
        LanguageCode,
      ),
      mapItems(
        'contactKindItemCode',
        this.prisma.contactKindItem.findMany({ select: { ...localizedItemSelection, contactKindItemCode: true } }),
        ContactKindCode,
      ),
    ]);

    return {
      topics: toLabelMap(topics),
      kinds: toLabelMap(kinds),
      formats: toLabelMap(formats),
      nationalInterestTypes: toLabelMap(nationalInterestTypes),
      languages: toLabelMap(languages),
      contactKinds: toLabelMap(contactKinds),
    };
  }

  private async loadContacts(assets: Asset[]): Promise<Map<ContactId, Contact>> {
    const contactIds = [...new Set(assets.flatMap((asset) => asset.contacts.map((contact) => contact.id)))];
    if (contactIds.length === 0) {
      return new Map();
    }
    const contacts = await this.contactRepo.list({ ids: contactIds });
    return new Map(contacts.map((contact) => [contact.id, contact]));
  }

  private async loadWorkgroupNames(assets: Asset[]): Promise<Map<WorkgroupId, string>> {
    const workgroupIds = [...new Set(assets.map((asset) => asset.workgroupId))];
    if (workgroupIds.length === 0) {
      return new Map();
    }
    const workgroups = await this.workgroupRepo.list({ ids: workgroupIds });
    return new Map(workgroups.map((workgroup) => [workgroup.id, workgroup.name]));
  }

  private toCsvRow(cells: string[]): string {
    return cells.map((cell) => escapeCsvCell(cell)).join(CSV_DELIMITER);
  }
}

interface ReferenceLabels {
  topics: LabelMap;
  kinds: LabelMap;
  formats: LabelMap;
  nationalInterestTypes: LabelMap;
  languages: LabelMap;
  contactKinds: LabelMap;
}

const toLabelMap = (items: LocalizedItem[]): LabelMap => new Map(items.map((item) => [item.code, item]));

export const escapeCsvCell = (value: string): string => {
  if (value.includes(CSV_DELIMITER) || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

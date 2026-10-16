import {
  Asset,
  AssetId,
  AssetPolicy,
  Contact,
  ContactId,
  ContactKindCode,
  LanguageCode,
  LocalizedItem,
  MAX_EXPORT_ASSETS,
  User,
  WorkgroupId,
} from '@asset-sg/shared/v2';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/prisma.service';
import { AssetRepo } from '@/features/assets/asset.repo';
import {
  AssetExportDataset,
  EXPORT_COLUMN_DEFINITIONS,
  ExportColumn,
  ExportContext,
  LabelMap,
  ReferenceLabels,
  resolveExportValue,
} from '@/features/assets/export/asset-export-metadata';
import { CSV_COLUMN_KEYS, CSV_PUBLIC_COLUMNS, ExportLanguage } from '@/features/assets/export/asset-export.i18n';
import { ContactRepo } from '@/features/contacts/contact.repo';
import { localizedItemSelection, mapItems } from '@/features/reference-data/prisma-reference-data';
import { WorkgroupRepo } from '@/features/workgroups/workgroup.repo';

@Injectable()
export class AssetExportMetadataService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly assetRepo: AssetRepo,
    private readonly contactRepo: ContactRepo,
    private readonly workgroupRepo: WorkgroupRepo,
  ) {}

  /**
   * Duplicate ids are removed and only the first {@link MAX_EXPORT_ASSETS} ids are considered.
   * Assets that don't exist or that the user is not allowed to see are omitted.
   * The remaining assets keep the order in which they were requested.
   * In anonymous mode, non-public columns are omitted.
   */
  async load(assetIds: AssetId[], user: User, language: ExportLanguage): Promise<AssetExportDataset> {
    const isAnonymous = process.env.ANONYMOUS_MODE === 'true';
    const ids = [...new Set(assetIds)].slice(0, MAX_EXPORT_ASSETS);

    const assets = ids.length === 0 ? [] : await this.assetRepo.list({ ids });
    const policy = new AssetPolicy(user);
    const assetById = new Map(assets.map((asset) => [asset.id, asset]));

    const orderedAssets = ids
      .map((id) => assetById.get(id))
      .filter((asset): asset is Asset => asset != null && policy.canShow(asset));

    const [references, contactsById, workgroupNameById] = await Promise.all([
      this.loadReferenceLabels(),
      this.loadContacts(orderedAssets),
      this.loadWorkgroupNames(orderedAssets),
    ]);
    const context: ExportContext = { references, contactsById, workgroupNameById };

    const columns: ExportColumn[] = CSV_COLUMN_KEYS.filter((key) => !isAnonymous || CSV_PUBLIC_COLUMNS[key]).map(
      (key) => ({ key, ...EXPORT_COLUMN_DEFINITIONS[key] }),
    );

    return {
      language,
      columns,
      records: orderedAssets.map((asset) => ({
        asset,
        values: columns.map((column) => resolveExportValue(column.key, asset, language, context)),
      })),
    };
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
}

const toLabelMap = (items: LocalizedItem[]): LabelMap => new Map(items.map((item) => [item.code, item]));

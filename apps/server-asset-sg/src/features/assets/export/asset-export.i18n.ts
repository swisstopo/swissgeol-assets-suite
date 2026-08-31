import { AssetContactRole } from '@asset-sg/shared/v2';
import { WorkflowStatus } from '@swissgeol/ui-core';

/**
 * Languages supported by the CSV export. These match the keys of {@link LocalizedString}
 * as well as the values of the `Language` enum from `@swissgeol/ui-core`.
 */
export const EXPORT_LANGUAGES = ['de', 'fr', 'it', 'en'] as const;

export type ExportLanguage = (typeof EXPORT_LANGUAGES)[number];

export const DEFAULT_EXPORT_LANGUAGE: ExportLanguage = 'de';

export const isExportLanguage = (value: unknown): value is ExportLanguage =>
  typeof value === 'string' && (EXPORT_LANGUAGES as readonly string[]).includes(value);

type Localized = Record<ExportLanguage, string>;

/**
 * The columns of the exported CSV, in order.
 * `isPublic` controls whether the column is included in anonymous (VIEW) mode.
 */
export const CSV_COLUMN_KEYS = [
  'title',
  'status',
  'restrictionType',
  'restrictionDate',
  'topic',
  'kind',
  'language',
  'format',
  'originalTitle',
  'createdAt',
  'receivedAt',
  'nationalInterest',
  'nationalInterestType',
  'contactRole',
  'contactKind',
  'contactName',
  'assetId',
  'sgsId',
  'alternativeIds',
  'alternativeIdDescriptions',
  'documents',
  'workgroup',
] as const;

export type CsvColumnKey = (typeof CSV_COLUMN_KEYS)[number];

export const CSV_PUBLIC_COLUMNS: Record<CsvColumnKey, boolean> = {
  title: true,
  status: true,
  restrictionType: true,
  restrictionDate: true,
  topic: true,
  kind: true,
  language: true,
  format: true,
  originalTitle: false,
  createdAt: true,
  receivedAt: true,
  nationalInterest: true,
  nationalInterestType: true,
  contactRole: true,
  contactKind: true,
  contactName: true,
  assetId: true,
  sgsId: false,
  alternativeIds: false,
  alternativeIdDescriptions: false,
  documents: true,
  workgroup: true,
};

export const CSV_COLUMN_HEADERS: Record<CsvColumnKey, Localized> = {
  title: { de: 'Öffentlicher Titel', fr: 'Titre public', it: 'Titolo pubblico', en: 'Public title' },
  status: { de: 'Status', fr: 'Statut', it: 'Stato', en: 'Status' },
  restrictionType: { de: 'Beschränkung', fr: 'Restriction', it: 'Restrizione', en: 'Restriction' },
  restrictionDate: {
    de: 'Beschränkungsdatum',
    fr: 'Date de restriction',
    it: 'Data di restrizione',
    en: 'Restriction date',
  },
  topic: { de: 'Thema', fr: 'Thème', it: 'Tema', en: 'Topic' },
  kind: { de: 'Typ', fr: 'Type', it: 'Tipo', en: 'Kind' },
  language: { de: 'Sprache', fr: 'Langue', it: 'Lingua', en: 'Language' },
  format: { de: 'Format', fr: 'Format', it: 'Formato', en: 'Format' },
  originalTitle: { de: 'Originaltitel', fr: 'Titre original', it: 'Titolo originale', en: 'Original title' },
  createdAt: { de: 'Erstellungsdatum', fr: 'Date de création', it: 'Data di creazione', en: 'Creation date' },
  receivedAt: { de: 'Eingangsdatum', fr: 'Date de réception', it: 'Data di ricezione', en: 'Received date' },
  nationalInterest: {
    de: 'Nationales Interesse',
    fr: 'Intérêt national',
    it: 'Interesse nazionale',
    en: 'National interest',
  },
  nationalInterestType: {
    de: 'Nationales Interesse Typ',
    fr: "Type d'intérêt national",
    it: 'Tipo di interesse nazionale',
    en: 'National interest type',
  },
  contactRole: { de: 'Kontaktrolle', fr: 'Rôle du contact', it: 'Ruolo del contatto', en: 'Contact role' },
  contactKind: { de: 'Kontaktart', fr: 'Type de contact', it: 'Tipo di contatto', en: 'Contact kind' },
  contactName: { de: 'Kontaktname', fr: 'Nom du contact', it: 'Nome del contatto', en: 'Contact name' },
  assetId: { de: 'Asset-ID', fr: "ID de l'asset", it: 'ID asset', en: 'Asset ID' },
  sgsId: { de: 'SGS-ID', fr: 'SGS-ID', it: 'SGS-ID', en: 'SGS-ID' },
  alternativeIds: { de: 'Alternativ-IDs', fr: 'ID alternatifs', it: 'ID alternativi', en: 'Alternative IDs' },
  alternativeIdDescriptions: {
    de: 'Beschreibung Alternativ-IDs',
    fr: 'Description des ID alternatifs',
    it: 'Descrizione ID alternativi',
    en: 'Alternative ID descriptions',
  },
  documents: { de: 'Dokument', fr: 'Document', it: 'Documento', en: 'Document' },
  workgroup: { de: 'Arbeitsgruppe', fr: 'Groupe de travail', it: 'Gruppo di lavoro', en: 'Workgroup' },
};

/**
 * Contact roles are ordered alphabetically by their German label:
 * 1. Auftraggeber (initiator) 2. Autor (author) 3. Einlieferer (supplier).
 */
export const CONTACT_ROLE_ORDER: AssetContactRole[] = [
  AssetContactRole.Initiator,
  AssetContactRole.Author,
  AssetContactRole.Supplier,
];

export const CONTACT_ROLE_LABELS: Record<AssetContactRole, Localized> = {
  [AssetContactRole.Author]: { de: 'Autor', fr: 'Auteur', it: 'Autore', en: 'Author' },
  [AssetContactRole.Initiator]: { de: 'Auftraggeber', fr: "Maître d'ouvrage", it: 'Committente', en: 'Client' },
  [AssetContactRole.Supplier]: { de: 'Einlieferer', fr: 'Fournisseur', it: 'Fornitore', en: 'Supplier' },
};

export const WORKFLOW_STATUS_LABELS: Record<WorkflowStatus, Localized> = {
  [WorkflowStatus.Draft]: { de: 'Draft', fr: 'Draft', it: 'Draft', en: 'Draft' },
  [WorkflowStatus.InReview]: { de: 'Review', fr: 'Review', it: 'Review', en: 'In review' },
  [WorkflowStatus.Reviewed]: { de: 'Reviewed', fr: 'Reviewed', it: 'Reviewed', en: 'Reviewed' },
  [WorkflowStatus.Published]: { de: 'Veröffentlicht', fr: 'Publié', it: 'Pubblicato', en: 'Published' },
};

export const BOOLEAN_LABELS: { true: Localized; false: Localized } = {
  true: { de: 'Ja', fr: 'Oui', it: 'Sì', en: 'Yes' },
  false: { de: 'Nein', fr: 'Non', it: 'No', en: 'No' },
};

export const RESTRICTION_TYPE_LABELS = {
  free: { de: 'frei', fr: 'libre', it: 'libero', en: 'free' },
  locked: { de: 'gesperrt', fr: 'bloqué', it: 'bloccato', en: 'locked' },
  lockedUntil: { de: 'gesperrt bis', fr: "bloqué jusqu'au", it: 'bloccato fino al', en: 'locked until' },
} as const;

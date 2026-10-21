import { AssetId, LocalDate, User } from '@asset-sg/shared/v2';
import { Injectable } from '@nestjs/common';
import { AssetExportDataset, ExportValue, ExportValueType } from '@/features/assets/export/asset-export-metadata';
import { AssetExportMetadataService } from '@/features/assets/export/asset-export-metadata.service';
import { BOOLEAN_LABELS, CSV_COLUMN_HEADERS, ExportLanguage } from '@/features/assets/export/asset-export.i18n';

const CSV_DELIMITER = ';';
const MULTI_VALUE_SEPARATOR = ',';

@Injectable()
export class AssetExportService {
  constructor(private readonly metadataService: AssetExportMetadataService) {}

  async exportAssetsAsCsv(assetIds: AssetId[], user: User, language: ExportLanguage): Promise<string> {
    const dataset = await this.metadataService.load(assetIds, user, language);
    return serializeCsv(dataset);
  }
}

export const serializeCsv = (dataset: AssetExportDataset): string => {
  const { language, columns, records } = dataset;
  const headerRow = toCsvRow(columns.map((column) => CSV_COLUMN_HEADERS[column.key][language]));
  const dataRows = records.map((record) =>
    toCsvRow(columns.map((column, i) => formatCsvValue(column.type, record.values[i], language))),
  );
  return [headerRow, ...dataRows].join('\n');
};

const formatCsvValue = (type: ExportValueType, value: ExportValue, language: ExportLanguage): string => {
  if (value === null) {
    return '';
  }
  switch (type) {
    case ExportValueType.TextList:
      return (value as string[]).join(MULTI_VALUE_SEPARATOR);
    case ExportValueType.Boolean:
      return BOOLEAN_LABELS[value ? 'true' : 'false'][language];
    case ExportValueType.Date:
      return (value as LocalDate).toString();
    case ExportValueType.Integer:
      return String(value);
    case ExportValueType.Text:
      return value as string;
  }
};

const toCsvRow = (cells: string[]): string => cells.map((cell) => escapeCsvCell(cell)).join(CSV_DELIMITER);

export const escapeCsvCell = (value: string): string => {
  if (value.includes(CSV_DELIMITER) || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

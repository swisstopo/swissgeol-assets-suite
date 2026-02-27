import { Logger } from '@nestjs/common';
import { Command, CommandRunner } from 'nest-commander';
import { PrismaService } from '@/core/prisma.service';
import { FileS3Service } from '@/features/assets/files/file-s3.service';

/**
 * Duplicates S3 files that are shared across multiple assets (via the asset_file join table).
 *
 * For each file that is linked to more than one asset, the "primary" assignment (lowest asset_id)
 * keeps the original file. For every additional assignment, this command:
 *   1. Copies the S3 object under a new key with the target asset's `a{assetId}_` prefix.
 *   2. Inserts a new `file` row with the new key (file_name).
 *   3. Updates the `asset_file` join row to point to the newly created file.
 *
 * After this command finishes, every file_id in asset_file maps to exactly one asset_id,
 * so the subsequent Prisma migration can safely convert the relationship to one-to-many.
 *
 * This command is idempotent – it skips files that have already been duplicated.
 * It must be run **before** the Prisma migration that drops the asset_file table.
 */
@Command({
  name: 'migration:duplicate-shared-files',
  description: 'Duplicates S3 files shared across multiple assets so that each file belongs to exactly one asset.',
})
export class S3DuplicateFilesCommand extends CommandRunner {
  private readonly logger = new Logger(S3DuplicateFilesCommand.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fileS3Service: FileS3Service,
  ) {
    super();
  }

  async run(): Promise<void> {
    this.logger.log('Starting S3 file duplication for shared files...');

    // ----------------------------------------------------------------
    // 1. Check that the asset_file table still exists (migration not yet applied).
    // ----------------------------------------------------------------
    const tableExists = await this.assetFileTableExists();
    if (!tableExists) {
      this.logger.warn('The asset_file table does not exist – the migration has already been applied. Nothing to do.');
      return;
    }

    // ----------------------------------------------------------------
    // 2. Find all files that are linked to more than one asset.
    // ----------------------------------------------------------------
    const sharedFiles = await this.findSharedFiles();
    if (sharedFiles.length === 0) {
      this.logger.log('No shared files found. Nothing to duplicate.');
      return;
    }

    this.logger.log(`Found ${sharedFiles.length} file(s) shared across multiple assets.`);

    let duplicatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const shared of sharedFiles) {
      // The primary assignment (lowest asset_id) keeps the original file.
      // All other assignments need a duplicated file.
      const sortedAssetIds = shared.assetIds.sort((a, b) => a - b);
      const primaryAssetId = sortedAssetIds[0];
      const secondaryAssetIds = sortedAssetIds.slice(1);

      this.logger.log(
        `File id=${shared.fileId} name="${shared.fileName}" is shared by assets [${sortedAssetIds.join(', ')}]. ` +
          `Primary: ${primaryAssetId}. Duplicating for: [${secondaryAssetIds.join(', ')}].`,
      );

      for (const targetAssetId of secondaryAssetIds) {
        try {
          const wasDuplicated = await this.duplicateFileForAsset(shared, targetAssetId);
          if (wasDuplicated) {
            duplicatedCount++;
          } else {
            skippedCount++;
          }
        } catch (e) {
          errorCount++;
          this.logger.error(`Failed to duplicate file id=${shared.fileId} for asset ${targetAssetId}: ${e}`);
        }
      }
    }

    this.logger.log(
      `Done. Duplicated: ${duplicatedCount}, Skipped (already done): ${skippedCount}, Errors: ${errorCount}.`,
    );
    if (errorCount > 0) {
      this.logger.error(
        'Some files could not be duplicated. Fix the errors and re-run this command before applying the migration.',
      );
    }
  }

  // ------------------------------------------------------------------
  // Private helpers
  // ------------------------------------------------------------------

  private async assetFileTableExists(): Promise<boolean> {
    const result = await this.prisma.$queryRawUnsafe<{ exists: boolean }[]>(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'asset_file'
       ) AS "exists"`,
    );
    return result[0]?.exists ?? false;
  }

  /**
   * Returns all files that appear in more than one asset_file row.
   */
  private async findSharedFiles(): Promise<SharedFile[]> {
    const rows = await this.prisma.$queryRawUnsafe<
      { file_id: number; file_name: string; file_name_alias: string | null; asset_ids: number[] }[]
    >(
      `SELECT
         f.id            AS file_id,
         f.file_name     AS file_name,
         f.file_name_alias AS file_name_alias,
         array_agg(af.asset_id ORDER BY af.asset_id) AS asset_ids
       FROM asset_file af
       JOIN file f ON f.id = af.file_id
       GROUP BY f.id, f.file_name, f.file_name_alias
       HAVING count(*) > 1`,
    );
    return rows.map((r) => ({
      fileId: r.file_id,
      fileName: r.file_name,
      fileNameAlias: r.file_name_alias,
      assetIds: r.asset_ids,
    }));
  }

  /**
   * Duplicates a single file for a given target asset.
   * Returns `true` if a duplication was performed, `false` if it was already done.
   */
  private async duplicateFileForAsset(shared: SharedFile, targetAssetId: number): Promise<boolean> {
    const newFileName = this.computeNewFileName(shared.fileName, targetAssetId);

    // Check idempotency: if a file with the new name already exists in the DB, skip.
    const existingFile = await this.prisma.file.findFirst({
      where: { name: newFileName },
      select: { id: true },
    });
    if (existingFile != null) {
      this.logger.log(
        `  Skipping asset ${targetAssetId}: file "${newFileName}" already exists (id=${existingFile.id}).`,
      );

      return false;
    }

    // 1. Copy the S3 object.
    this.logger.log(`  Copying S3 object "${shared.fileName}" -> "${newFileName}" for asset ${targetAssetId}...`);
    await this.copyS3Object(shared.fileName, newFileName);

    // 2. Insert a new file row that is a clone of the original (with the new name).
    const newFileId = await this.cloneFileRecord(shared.fileId, newFileName, shared.fileName);
    this.logger.log(`  Created new file record id=${newFileId} name="${newFileName}".`);

    // 3. Update the asset_file join row to point to the new file.
    await this.prisma.$executeRawUnsafe(
      `UPDATE asset_file SET file_id = $1 WHERE asset_id = $2 AND file_id = $3`,
      newFileId,
      targetAssetId,
      shared.fileId,
    );
    this.logger.log(`  Updated asset_file: asset ${targetAssetId} now points to file ${newFileId}.`);

    return true;
  }

  /**
   * Computes the new file name for a duplicate.
   *
   * Naming convention (consistent with `determineUniqueFilename` in file.repo.ts):
   *   - If the file already has an `a{N}_` prefix, replace `N` with the target asset id.
   *   - Otherwise, prepend `a{targetAssetId}_`.
   */
  private computeNewFileName(originalName: string, targetAssetId: number): string {
    const prefixRegex = /^a\d+_/;
    if (prefixRegex.test(originalName)) {
      return originalName.replace(prefixRegex, `a${targetAssetId}_`);
    }
    return `a${targetAssetId}_${originalName}`;
  }

  /**
   * Uses S3 server-side copy to duplicate an object within the same bucket.
   */
  private async copyS3Object(sourceName: string, destinationName: string): Promise<void> {
    const wasCopied = await this.fileS3Service.copy(sourceName, destinationName);
    if (!wasCopied) {
      throw new Error(`S3 object "${sourceName}" not found. Cannot duplicate.`);
    }
  }

  /**
   * Clones the file row, giving the new row a different file_name.
   * Returns the id of the newly inserted file.
   */
  private async cloneFileRecord(
    originalFileId: number,
    newFileName: string,
    originalFileName: string,
  ): Promise<number> {
    const result = await this.prisma.$queryRawUnsafe<{ id: number }[]>(
      `INSERT INTO file (
         file_name, file_name_alias,
         file_processing_stage, file_processing_state,
         size, last_modified_at, type, page_count,
         legal_doc_item_code, page_range_classifications
       )
       SELECT
         $1, COALESCE(f.file_name_alias, $2),
         f.file_processing_stage, f.file_processing_state,
         f.size, f.last_modified_at, f.type, f.page_count,
         f.legal_doc_item_code, f.page_range_classifications
       FROM file f
       WHERE f.id = $3
       RETURNING id`,
      newFileName,
      originalFileName,
      originalFileId,
    );
    if (result.length === 0) {
      throw new Error(`Could not clone file record for original id=${originalFileId}.`);
    }
    return result[0].id;
  }
}

interface SharedFile {
  fileId: number;
  fileName: string;
  fileNameAlias: string | null;
  assetIds: number[];
}

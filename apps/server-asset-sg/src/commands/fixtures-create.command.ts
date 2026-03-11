import {
  Asset,
  AssetFile,
  Contact,
  convert,
  FileProcessingStage,
  FileProcessingState,
  fixtures,
  sleep,
  WorkflowPublishData,
  WorkflowPublishDataSchema,
} from '@asset-sg/shared/v2';
import { Logger } from '@nestjs/common';
import { WorkflowStatus } from '@swissgeol/ui-core';
import { Command, CommandRunner } from 'nest-commander';
import { deepEquals } from 'nx/src/utils/json-diff';
import { PrismaService } from '@/core/prisma.service';
import { AssetRepo } from '@/features/assets/asset.repo';
import { FileRepo } from '@/features/assets/files/file.repo';
import { FileService } from '@/features/assets/files/file.service';
import { AssetSearchService } from '@/features/assets/search/asset-search.service';
import { WorkflowService } from '@/features/assets/workflow/workflow.service';
import { ContactRepo } from '@/features/contacts/contact.repo';
import { UserRepo } from '@/features/users/user.repo';

@Command({ name: 'fixtures:create', description: 'Adds the test fixtures to the database.' })
export class FixturesCreateCommand extends CommandRunner {
  private readonly logger = new Logger(FixturesCreateCommand.name);

  constructor(
    private readonly assetRepo: AssetRepo,
    private readonly contactRepo: ContactRepo,
    private readonly fileService: FileService,
    private readonly fileRepo: FileRepo,
    private readonly userRepo: UserRepo,
    private readonly assetSearchService: AssetSearchService,
    private readonly workflowService: WorkflowService,
    private readonly prismaService: PrismaService,
  ) {
    super();
  }

  async run(): Promise<void> {
    if (process.env.NODE_ENV !== 'development') {
      this.logger.fatal('Fixtures can only be imported in development environments.');
      process.exit(1);
    }

    this.logger.log('Creating fixtures...');
    await this.createUsers();
    await this.createContacts();
    await this.createAssets();
    await this.createFiles();
    this.logger.log('Done creating fixtures.');
  }

  private async createUsers(): Promise<void> {
    for (const user of Object.values(fixtures.users)) {
      this.logger.log(`Creating user`, { email: user.email });
      await this.userRepo.delete(user.id);
      const newUser = await this.userRepo.create({ ...user, oidcId: user.id });

      if (user.isAdmin) {
        await this.userRepo.update(newUser.id, { ...newUser, isAdmin: true });
      }
    }
  }

  private async createContacts(): Promise<void> {
    const createContact = async (contact: Contact): Promise<void> => {
      await this.prismaService.assetContact.deleteMany({ where: { contactId: contact.id } });
      await this.contactRepo.delete(contact.id);
      const createdContact = await this.contactRepo.create(contact);
      await this.prismaService.contact.update({
        where: { contactId: createdContact.id },
        data: { contactId: contact.id },
      });
    };
    for (const contact of Object.values(fixtures.contacts)) {
      this.logger.log(`Creating contact`, { name: contact.name });
      await createContact(contact);
    }
  }

  private async createAssets(): Promise<void> {
    const createAsset = async (asset: Asset): Promise<void> => {
      await this.assetRepo.delete(asset.id);
      const { id: createdAssetId } = await this.assetRepo.create({
        ...asset,
        creatorId: asset.creatorId ?? fixtures.users.editor.id,
        parent: asset.parent?.id ?? null,
        siblings: asset.siblings.map((it) => it.id),
        geometries: [],
      });

      // We can't set the asset's id when creating it, so we simply change the generated id.
      await this.prismaService.asset.update({ where: { assetId: createdAssetId }, data: { assetId: asset.id } });

      // Write the asset to Elasticsearch.
      await this.assetSearchService.register(asset);

      // Remove the creator if the fixture doesn't specify one.
      // We need to pass a default value to `assetRepo.create`, which will be removed here.
      if (asset.creatorId === null) {
        await this.prismaService.asset.update({
          select: { assetId: true },
          where: { assetId: asset.id },
          data: { creator: { disconnect: true } },
        });
      }

      if (asset.workflowStatus !== WorkflowStatus.Draft) {
        // If the asset has a workflowStatus that is not draft, then we need to register a change for its workflow.
        const workflow = await this.workflowService.find(asset.id);
        const newStatus =
          asset.workflowStatus === WorkflowStatus.Published ? WorkflowStatus.Reviewed : asset.workflowStatus;
        await this.workflowService.addChange(
          workflow,
          {
            status: newStatus,
            hasRequestedChanges: false,
            assigneeId: null,
            comment: null,
          },
          fixtures.users.reviewer.id,
        );

        // We can't directly jump to `WorkflowStatus.Published`.
        // That status requires `WorkflowStatus.Reviewed`, from where on the actual publish can happen.
        if (asset.workflowStatus === WorkflowStatus.Published) {
          await this.workflowService.publish(
            workflow,
            fixtures.users.publisher.id,
            convert<WorkflowPublishData, WorkflowPublishDataSchema>(WorkflowPublishDataSchema, { comment: null }),
          );
        }
      }
    };

    for (const asset of Object.values(fixtures.assets)) {
      this.logger.log(`Creating asset`, { id: asset.id });
      await createAsset(asset);
    }
  }

  private async createFiles(): Promise<void> {
    const createFile = async (file: AssetFile, asset: Asset): Promise<void> => {
      const wasDeleted = await this.fileService.delete({ assetId: asset.id, id: file.id });
      if (!wasDeleted) {
        const doesFileExist =
          null !==
          (await this.prismaService.file.findFirst({
            where: { id: file.id },
            select: { id: true },
          }));
        if (doesFileExist) {
          this.logger.log(`Old file could not be deleted, cleaning it up manually.`, { file: file.name });
          await this.prismaService.assetFile.deleteMany({ where: { fileId: file.id } });
          await this.prismaService.file.delete({ where: { id: file.id } });
        }
      }
      const createdFile = await this.fileService.create({
        ...file,
        name: file.alias ?? file.name,
        content: await loadFixtureFile(asset, file.alias ?? file.name),
        mediaType: 'application/pdf',
        assetId: asset.id,
        user: fixtures.users.editor,
      });
      if (createdFile.name != file.name) {
        this.logger.warn('Stored file name does not match the result expected for this fixture.', {
          file: file.name,
          expected: file.name,
          actual: createdFile.name,
        });
      }
      if (createdFile.alias != file.alias) {
        this.logger.warn('Stored file alias does not match the result expected for this fixture.', {
          file: file.name,
          expected: file.alias,
          actual: createdFile.alias,
        });
      }

      if (createdFile.fileProcessingState != FileProcessingState.WillNotBeProcessed) {
        this.logger.log('Waiting for file to be processed...', { file: file.name });
        while (true) {
          const currentFile = await this.fileRepo.find({ assetId: asset.id, id: createdFile.id });
          if (currentFile == null) {
            this.logger.error('File could not be found in database (it will remain in an invalid state).', {
              file: file.name,
            });

            // Stop setup as we cannot proceed with the file missing.
            return;
          }
          if (currentFile.fileProcessingState === FileProcessingState.Error) {
            this.logger.error('File processing has failed (file will remain in an invalid state).', {
              file: file.name,
            });

            // Continue setup so that the file is stored with the correct id.
            break;
          }
          if (
            currentFile.fileProcessingState === FileProcessingState.Success &&
            currentFile.fileProcessingStage === FileProcessingStage.Extraction
          ) {
            this.logger.log('File processing has succeeded.', {
              file: file.name,
            });
            break;
          }
          await sleep(1000);
        }
      }

      const processedFile = await this.fileRepo.find({ assetId: asset.id, id: createdFile.id });
      if (processedFile === null) {
        this.logger.error('File could not be found after processing (file will remain in an invalid state).', {
          file: file.name,
        });
        return;
      }

      if (file.size !== processedFile.size) {
        // This check might make trouble due to some small changes in how the file is stored or processed.
        // If it ever does, consider adding a threshold to this check.
        this.logger.warn('Stored file size does not match the result expected for this fixture.', {
          file: file.name,
          expected: file.size,
          actual: processedFile.size,
        });
      }
      if (file.fileProcessingState !== processedFile.fileProcessingState) {
        this.logger.warn('Stored processing state does not match the result expected for this fixture.', {
          file: file.name,
          expected: file.fileProcessingState,
          actual: processedFile.fileProcessingState,
        });
      }
      if (file.fileProcessingStage !== processedFile.fileProcessingStage) {
        this.logger.warn('Stored processing stage does not match the result expected for this fixture.', {
          file: file.name,
          expected: file.fileProcessingStage,
          actual: processedFile.fileProcessingStage,
        });
      }
      if (!deepEquals(file.pageRangeClassifications, processedFile.pageRangeClassifications)) {
        this.logger.warn('Stored page classifications do not match the result expected for this fixture.', {
          file: file.name,
          expected: file.pageRangeClassifications,
          actual: processedFile.pageRangeClassifications,
        });
      }

      // Update the created file so it matches the fixture.
      await this.prismaService.file.update({
        select: { id: true },
        where: { id: createdFile.id },
        data: {
          id: file.id,
          lastModifiedAt: file.lastModifiedAt,

          // The page count is randomly generated when spoofing the OCR, so we need to set it manually here.
          pageCount: file.pageCount,
        },
      });
    };

    await Promise.all(
      Object.values(fixtures.assets).flatMap((asset) =>
        asset.files.map(async (file) => {
          this.logger.log('Creating file', { file: file.name });
          await createFile(file, asset);
        }),
      ),
    );
  }
}

export const loadFixtureFile = async (asset: Asset, name: string): Promise<Buffer> => {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const fsSync = await import('node:fs');

  const basePath = path.join(__dirname, '../../../../libs/shared/v2/src/lib/fixtures/files');
  let filePath = path.join(basePath, `${asset.id}`, name);

  if (!fsSync.existsSync(filePath)) {
    filePath = path.join(basePath, name);
  }
  if (!fsSync.existsSync(filePath)) {
    throw new Error(`File fixture does not exist: ${asset.id}/${name}`);
  }

  return await fs.readFile(filePath);
};

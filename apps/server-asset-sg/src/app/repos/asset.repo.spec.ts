import * as Option from 'fp-ts/Option'

import { setupDB } from '../../../../../test/setup-db';
import { fakeAssetPatch, fakeUser } from '../asset-edit/asset-edit.fake';
import { PrismaService } from '../prisma/prisma.service';

import { AssetRepo } from './asset.repo';


describe(AssetRepo, () => {
    const prisma = new PrismaService()
    const repo = new AssetRepo(prisma);

    beforeAll(async () => {
        await setupDB(prisma);
    });

    beforeEach(async () => {
        await prisma.manCatLabelRef.deleteMany();
        await prisma.assetContact.deleteMany();
        await prisma.id.deleteMany();
        await prisma.typeNatRel.deleteMany();
        await prisma.statusWork.deleteMany();
        await prisma.asset.deleteMany();
        await prisma.internalUse.deleteMany();
        await prisma.publicUse.deleteMany();
    })

    describe('find', () => {
        it('returns `null` when searching for a non-existent record', async () => {
            // When
            const asset = await repo.find(1);

            // Then
            expect(asset).toBeNull();
        })

        it('returns the record associated with a specific id', async () => {
            // Given
            const user = fakeUser();
            const patch = fakeAssetPatch();
            const expected = await repo.create({ patch, user });
            
            // When
            const actual = await repo.find(expected.assetId);
            
            // Then
            expect(actual).not.toBeNull();
            expect(actual).toEqual(expected);
        })
    })

    describe('create', () => {
        it('inserts a new record', async () => {
            // Given
            const user = fakeUser();
            const patch = fakeAssetPatch();

            // When
            const record = await repo.create({ patch, user });

            // Then
            expect(record.titlePublic).toEqual(patch.titlePublic);
            expect(record.titleOriginal).toEqual(patch.titleOriginal);
            expect(record.createDate).toEqual(patch.createDate);
            expect(record.receiptDate).toEqual(patch.receiptDate);
            expect(record.lastProcessedDate.getTime()).toBeLessThan(new Date().getTime())
            expect(record.processor).toEqual(user.email);
            expect(record.publicUse).toEqual(patch.publicUse);
            expect(record.internalUse).toEqual(patch.internalUse);
            expect(record.assetKindItemCode).toEqual(patch.assetKindItemCode);
            expect(record.assetFormatItemCode).toEqual(patch.assetFormatItemCode);
            expect(record.languageItemCode).toEqual(patch.languageItemCode);
            expect(record.isNatRel).toEqual(patch.isNatRel);
            expect(record.sgsId).toBeNull();
            expect(record.geolDataInfo).toEqual(null);
            expect(record.geolContactDataInfo).toEqual(null);
            expect(record.geolAuxDataInfo).toBeNull();
            expect(record.municipality).toBeNull();
            expect(record.ids).toEqual(patch.ids);
            expect(record.assetContacts).toEqual(patch.assetContacts);
            expect(record.manCatLabelRefs).toEqual(patch.manCatLabelRefs);
            expect(record.assetFormatCompositions).toEqual([]);
            expect(record.typeNatRels).toEqual(patch.typeNatRels);
            expect(record.assetMain).toEqual(Option.none);
            expect(record.subordinateAssets).toEqual([]);
            expect(record.siblingXAssets).toEqual([]);
            expect(record.siblingYAssets).toEqual([]);
            expect(record.statusWorks).toHaveLength(1);
            expect(record.statusWorks[0].statusWorkItemCode).toEqual('initiateAsset')
            expect(record.statusWorks[0].statusWorkDate.getTime()).toBeLessThan(new Date().getTime())
            expect(record.assetFiles).toEqual([]);
        })
    })

    describe('update', () => {
        it('returns `null` when updating a non-existent record', async () => {
            // Given
            const user = fakeUser();
            const patch = fakeAssetPatch();

            // When
            const asset = await repo.update(1, { user, patch });

            // Then
            expect(asset).toBeNull();
        })

        it('should update the fields of an existing record', async () => {
            // Given
            const record = await repo.create({ patch: fakeAssetPatch(), user: fakeUser() });
            const user = fakeUser();
            const patch = fakeAssetPatch();

            // When
            const updated = await repo.update(record.assetId, { patch, user });

            // Then
            expect(updated.assetId).toEqual(record.assetId)
            expect(updated.titlePublic).toEqual(patch.titlePublic);
            expect(updated.titleOriginal).toEqual(patch.titleOriginal);
            expect(updated.createDate).toEqual(patch.createDate);
            expect(updated.receiptDate).toEqual(patch.receiptDate);
            expect(updated.lastProcessedDate.getTime()).toBeLessThan(new Date().getTime())
            expect(updated.processor).toEqual(user.email);
            expect(updated.publicUse).toEqual(patch.publicUse);
            expect(updated.internalUse).toEqual(patch.internalUse);
            expect(updated.assetKindItemCode).toEqual(patch.assetKindItemCode);
            expect(updated.assetFormatItemCode).toEqual(patch.assetFormatItemCode);
            expect(updated.languageItemCode).toEqual(patch.languageItemCode);
            expect(updated.isNatRel).toEqual(patch.isNatRel);
            expect(updated.sgsId).toBeNull();
            expect(updated.geolDataInfo).toEqual(null);
            expect(updated.geolContactDataInfo).toEqual(null);
            expect(updated.geolAuxDataInfo).toBeNull();
            expect(updated.municipality).toBeNull();
            expect(updated.ids).toEqual(patch.ids);
            expect(updated.assetContacts).toEqual(patch.assetContacts);
            expect(updated.manCatLabelRefs).toEqual(patch.manCatLabelRefs);
            expect(updated.assetFormatCompositions).toEqual([]);
            expect(updated.typeNatRels).toEqual(patch.typeNatRels);
            expect(updated.assetMain).toEqual(Option.none);
            expect(updated.subordinateAssets).toEqual([]);
            expect(updated.siblingXAssets).toEqual([]);
            expect(updated.siblingYAssets).toEqual([]);
            expect(updated.statusWorks).toHaveLength(1);
            expect(updated.statusWorks[0].statusWorkItemCode).toEqual('initiateAsset')
            expect(updated.statusWorks[0].statusWorkDate.getTime()).toBeLessThan(new Date().getTime())
            expect(updated.assetFiles).toEqual([]);
        })
    })

    describe('delete', () => {
        it('returns `false` when deleting an non-existent record', async () => {
            // When
            const isOk = await repo.delete(1);

            // Then
            expect(isOk).toEqual(false);
        })

        it('removes a record and its relations from the database', async () => {
            // Given
            const record = await repo.create({ patch: fakeAssetPatch(), user: fakeUser() });

            // When
            const isOk = await repo.delete(record.assetId);

            // Then
            expect(isOk).toEqual(true);

            const assetCount = await prisma.asset.count({ where: { assetId: record.assetId } });
            expect(assetCount).toEqual(0);

            const internalUseCount = await prisma.internalUse.count({
                where: {
                    Asset: { none: {} },
                },
            });
            expect(internalUseCount).toEqual(0);

            const publicUseCount = await prisma.publicUse.count({
                where: {
                    Asset: { none: {} },
                },
            });
            expect(publicUseCount).toEqual(0);

        })
    })
})

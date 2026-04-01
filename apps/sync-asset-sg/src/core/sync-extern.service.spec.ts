import { SyncConfig } from './config';
import { SyncExternService } from './sync-extern.service';

// Suppress log output during tests
jest.mock('./log', () => ({
  log: jest.fn(),
}));

const config: SyncConfig = {
  mode: 'extern',
  syncAssignee: 'test@test.com',
  source: { connectionString: 'source', allowedWorkgroupIds: [] },
  destination: { connectionString: 'destination', allowedWorkgroupIds: [] },
};

function createMockPrisma(overrides: Record<string, unknown> = {}) {
  return {
    asset: { findMany: jest.fn().mockResolvedValue([]), update: jest.fn().mockResolvedValue({}) },
    assetXAssetY: { findMany: jest.fn().mockResolvedValue([]) },
    assetSynchronization: { findMany: jest.fn().mockResolvedValue([]) },
    ...overrides,
  } as any;
}

/**
 * Helper to invoke the private `createSiblings` method on the service.
 * Sets up `assetsToSync` on the instance and calls the method with the given synchronization records.
 */
async function callCreateSiblings(setup: {
  assetsToSync: Array<{
    originalAssetId: number;
    asset: { assetMainId: number | null };
    children: Array<{ assetId: number }>;
  }>;
  assetSynchronizations: Array<{ assetId: number; originalAssetId: number; originalSgsId: number | null }>;
  existingSiblings: Array<{ assetXId: number; assetYId: number }>;
  allSynchronisations: Array<{ assetId: number; originalAssetId: number; originalSgsId: number | null }>;
  assetWorkgroups: Array<{ assetId: number; workgroupId: number }>;
}) {
  const sourcePrisma = createMockPrisma({
    assetXAssetY: { findMany: jest.fn().mockResolvedValue(setup.existingSiblings) },
  });
  const destinationPrisma = createMockPrisma({
    assetSynchronization: { findMany: jest.fn().mockResolvedValue(setup.allSynchronisations) },
    asset: {
      findMany: jest.fn().mockResolvedValue(setup.assetWorkgroups),
      update: jest.fn().mockResolvedValue({}),
    },
  });

  const service = new SyncExternService(sourcePrisma, destinationPrisma, config);

  // Populate assetsToSync
  const assetsToSyncInternal: any[] = (service as any).assetsToSync;
  for (const a of setup.assetsToSync) {
    assetsToSyncInternal.push(a);
  }

  await (service as any).createSiblings(setup.assetSynchronizations);

  return { sourcePrisma, destinationPrisma };
}

describe('SyncExternService.createSiblings', () => {
  describe('same-workgroup references', () => {
    it('should create sibling links when both assets are in the same workgroup', async () => {
      const { destinationPrisma } = await callCreateSiblings({
        assetsToSync: [{ originalAssetId: 100, asset: { assetMainId: null }, children: [] }],
        assetSynchronizations: [{ assetId: 1, originalAssetId: 100, originalSgsId: null }],
        existingSiblings: [{ assetXId: 100, assetYId: 200 }],
        allSynchronisations: [
          { assetId: 1, originalAssetId: 100, originalSgsId: null },
          { assetId: 2, originalAssetId: 200, originalSgsId: null },
        ],
        assetWorkgroups: [
          { assetId: 1, workgroupId: 10 },
          { assetId: 2, workgroupId: 10 }, // same workgroup
        ],
      });

      expect(destinationPrisma.asset.update).toHaveBeenCalledWith({
        where: { assetId: 1 },
        data: {
          assetMainId: undefined,
          siblingXAssets: { create: [{ assetYId: 2 }] },
        },
      });
    });

    it('should set assetMainId when parent is in the same workgroup', async () => {
      const { destinationPrisma } = await callCreateSiblings({
        assetsToSync: [{ originalAssetId: 100, asset: { assetMainId: 200 }, children: [] }],
        assetSynchronizations: [{ assetId: 1, originalAssetId: 100, originalSgsId: null }],
        existingSiblings: [],
        allSynchronisations: [
          { assetId: 1, originalAssetId: 100, originalSgsId: null },
          { assetId: 2, originalAssetId: 200, originalSgsId: null },
        ],
        assetWorkgroups: [
          { assetId: 1, workgroupId: 10 },
          { assetId: 2, workgroupId: 10 }, // same workgroup
        ],
      });

      expect(destinationPrisma.asset.update).toHaveBeenCalledWith({
        where: { assetId: 1 },
        data: {
          assetMainId: 2,
          siblingXAssets: { create: [] },
        },
      });
    });

    it('should set assetMainId on children in the same workgroup', async () => {
      const { destinationPrisma } = await callCreateSiblings({
        assetsToSync: [{ originalAssetId: 100, asset: { assetMainId: null }, children: [{ assetId: 200 }] }],
        assetSynchronizations: [{ assetId: 1, originalAssetId: 100, originalSgsId: null }],
        existingSiblings: [],
        allSynchronisations: [
          { assetId: 1, originalAssetId: 100, originalSgsId: null },
          { assetId: 2, originalAssetId: 200, originalSgsId: null },
        ],
        assetWorkgroups: [
          { assetId: 1, workgroupId: 10 },
          { assetId: 2, workgroupId: 10 },
        ],
      });

      // First call: update the asset itself; second call: set parent on child
      expect(destinationPrisma.asset.update).toHaveBeenCalledTimes(2);
      expect(destinationPrisma.asset.update).toHaveBeenCalledWith({
        where: { assetId: 2 },
        data: { assetMainId: 1 },
      });
    });
  });

  describe('cross-workgroup references', () => {
    it('should skip sibling links when assets are in different workgroups', async () => {
      const { destinationPrisma } = await callCreateSiblings({
        assetsToSync: [{ originalAssetId: 100, asset: { assetMainId: null }, children: [] }],
        assetSynchronizations: [{ assetId: 1, originalAssetId: 100, originalSgsId: null }],
        existingSiblings: [{ assetXId: 100, assetYId: 200 }],
        allSynchronisations: [
          { assetId: 1, originalAssetId: 100, originalSgsId: null },
          { assetId: 2, originalAssetId: 200, originalSgsId: null },
        ],
        assetWorkgroups: [
          { assetId: 1, workgroupId: 10 },
          { assetId: 2, workgroupId: 20 }, // different workgroup
        ],
      });

      expect(destinationPrisma.asset.update).toHaveBeenCalledWith({
        where: { assetId: 1 },
        data: {
          assetMainId: undefined,
          siblingXAssets: { create: [] }, // no siblings created
        },
      });
    });

    it('should not set assetMainId when parent is in a different workgroup', async () => {
      const { destinationPrisma } = await callCreateSiblings({
        assetsToSync: [{ originalAssetId: 100, asset: { assetMainId: 200 }, children: [] }],
        assetSynchronizations: [{ assetId: 1, originalAssetId: 100, originalSgsId: null }],
        existingSiblings: [],
        allSynchronisations: [
          { assetId: 1, originalAssetId: 100, originalSgsId: null },
          { assetId: 2, originalAssetId: 200, originalSgsId: null },
        ],
        assetWorkgroups: [
          { assetId: 1, workgroupId: 10 },
          { assetId: 2, workgroupId: 20 }, // different workgroup
        ],
      });

      expect(destinationPrisma.asset.update).toHaveBeenCalledWith({
        where: { assetId: 1 },
        data: {
          assetMainId: null, // nulled out instead of cross-workgroup reference
          siblingXAssets: { create: [] },
        },
      });
    });

    it('should skip child assignment when child is in a different workgroup', async () => {
      const { destinationPrisma } = await callCreateSiblings({
        assetsToSync: [{ originalAssetId: 100, asset: { assetMainId: null }, children: [{ assetId: 200 }] }],
        assetSynchronizations: [{ assetId: 1, originalAssetId: 100, originalSgsId: null }],
        existingSiblings: [],
        allSynchronisations: [
          { assetId: 1, originalAssetId: 100, originalSgsId: null },
          { assetId: 2, originalAssetId: 200, originalSgsId: null },
        ],
        assetWorkgroups: [
          { assetId: 1, workgroupId: 10 },
          { assetId: 2, workgroupId: 20 }, // different workgroup
        ],
      });

      // Only one update call (for the asset itself), child update is skipped
      expect(destinationPrisma.asset.update).toHaveBeenCalledTimes(1);
      expect(destinationPrisma.asset.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ where: { assetId: 2 } }),
      );
    });
  });

  describe('mixed workgroup scenario', () => {
    it('should keep same-workgroup siblings and skip cross-workgroup ones', async () => {
      const { destinationPrisma } = await callCreateSiblings({
        assetsToSync: [{ originalAssetId: 100, asset: { assetMainId: null }, children: [] }],
        assetSynchronizations: [{ assetId: 1, originalAssetId: 100, originalSgsId: null }],
        existingSiblings: [
          { assetXId: 100, assetYId: 200 },
          { assetXId: 100, assetYId: 300 },
          { assetXId: 100, assetYId: 400 },
        ],
        allSynchronisations: [
          { assetId: 1, originalAssetId: 100, originalSgsId: null },
          { assetId: 2, originalAssetId: 200, originalSgsId: null },
          { assetId: 3, originalAssetId: 300, originalSgsId: null },
          { assetId: 4, originalAssetId: 400, originalSgsId: null },
        ],
        assetWorkgroups: [
          { assetId: 1, workgroupId: 10 },
          { assetId: 2, workgroupId: 10 }, // same
          { assetId: 3, workgroupId: 20 }, // different
          { assetId: 4, workgroupId: 10 }, // same
        ],
      });

      expect(destinationPrisma.asset.update).toHaveBeenCalledWith({
        where: { assetId: 1 },
        data: {
          assetMainId: undefined,
          siblingXAssets: { create: [{ assetYId: 2 }, { assetYId: 4 }] }, // asset 3 skipped
        },
      });
    });
  });
});

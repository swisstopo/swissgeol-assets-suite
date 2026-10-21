import { Prisma } from '@prisma/client';
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
  assetSynchronizations: Array<{ assetId: number | null; originalAssetId: number; originalSgsId: number | null }>;
  existingSiblings: Array<{ assetXId: number; assetYId: number }>;
  allSynchronisations: Array<{ assetId: number | null; originalAssetId: number; originalSgsId: number | null }>;
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
  (service as any).destinationTx = destinationPrisma;

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

  describe('deleted synchronization targets (null assetId)', () => {
    const syncedAndDeleted = [
      { assetId: 1, originalAssetId: 100, originalSgsId: null },
      { assetId: null, originalAssetId: 200, originalSgsId: null },
    ];

    it.each([
      {
        name: 'should ignore siblings whose synchronization record has a null assetId',
        assetMainId: null,
        children: [],
        existingSiblings: [{ assetXId: 100, assetYId: 200 }],
        expectedData: { assetMainId: undefined, siblingXAssets: { create: [] } },
      },
      {
        name: 'should not set a parent whose synchronization record has a null assetId',
        assetMainId: 200,
        children: [],
        existingSiblings: [],
        expectedData: { assetMainId: null, siblingXAssets: { create: [] } },
      },
      {
        name: 'should skip child assignment when the child synchronization record has a null assetId',
        assetMainId: null,
        children: [{ assetId: 200 }],
        existingSiblings: [],
        expectedData: { assetMainId: undefined, siblingXAssets: { create: [] } },
      },
    ])('$name', async ({ assetMainId, children, existingSiblings, expectedData }) => {
      const { destinationPrisma } = await callCreateSiblings({
        assetsToSync: [{ originalAssetId: 100, asset: { assetMainId }, children }],
        assetSynchronizations: [syncedAndDeleted[0]],
        existingSiblings,
        allSynchronisations: syncedAndDeleted,
        assetWorkgroups: [{ assetId: 1, workgroupId: 10 }],
      });

      expect(destinationPrisma.asset.update).toHaveBeenCalledTimes(1);
      expect(destinationPrisma.asset.update).toHaveBeenCalledWith({ where: { assetId: 1 }, data: expectedData });
      expect(destinationPrisma.asset.update).not.toHaveBeenCalledWith(
        expect.objectContaining({ where: { assetId: null } }),
      );
    });
  });
});

function buildSourceAsset(originalAssetId: number) {
  return {
    assetId: originalAssetId,
    sgsId: null,
    titlePublic: `asset-${originalAssetId}`,
    assetMainId: null,
    files: [],
    assetContacts: [],
    manCatLabelRefs: [],
    typeNatRels: [],
    ids: [],
    assetLanguages: [],
    subordinateAssets: [],
    workgroup: { name: 'wg' },
    workflow: { review: { id: 1 } },
  };
}

async function callInit(setup: {
  alreadySynced: Array<{ originalAssetId: number; assetId?: number | null }>;
  sourceAssets: Array<ReturnType<typeof buildSourceAsset>>;
}) {
  const sourcePrisma = createMockPrisma({
    asset: { findMany: jest.fn().mockResolvedValue(setup.sourceAssets) },
    $queryRawUnsafe: jest.fn().mockResolvedValue([]),
  });
  const destinationPrisma = createMockPrisma({
    assetUser: { findFirstOrThrow: jest.fn().mockResolvedValue({ id: 'sync-user-id' }) },
    contact: { findMany: jest.fn().mockResolvedValue([]) },
    assetSynchronization: { findMany: jest.fn().mockResolvedValue(setup.alreadySynced) },
  });

  const service = new SyncExternService(sourcePrisma, destinationPrisma, config);
  await (service as any).init();

  return { service, sourcePrisma, destinationPrisma };
}

describe('SyncExternService.init eligibility', () => {
  it('should select a source asset that has no synchronization record', async () => {
    const { service, sourcePrisma } = await callInit({
      alreadySynced: [],
      sourceAssets: [buildSourceAsset(300)],
    });

    expect(sourcePrisma.asset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          assetId: { notIn: [] },
          workflow: { status: 'Reviewed' },
        }),
      }),
    );
    expect((service as any).assetsToSync).toHaveLength(1);
    expect((service as any).assetsToSync[0].originalAssetId).toBe(300);
  });

  it('should keep excluding a source asset whose retained synchronization record has a null assetId', async () => {
    const { sourcePrisma } = await callInit({
      alreadySynced: [{ originalAssetId: 100, assetId: null }],
      sourceAssets: [],
    });

    expect(sourcePrisma.asset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ assetId: { notIn: [100] } }),
      }),
    );
  });
});

const SYNC_TRANSACTION_TIMEOUT_MS = 3 * 60 * 60 * 1_000;

function createTransactionService(txClient: unknown) {
  const destinationPrisma = createMockPrisma({
    workgroup: { findFirstOrThrow: jest.fn().mockResolvedValue({ id: 1 }) },
    assetSynchronization: { createManyAndReturn: jest.fn() },
    $executeRaw: jest.fn(),
    $transaction: jest.fn((cb: (tx: unknown) => Promise<unknown>, _options: unknown) => cb(txClient)),
  });
  const service = new SyncExternService(createMockPrisma(), destinationPrisma, config);

  jest.spyOn(service as any, 'init').mockResolvedValue(undefined);
  jest.spyOn(service as any, 'synchronizeAsset').mockResolvedValue(undefined);
  jest.spyOn(service as any, 'createWorkflowForAsset').mockResolvedValue(undefined);
  jest.spyOn(service as any, 'createSiblings').mockResolvedValue(undefined);

  (service as any).assetsToSync.push({ originalAssetId: 300 });
  (service as any).newAssetToOriginalAsset.set(1, { originalAssetId: 300, originalSgsId: null });
  (service as any).relationSqls.ids.push(Prisma.sql`(1, 'id', 'description')`);

  return { service, destinationPrisma };
}

function expectNoWritesOnDestinationClient(destinationPrisma: any) {
  expect(destinationPrisma.assetSynchronization.createManyAndReturn).not.toHaveBeenCalled();
  expect(destinationPrisma.$executeRaw).not.toHaveBeenCalled();
}

describe('SyncExternService destination client', () => {
  it('should throw on a write without an active transaction and not call the ordinary client', async () => {
    const { service, destinationPrisma } = createTransactionService({});

    await expect((service as any).createAssetSynchronizationRecords()).rejects.toThrow(
      'Synchronization write attempted without an active transaction.',
    );

    expectNoWritesOnDestinationClient(destinationPrisma);
  });
});

describe('SyncExternService.syncExternalToInternal transaction client usage', () => {
  it('should open the transaction with a three hour timeout', async () => {
    const txClient = {
      assetSynchronization: { createManyAndReturn: jest.fn().mockResolvedValue([]) },
      $executeRaw: jest.fn().mockResolvedValue(1),
    };
    const { service, destinationPrisma } = createTransactionService(txClient);

    await service.syncExternalToInternal();

    expect(destinationPrisma.$transaction).toHaveBeenCalledTimes(1);
    expect(destinationPrisma.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ timeout: SYNC_TRANSACTION_TIMEOUT_MS }),
    );
  });

  it('should write through the transaction client and clear it after a successful run', async () => {
    const txClient = {
      assetSynchronization: { createManyAndReturn: jest.fn().mockResolvedValue([]) },
      $executeRaw: jest.fn().mockResolvedValue(1),
    };
    const { service, destinationPrisma } = createTransactionService(txClient);

    await service.syncExternalToInternal();

    expect(txClient.assetSynchronization.createManyAndReturn).toHaveBeenCalledTimes(1);
    expect(txClient.$executeRaw).toHaveBeenCalledTimes(1);
    expectNoWritesOnDestinationClient(destinationPrisma);
    expect((service as any).destinationTx).toBeNull();
  });

  it('should write through the transaction client in order, propagate a failure, and clear the client', async () => {
    const txClient = {
      assetSynchronization: { createManyAndReturn: jest.fn().mockResolvedValue([]) },
      $executeRaw: jest.fn().mockRejectedValue(new Error('relation insert failed')),
    };
    const { service, destinationPrisma } = createTransactionService(txClient);

    await expect(service.syncExternalToInternal()).rejects.toThrow('relation insert failed');

    expect(txClient.assetSynchronization.createManyAndReturn).toHaveBeenCalledTimes(1);
    expect(txClient.$executeRaw).toHaveBeenCalled();
    const markerOrder = txClient.assetSynchronization.createManyAndReturn.mock.invocationCallOrder[0];
    const relationOrder = txClient.$executeRaw.mock.invocationCallOrder[0];
    expect(markerOrder).toBeLessThan(relationOrder);
    expectNoWritesOnDestinationClient(destinationPrisma);
    expect((service as any).destinationTx).toBeNull();
  });
});

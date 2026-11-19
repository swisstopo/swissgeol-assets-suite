// The reducer imports the `@asset-sg/client-shared` barrel, the OpenLayers-based map controller and
// OpenLayers geometry helpers, none of which Jest can load. See `viewer-controller.service.spec.ts`.
jest.mock('@asset-sg/client-shared', () => {
  const store = jest.requireActual('@ngrx/store');
  return {
    appSharedStateActions: {
      removeAsset: store.createAction('[Asset Shared] Remove Asset', store.props()),
      updateAsset: store.createAction('[Asset Shared] Update Asset', store.props()),
      updateAssetWorkflow: store.createAction('[Asset Shared] Update Asset Workflow', store.props()),
    },
  };
});
jest.mock('../../components/map/map-controller', () => ({
  DEFAULT_MAP_POSITION: { x: 2660000, y: 1190000, z: 8 },
}));
jest.mock('ol/extent', () => ({ getCenter: jest.fn(() => [0, 0]) }));
jest.mock('ol/geom', () => ({ LineString: class {}, Polygon: class {} }));

import { appSharedStateActions } from '@asset-sg/client-shared';
import {
  Asset,
  GeometryAccessType,
  GeometryDetail,
  GeometryType,
  MapGeometry,
  WorkflowStatus,
} from '@asset-sg/shared/v2';
import { setGeometries } from './asset-search.actions';
import { assetSearchReducer } from './asset-search.reducer';

describe('assetSearchReducer', () => {
  const makeGeometry = (id: string, assetId: number): MapGeometry =>
    ({
      id,
      assetId,
      type: GeometryType.Point,
      accessType: GeometryAccessType.Public,
      center: { x: 1, y: 2 },
      workflowStatus: WorkflowStatus.Draft,
      hasRequestedChanges: false,
    }) as MapGeometry;

  const initial = () =>
    assetSearchReducer(undefined, setGeometries({ geometries: [makeGeometry('l1', 1), makeGeometry('l2', 2)] }));

  describe('updateAsset', () => {
    it('takes the workflow fields and the access type from the saved asset', () => {
      const asset = {
        id: 1,
        isPublic: false,
        workflowStatus: WorkflowStatus.InReview,
        hasRequestedChanges: true,
      } as Asset;
      const point = { id: 'l1', type: GeometryType.Point, coordinates: [{ x: 1, y: 2 }] } as unknown as GeometryDetail;

      const state = assetSearchReducer(initial(), appSharedStateActions.updateAsset({ asset, geometries: [point] }));

      expect(state.geometries.find((it) => it.assetId === 1)).toMatchObject({
        accessType: GeometryAccessType.Internal,
        workflowStatus: WorkflowStatus.InReview,
        hasRequestedChanges: true,
      });
    });
  });

  describe('updateAssetWorkflow', () => {
    const update = (assetId: number, workflowStatus: WorkflowStatus, hasRequestedChanges: boolean) =>
      appSharedStateActions.updateAssetWorkflow({ assetId, workflowStatus, hasRequestedChanges });

    it('patches only the workflow fields of the matching asset', () => {
      const before = initial();

      const state = assetSearchReducer(before, update(1, WorkflowStatus.InReview, true));

      expect(state.geometries[0]).toEqual({
        ...before.geometries[0],
        workflowStatus: WorkflowStatus.InReview,
        hasRequestedChanges: true,
      });
      expect(state.geometries[1]).toBe(before.geometries[1]);
    });

    it('returns the same state if the values are unchanged or the asset is unknown', () => {
      const before = initial();

      expect(assetSearchReducer(before, update(1, WorkflowStatus.Draft, false))).toBe(before);
      expect(assetSearchReducer(before, update(99, WorkflowStatus.Published, false))).toBe(before);
    });
  });
});

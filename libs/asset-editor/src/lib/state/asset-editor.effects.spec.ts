// The `@asset-sg/client-shared` barrel and the viewer pull in OpenLayers (ESM), which Jest can't load.
jest.mock('@asset-sg/client-shared', () => {
  const store = jest.requireActual('@ngrx/store');
  return {
    appSharedStateActions: {
      setCurrentAsset: store.createAction('[Asset Shared] Set Current Asset', store.props()),
      updateAsset: store.createAction('[Asset Shared] Update Asset', store.props()),
      removeAsset: store.createAction('[Asset Shared] Remove Asset', store.props()),
      updateAssetWorkflow: store.createAction('[Asset Shared] Update Asset Workflow', store.props()),
    },
    fromAppShared: { selectCurrentAsset: () => null },
    LanguageService: class {},
    AlertType: {},
    redirectOnNotFound: () => undefined,
    showAlert: store.createAction('[Alert] Show', store.props()),
  };
});
jest.mock('@asset-sg/asset-viewer', () => ({ AssetSearchService: class {} }));
jest.mock('../services/asset-editor.service', () => ({ AssetEditorService: class {} }));
jest.mock('../services/workflow-api.service', () => ({ WorkflowApiService: class {} }));

import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AssetSearchService } from '@asset-sg/asset-viewer';
import { appSharedStateActions, LanguageService } from '@asset-sg/client-shared';
import { Workflow, WorkflowStatus } from '@asset-sg/shared/v2';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, Observable, of } from 'rxjs';
import { AssetEditorService } from '../services/asset-editor.service';
import { WorkflowApiService } from '../services/workflow-api.service';
import { setWorkflow } from './asset-editor.actions';
import { AssetEditorEffects } from './asset-editor.effects';

describe(AssetEditorEffects, () => {
  const makeWorkflow = (changes: Partial<Workflow>): Workflow =>
    ({ id: 7, status: WorkflowStatus.Draft, hasRequestedChanges: false, ...changes }) as Workflow;

  const makeEffects = (action: ReturnType<typeof setWorkflow>): AssetEditorEffects => {
    TestBed.configureTestingModule({
      providers: [
        AssetEditorEffects,
        provideMockActions((): Observable<unknown> => of(action)),
        provideMockStore(),
        { provide: Router, useValue: {} },
        { provide: LanguageService, useValue: {} },
        { provide: AssetEditorService, useValue: {} },
        { provide: AssetSearchService, useValue: {} },
        { provide: WorkflowApiService, useValue: {} },
        { provide: TranslateService, useValue: {} },
      ],
    });
    return TestBed.inject(AssetEditorEffects);
  };

  it.each([
    [WorkflowStatus.InReview, true],
    [WorkflowStatus.Published, false],
  ])(
    'maps a loaded workflow (%s, requested changes = %s) to updateAssetWorkflow',
    async (status, hasRequestedChanges) => {
      const effects = makeEffects(setWorkflow({ workflow: makeWorkflow({ status, hasRequestedChanges }) }));

      const result = await firstValueFrom(effects.updateAssetWorkflowAfterWorkflowChanged$);

      expect(result).toEqual(
        appSharedStateActions.updateAssetWorkflow({
          assetId: 7,
          workflowStatus: status,
          hasRequestedChanges,
        }),
      );
    },
  );
});

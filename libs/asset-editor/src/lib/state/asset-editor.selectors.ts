import { ordStatusWorkByDateDesc } from '@asset-sg/shared';
import * as RD from '@devexperts/remote-data-ts';
import { createSelector } from '@ngrx/store';
import * as A from 'fp-ts/Array';
import { flow, pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';

import { AssetEditDetailVM } from '../models';

import { AppStateWithAssetEditor } from './asset-editor.reducer';

const assetEditorFeature = (state: AppStateWithAssetEditor) => state.assetEditor;

export const selectRDAssetEditDetail = createSelector(assetEditorFeature, (state) =>
  pipe(
    state.rdAssetEditDetail,
    RD.map(
      flow(
        O.map(
          (a): AssetEditDetailVM => ({
            ...a,
            ids: pipe(
              a.ids,
              A.map((id) => ({ ...id, idId: O.some(id.idId) }))
            ),
            statusWorks: pipe(a.statusWorks, A.sort(ordStatusWorkByDateDesc)),
          })
        )
      )
    )
  )
);

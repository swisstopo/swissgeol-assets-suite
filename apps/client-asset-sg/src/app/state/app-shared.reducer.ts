import { AppSharedState, appSharedStateActions } from '@asset-sg/client-shared';
import * as RD from '@devexperts/remote-data-ts';
import { createReducer, on } from '@ngrx/store';
import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as R from 'fp-ts/Record';

const initialState: AppSharedState = {
  rdUserProfile: RD.initial,
  rdReferenceData: RD.initial,
  workgroups: [],
  lang: 'de',
  isAnonymousMode: false,
};

export const appSharedStateReducer = createReducer(
  initialState,
  on(
    appSharedStateActions.loadUserProfileResult,
    (state, rdUserProfile): AppSharedState => ({ ...state, rdUserProfile })
  ),
  on(
    appSharedStateActions.setAnonymousMode,
    (state): AppSharedState => ({
      ...state,
      isAnonymousMode: true,
    })
  ),
  on(
    appSharedStateActions.loadReferenceDataResult,
    (state, rdReferenceData): AppSharedState => ({ ...state, rdReferenceData })
  ),
  on(appSharedStateActions.loadWorkgroupsResult, (state, { workgroups }): AppSharedState => ({ ...state, workgroups })),
  on(appSharedStateActions.logout, (): AppSharedState => initialState),
  on(appSharedStateActions.setLang, (state, { lang }): AppSharedState => ({ ...state, lang })),
  on(
    appSharedStateActions.createContactResult,
    (state, contact): AppSharedState => ({
      ...state,
      rdReferenceData: pipe(
        RD.combine(state.rdReferenceData, contact),
        RD.map(([rd, contact]) =>
          RD.success({ ...rd, contacts: pipe(rd.contacts, R.upsertAt(String(contact.id), contact)) })
        ),
        RD.getOrElse(() => state.rdReferenceData)
      ),
    })
  ),
  on(
    appSharedStateActions.editContactResult,
    (state, contact): AppSharedState => ({
      ...state,
      rdReferenceData: pipe(
        RD.combine(state.rdReferenceData, contact),
        RD.map(([rd, contact]) =>
          RD.success({
            ...rd,
            contacts: pipe(
              rd.contacts,
              R.updateAt(String(contact.id), contact),
              O.getOrElse(() => rd.contacts)
            ),
          })
        ),
        RD.getOrElse(() => state.rdReferenceData)
      ),
    })
  )
);

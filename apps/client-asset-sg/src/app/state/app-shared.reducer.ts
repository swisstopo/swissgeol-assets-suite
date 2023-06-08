import * as RD from '@devexperts/remote-data-ts';
import { createReducer, on } from '@ngrx/store';
import { pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as R from 'fp-ts/Record';

import { AppSharedState, appSharedStateActions } from '@asset-sg/client-shared';

const initialState: AppSharedState = {
    rdUserProfile: RD.initial,
    rdReferenceData: RD.initial,
    isPanelOpen: false,
    lang: 'de',
};

export const appSharedStateReducer = createReducer(
    initialState,
    on(
        appSharedStateActions.loadUserProfileResult,
        (state, rdUserProfile): AppSharedState => ({ ...state, rdUserProfile }),
    ),
    on(
        appSharedStateActions.loadReferenceDataResult,
        (state, rdReferenceData): AppSharedState => ({ ...state, rdReferenceData }),
    ),
    on(appSharedStateActions.logout, (): AppSharedState => initialState),
    on(appSharedStateActions.openPanel, (state): AppSharedState => ({ ...state, isPanelOpen: true })),
    on(appSharedStateActions.closePanel, (state): AppSharedState => ({ ...state, isPanelOpen: false })),
    on(appSharedStateActions.setLang, (state, { lang }): AppSharedState => ({ ...state, lang })),
    on(
        appSharedStateActions.createContactResult,
        (state, contact): AppSharedState => ({
            ...state,
            rdReferenceData: pipe(
                RD.combine(state.rdReferenceData, contact),
                RD.map(([rd, contact]) =>
                    RD.success({ ...rd, contacts: pipe(rd.contacts, R.upsertAt(String(contact.id), contact)) }),
                ),
                RD.getOrElse(() => state.rdReferenceData),
            ),
        }),
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
                            O.getOrElse(() => rd.contacts),
                        ),
                    }),
                ),
                RD.getOrElse(() => state.rdReferenceData),
            ),
        }),
    ),
);

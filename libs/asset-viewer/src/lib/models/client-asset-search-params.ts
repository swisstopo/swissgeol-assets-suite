import { CT } from '@asset-sg/core';
import { DateId, LV95, eqLV95 } from '@asset-sg/shared';
import { makeADT, ofType } from '@morphic-ts/adt';
import * as A from 'fp-ts/Array';
import { Eq, fromEquals, struct } from 'fp-ts/Eq';
import { pipe } from 'fp-ts/function';
import { Eq as EqNumber } from 'fp-ts/number';
import * as O from 'fp-ts/Option';
import { Eq as eqString } from 'fp-ts/string';
import * as C from 'io-ts/Codec';
import * as D from 'io-ts/Decoder';

export const RefinementGeomCode = C.fromDecoder(
  D.union(D.literal('Point'), D.literal('Polygon'), D.literal('LineString'), D.literal('None'))
);
export type RefinementGeomCode = C.TypeOf<typeof RefinementGeomCode>;
export const EqRefinementGeomCode: Eq<RefinementGeomCode> = eqString;
export const refinementGeomCodes: RefinementGeomCode[] = ['Point', 'Polygon', 'LineString', 'None'];

const baseClientAssetSearchRefinement = {
  authorId: CT.optionFromUndefinedable(C.number),
  geomCodes: CT.optionFromUndefinedable(C.array(RefinementGeomCode)),
  createDateFrom: CT.optionFromUndefinedable(DateId),
  createDateTo: CT.optionFromUndefinedable(DateId),
  assetKindItemCodes: CT.optionFromUndefinedable(C.array(C.string)),
  usageCodes: CT.optionFromUndefinedable(C.array(C.string)),
  languageItemCodes: CT.optionFromUndefinedable(C.array(C.string)),
  manCatLabelItemCodes: CT.optionFromUndefinedable(C.array(C.string)),
};
const eqBaseClientAssetSearchRefinement = {
  authorId: O.getEq(EqNumber),
  geomCodes: pipe(EqRefinementGeomCode, A.getEq, O.getEq),
  createDateFrom: O.getEq(EqNumber),
  createDateTo: O.getEq(EqNumber),
  assetKindItemCodes: pipe(eqString, A.getEq, O.getEq),
  usageCodes: pipe(eqString, A.getEq, O.getEq),
  languageItemCodes: pipe(eqString, A.getEq, O.getEq),
  manCatLabelItemCodes: pipe(eqString, A.getEq, O.getEq),
};

const _BaseClientAssetSearchRefinement = C.struct(baseClientAssetSearchRefinement);
export type BaseClientAssetSearchRefinement = C.TypeOf<typeof _BaseClientAssetSearchRefinement>;

const emptyBaseClientAssetSearchRefinement: BaseClientAssetSearchRefinement = {
  authorId: O.none,
  geomCodes: O.none,
  createDateFrom: O.none,
  createDateTo: O.none,
  assetKindItemCodes: O.none,
  usageCodes: O.none,
  languageItemCodes: O.none,
  manCatLabelItemCodes: O.none,
};

const ClientAssetSearchTextRefinement = C.struct({
  type: C.literal('text'),
  polygon: CT.optionFromUndefinedable(C.array(LV95)),
  ...baseClientAssetSearchRefinement,
});
export type ClientAssetSearchTextRefinement = C.TypeOf<typeof ClientAssetSearchTextRefinement>;
const EqClientAssetSearchTextRefinement: Eq<ClientAssetSearchTextRefinement> = struct({
  polygon: O.getEq(A.getEq(eqLV95)),
  ...eqBaseClientAssetSearchRefinement,
});
export const emptyClientAssetSearchTextRefinement: ClientAssetSearchTextRefinement = {
  type: 'text',
  ...emptyBaseClientAssetSearchRefinement,
  polygon: O.none,
};

const ClientAssetSearchPolygonRefinement = C.struct({
  type: C.literal('polygon'),
  searchText: CT.optionFromUndefinedable(C.string),
  ...baseClientAssetSearchRefinement,
});
export type ClientAssetSearchPolygonRefinement = C.TypeOf<typeof ClientAssetSearchPolygonRefinement>;
const EqClientAssetSearchPolygonRefinement = struct({
  searchText: O.getEq(eqString),
  ...eqBaseClientAssetSearchRefinement,
});
export const emptyClientAssetSearchPolygonRefinement: ClientAssetSearchPolygonRefinement = {
  type: 'polygon',
  ...emptyBaseClientAssetSearchRefinement,
  searchText: O.none,
};

const ClientAssetSearchParamsLeaderText = C.struct({
  leader: C.literal('text'),
  searchText: C.string,
  refinement: CT.optionFromUndefinedable(ClientAssetSearchTextRefinement),
});
export type ClientAssetSearchParamsLeaderText = C.TypeOf<typeof ClientAssetSearchParamsLeaderText>;
const EqClientAssetSearchParamsLeaderText: Eq<ClientAssetSearchParamsLeaderText> = struct({
  leader: eqString,
  searchText: eqString,
  refinement: O.getEq(EqClientAssetSearchTextRefinement),
});

const ClientAssetSearchParamsLeaderPolygon = C.struct({
  leader: C.literal('polygon'),
  searchPolygon: C.array(LV95),
  refinement: CT.optionFromUndefinedable(ClientAssetSearchPolygonRefinement),
});
const EqClientAssetSearchParamsLeaderPolygon: Eq<ClientAssetSearchParamsLeaderPolygon> = struct({
  leader: eqString,
  searchPolygon: A.getEq(eqLV95),
  refinement: O.getEq(EqClientAssetSearchPolygonRefinement),
});
export type ClientAssetSearchParamsLeaderPolygon = C.TypeOf<typeof ClientAssetSearchParamsLeaderPolygon>;

export const ClientAssetSearchRefinement = makeADT('type')({
  text: ofType<ClientAssetSearchTextRefinement>(),
  polygon: ofType<ClientAssetSearchPolygonRefinement>(),
});
export type ClientAssetSearchRefinement = ClientAssetSearchTextRefinement | ClientAssetSearchPolygonRefinement;

const ClientAssetSearchParamsCodec = C.sum('leader')({
  text: ClientAssetSearchParamsLeaderText,
  polygon: ClientAssetSearchParamsLeaderPolygon,
});
export const ClientAssetSearchParams = makeADT('leader')({
  text: ofType<ClientAssetSearchParamsLeaderText>(),
  polygon: ofType<ClientAssetSearchParamsLeaderPolygon>(),
});
export const EqClientAssetSearchParams: Eq<ClientAssetSearchParamsLeaderText | ClientAssetSearchParamsLeaderPolygon> =
  fromEquals((x, y) => {
    switch (x.leader) {
      case 'text':
        return y.leader === 'text' && EqClientAssetSearchParamsLeaderText.equals(x, y);
      case 'polygon':
        return y.leader === 'polygon' && EqClientAssetSearchParamsLeaderPolygon.equals(x, y);
    }
  });
export type ClientAssetSearchParams = ClientAssetSearchParamsLeaderText | ClientAssetSearchParamsLeaderPolygon;
export const getBaseRefinement = ClientAssetSearchParams.matchStrict<O.Option<ClientAssetSearchRefinement>>({
  text: (p) => p.refinement,
  polygon: (p) => p.refinement,
});

// TODO: rewrite this to make it much shorter
export const updateRefinement = (newRefinement: O.Option<ClientAssetSearchRefinement>) =>
  ClientAssetSearchParams.matchStrict<O.Option<ClientAssetSearchParams>>({
    polygon: (a) =>
      pipe(
        newRefinement,
        O.filter(ClientAssetSearchRefinement.is.polygon),
        O.map((nr) =>
          pipe(
            a.refinement,
            O.filter(ClientAssetSearchRefinement.is.polygon),
            O.map((r) => ({ ...r, ...nr })),
            O.getOrElse(() => ClientAssetSearchRefinement.as.polygon(nr))
          )
        ),
        O.map((refinement) => ({ ...a, refinement: O.some(refinement) }))
      ),
    text: (a) =>
      pipe(
        newRefinement,
        O.filter(ClientAssetSearchRefinement.is.text),
        O.map((nr) =>
          pipe(
            a.refinement,
            O.filter(ClientAssetSearchRefinement.is.text),
            O.map((r) => ({ ...r, ...nr })),
            O.getOrElse(() => ClientAssetSearchRefinement.as.text(nr))
          )
        ),
        O.map((refinement) => ({ ...a, refinement: O.some(refinement) }))
      ),
  });

export const updateBaseRefinement = (newRefinement: O.Option<BaseClientAssetSearchRefinement>) =>
  ClientAssetSearchParams.matchStrict<O.Option<ClientAssetSearchParams>>({
    polygon: (a) =>
      pipe(
        newRefinement,
        O.map((nr) =>
          pipe(
            a.refinement,
            O.filter(ClientAssetSearchRefinement.is.polygon),
            O.map((r) => ({ ...r, ...nr })),
            O.getOrElse(() => ClientAssetSearchRefinement.as.polygon({ ...nr, searchText: O.none }))
          )
        ),
        O.map((refinement) => ({ ...a, refinement: O.some(refinement) }))
      ),
    text: (a) =>
      pipe(
        newRefinement,
        O.map((nr) =>
          pipe(
            a.refinement,
            O.filter(ClientAssetSearchRefinement.is.text),
            O.map((r) => ({ ...r, ...nr })),
            O.getOrElse(() => ClientAssetSearchRefinement.as.text({ ...nr, polygon: O.none }))
          )
        ),
        O.map((refinement) => ({ ...a, refinement: O.some(refinement) }))
      ),
  });

const ClientAssetSearchParamsFromBase64 = pipe(CT.JSONFromBase64, C.compose(ClientAssetSearchParamsCodec));

export const ClientAssetQueryParams = C.struct({
  v: C.literal('1'),
  searchParams: CT.optionFromUndefinedable(ClientAssetSearchParamsFromBase64),
  assetId: CT.optionFromUndefinedable(CT.NumberFromString),
});
export type ClientAssetQueryParams = C.TypeOf<typeof ClientAssetQueryParams>;

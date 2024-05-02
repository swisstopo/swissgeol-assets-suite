import { ADTType, makeADT, ofType } from '@morphic-ts/adt';
import * as A from 'fp-ts/Array';
import * as E from 'fp-ts/Either';
import { Eq, contramap, struct } from 'fp-ts/Eq';
import { flow, pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import { Eq as eqString } from 'fp-ts/string';
import * as C from 'io-ts/Codec';
import * as D from 'io-ts/Decoder';

import { LV95, LV95FromSpaceSeparatedString, eqLV95, eqLV95Array, toPosition } from './lv95';

export interface Point {
    _tag: 'Point';
    coord: LV95;
}
export const pointToPosition = (p: Point) => toPosition(p.coord);

export interface LineString {
    _tag: 'LineString';
    coords: LV95[];
}
export const linestringToPositions = (p: LineString) => p.coords.map(toPosition);

export interface StudyPolygon {
    _tag: 'Polygon';
    coords: LV95[];
}
export const polygonToPositions = (p: StudyPolygon) => p.coords.map(toPosition);

export const Geom = makeADT('_tag')({
    Point: ofType<Point>(),
    LineString: ofType<LineString>(),
    Polygon: ofType<StudyPolygon>(),
});
export type Geom = ADTType<typeof Geom>;
export const eqGeom: Eq<Geom> = {
    equals: (x, y) => {
        switch (x._tag) {
            case 'Point': {
                if (y._tag !== 'Point') return false;
                return eqLV95.equals(x.coord, y.coord);
            }
            case 'LineString': {
                if (y._tag !== 'LineString') return false;
                return eqLV95Array.equals(x.coords, y.coords);
            }
            case 'Polygon': {
                if (y._tag !== 'Polygon') return false;
                return eqLV95Array.equals(x.coords, y.coords);
            }
        }
    },
};

export const GeomWithCoords = Geom.exclude(['Point']);
export type GeomWithCoords = ADTType<typeof GeomWithCoords>;

export const getStudyWithPolygon = (s: Study): O.Option<Study & { geom: StudyPolygon }> =>
    pipe(
        s.geom,
        O.fromPredicate(Geom.is.Polygon),
        O.map(g => ({ ...s, geom: g })),
    );

export const getStudyWithGeomWithCoords = (s: Study): O.Option<Study & { geom: GeomWithCoords }> =>
    pipe(
        s.geom,
        O.fromPredicate(Geom.isAnyOf(['LineString', 'Polygon'])),
        O.map(g => ({ ...s, geom: g })),
    );

const stringToGeom = (_s: string): E.Either<D.DecodeError, Geom> => {
    const match = _s.match(/^(POINT|LINESTRING|POLYGON)\s*\((.*)\)$/);
    if (!match) return D.failure(_s, 'stringToGeom');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const geomType: 'POINT' | 'LINESTRING' | 'POLYGON' = match[1] as any;
    switch (geomType) {
        case 'POINT':
            return stringToPoint(match[2]);
        case 'LINESTRING':
            return stringToLinestring(match[2]);
        case 'POLYGON':
            return stringToPolygon(match[2]);
    }
};

const stringToPoint = (s: string): E.Either<D.DecodeError, Geom> =>
    pipe(
        LV95FromSpaceSeparatedString.decode(s),
        E.map(coord => Geom.of.Point({ coord })),
    );

const stringToCoords = (s: string) =>
    pipe(
        s.split(','),
        A.map(s => s.split(' ')),
        A.map(a =>
            a.length === 2 ? D.success(a as [string, string]) : D.failure(a, 'GeomFromGeomText: expected 2 parts'),
        ),
        A.sequence(E.Applicative),
        E.chain(
            flow(
                A.map(([y, x]) => LV95.decode({ x: Number(x), y: Number(y) })),
                A.sequence(E.Applicative),
            ),
        ),
    );

const stringToPolygon = (s: string): E.Either<D.DecodeError, Geom> =>
    pipe(
        s.substring(1, s.length - 1),
        stringToCoords,
        E.map(coords => Geom.of.Polygon({ coords })),
    );

const stringToLinestring = (s: string): E.Either<D.DecodeError, Geom> =>
    pipe(
        s,
        stringToCoords,
        E.map(coords => Geom.of.LineString({ coords })),
    );

const GeomFromGeomTextDecoder: D.Decoder<unknown, Geom> = {
    decode: flow(D.string.decode, E.chain(stringToGeom)),
};
export const GeomFromGeomText = C.make(GeomFromGeomTextDecoder, {
    encode: g =>
        Geom.matchStrict({
            Point: p => `POINT(${p.coord.y} ${p.coord.x})`,
            LineString: l => `LINESTRING(${l.coords.map(c => `${c.y} ${c.x}`).join(',')})`,
            Polygon: p => `POLYGON((${p.coords.map(c => `${c.y} ${c.x}`).join(',')}))`,
        })(g),
});

// TODO how to find how to compose Study from StudyDTO. Probably another function than map
export const Study = pipe(
    D.struct({ studyId: D.string, geomText: GeomFromGeomText }),
    D.map(o => ({ studyId: o.studyId, geom: o.geomText })),
);
export type Study = D.TypeOf<typeof Study>;
export const eqStudy: Eq<Study> = struct({
    studyId: eqString,
    geom: eqGeom,
});

export const eqStudyByStudyId = contramap((s: Study) => s.studyId)(eqString);

export const Studies = D.array(Study);
export type Studies = D.TypeOf<typeof Studies>;
export const eqStudies: Eq<Studies> = A.getEq(eqStudy);

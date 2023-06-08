import * as A from 'fp-ts/Array';
import { Eq, struct } from 'fp-ts/Eq';
import { pipe } from 'fp-ts/function';
import { Eq as EqNumber } from 'fp-ts/number';
import { Ord, contramap } from 'fp-ts/Ord';
import * as R from 'fp-ts/Record';
import * as S from 'fp-ts/string';
import * as C from 'io-ts/Codec';
import { Equals, assert } from 'tsafe';

import { ordStringLowerCase } from '@asset-sg/core';

import { Lang } from './lang';

export const ValueItem = C.struct({
    code: C.string,
    geolCode: C.string,
    name: C.string,
    nameDe: C.string,
    nameFr: C.string,
    nameRm: C.string,
    nameIt: C.string,
    nameEn: C.string,
    description: C.string,
    descriptionDe: C.string,
    descriptionFr: C.string,
    descriptionRm: C.string,
    descriptionIt: C.string,
    descriptionEn: C.string,
});
export interface ValueItem extends C.TypeOf<typeof ValueItem> {}
export const emptyValueItem: ValueItem = {
    code: '',
    geolCode: '',
    name: '',
    nameDe: '',
    nameFr: '',
    nameRm: '',
    nameIt: '',
    nameEn: '',
    description: '',
    descriptionDe: '',
    descriptionFr: '',
    descriptionRm: '',
    descriptionIt: '',
    descriptionEn: '',
};

export const Contact = C.struct({
    id: C.number,
    contactKindItemCode: C.string,
    name: C.string,
    street: C.nullable(C.string),
    houseNumber: C.nullable(C.string),
    plz: C.nullable(C.string),
    locality: C.nullable(C.string),
    country: C.nullable(C.string),
    telephone: C.nullable(C.string),
    email: C.nullable(C.string),
    website: C.nullable(C.string),
});
export interface Contact extends C.TypeOf<typeof Contact> {}
export const eqContact: Eq<Contact> = struct({
    id: EqNumber,
});

export const contactByName: Ord<Contact> = contramap((a: Contact) => a.name)(ordStringLowerCase);

export const ValueItemRecord = C.record(ValueItem);
export type ValueItemRecord = Record<string, ValueItem>;
assert<Equals<ValueItemRecord, Record<string, ValueItem>>>();

export const OrdValueItemByTupleFirst: Ord<[string, ValueItem]> = contramap((a: [string, ValueItem]) => a[0])(S.Ord);

export const valueItemRecordToArray = (valueItemRecord: ValueItemRecord) =>
    pipe(
        valueItemRecord,
        R.toArray,
        A.sort(OrdValueItemByTupleFirst),
        A.map(a => a[1]),
    );

export const OrdStringCaseInsensitive: Ord<string> = {
    equals: (first, second) => first.toLowerCase() === second.toLowerCase(),
    compare: (first, second) => {
        const firstLower = first.toLowerCase();
        const secondLower = second.toLowerCase();
        return firstLower < secondLower ? -1 : firstLower > secondLower ? 1 : 0;
    },
};

export const valueItemRecordToSortedArray = (valueItemRecord: ValueItemRecord, key: keyof ValueItem) =>
    pipe(
        valueItemRecord,
        R.toArray,
        A.map(a => a[1]),
        A.sort(contramap((a: ValueItem) => a[key])(OrdStringCaseInsensitive)),
    );

export const getValueItemNameKey = (lang: Lang): 'nameDe' | 'nameFr' | 'nameIt' | 'nameRm' | 'nameEn' => {
    switch (lang) {
        case 'de':
            return 'nameDe';
        case 'fr':
            return 'nameFr';
        case 'it':
            return 'nameIt';
        case 'rm':
            return 'nameRm';
        case 'en':
            return 'nameEn';
    }
};

export const getValueItemDescriptionKey = (
    lang: Lang,
): 'descriptionDe' | 'descriptionFr' | 'descriptionIt' | 'descriptionRm' | 'descriptionEn' => {
    switch (lang) {
        case 'de':
            return 'descriptionDe';
        case 'fr':
            return 'descriptionFr';
        case 'it':
            return 'descriptionIt';
        case 'rm':
            return 'descriptionRm';
        case 'en':
            return 'descriptionEn';
    }
};

export const ReferenceData = C.struct({
    assetFormatItems: ValueItemRecord,
    assetKindItems: ValueItemRecord,
    autoCatLabelItems: ValueItemRecord,
    autoObjectCatItems: ValueItemRecord,
    contactKindItems: ValueItemRecord,
    geomQualityItems: ValueItemRecord,
    languageItems: ValueItemRecord,
    legalDocItems: ValueItemRecord,
    manCatLabelItems: ValueItemRecord,
    natRelItems: ValueItemRecord,
    pubChannelItems: ValueItemRecord,
    statusAssetUseItems: C.struct({
        tobechecked: ValueItem,
        underclarification: ValueItem,
        approved: ValueItem,
    }),
    statusWorkItems: ValueItemRecord,
    contacts: C.record(Contact),
});
export interface ReferenceData extends C.TypeOf<typeof ReferenceData> {}

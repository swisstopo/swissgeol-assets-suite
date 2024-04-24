/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import { Client } from '@elastic/elasticsearch';
import { PrismaClient } from '@prisma/client';
import * as A from 'fp-ts/Array';
import * as E from 'fp-ts/Either';
import * as O from 'fp-ts/Option';
import { Eq, struct } from 'fp-ts/Eq';
import { flow, pipe } from 'fp-ts/function';
import * as NEA from 'fp-ts/NonEmptyArray';
import { Eq as EqNumber } from 'fp-ts/number';
import { Eq as EqString } from 'fp-ts/string';
import * as D from 'io-ts/Decoder';
import * as G from 'io-ts/Guard';
import { Overwrite } from 'type-zoo';

import { isNotNil } from '@asset-sg/core';
import { ElasticSearchAsset } from '@asset-sg/shared';

export interface DateIdBrand {
    readonly DateId: unique symbol;
}
export type DateId = number & DateIdBrand;
export const dateGuard: G.Guard<unknown, Date> = {
    is: (u: unknown): u is Date => Object.prototype.toString.call(u) === '[object Date]',
};
export const date: D.Decoder<unknown, Date> = D.fromGuard(dateGuard, 'Date');
export const dateIdFromDate = (d: Date) => (d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()) as DateId;
export const DateIdFromDate = pipe(date, D.map(dateIdFromDate));

const index = 'swissgeol_asset_asset';

const main = async () => {
    try {
        const options = {
            node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
            ...(process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD
                ? {
                      auth: {
                          username: process.env.ELASTICSEARCH_USERNAME || '',
                          password: process.env.ELASTICSEARCH_PASSWORD || '',
                      },
                  }
                : {}),
        };
        console.log({ options });

        const client = new Client(options);

        console.log('connected');

        const prisma = new PrismaClient();

        const RawAsset = D.struct({
            assetId: D.number,
            titlePublic: D.string,
            titleOriginal: D.string,
            sgsId: D.nullable(D.number),
            createDate: DateIdFromDate,
            assetKindItemCode: D.string,
            languageItemCode: D.nullable(D.string),
            authorId: D.nullable(D.number),
            contactName: D.nullable(D.string),
            manCatLabelItemCode: D.nullable(D.string),
            internalUseIsAvailable: D.boolean,
            publicUseIsAvailable: D.boolean,
        });
        type RawAsset = D.TypeOf<typeof RawAsset>;

        const EqRawAssetByAssetId: Eq<RawAsset> = struct({ assetId: EqNumber });

        const dataset = await prisma.$queryRaw<NEA.NonEmptyArray<RawAsset>>`
            select
                a.asset_id as "assetId",
                a.title_public as "titlePublic",
                a.title_original as "titleOriginal",
                a.sgs_id as "sgsId",
                a.create_date as "createDate",
				a.asset_kind_item_code as "assetKindItemCode",
				l.language_item_code as "languageItemCode",
                ac.contact_id as "authorId",
                c.name as "contactName",
				mclr.man_cat_label_item_code as "manCatLabelItemCode",
                iu.is_available as "internalUseIsAvailable",
                pu.is_available as "publicUseIsAvailable"
            from
                public.asset a
			left join
				public.asset_language l
				on l.asset_id = a.asset_id
            left join
                public.asset_contact ac
                on  ac.role = ${'author'}
                and ac.asset_id = a.asset_id
            left join
				public.asset_contact ac2
				on ac2.asset_id = a.asset_id
			left join
				public.contact c
				on c.contact_id = ac2.contact_id
            left join
			    public.man_cat_label_ref mclr
				on mclr.asset_id = a.asset_id
            left join
			    public.internal_use iu
				on iu.internal_use_id = a.internal_use_id
            left join
			    public.public_use pu
				on pu.public_use_id = a.public_use_id
            order by
                a.asset_id
        `;

        const assets = pipe(
            D.array(RawAsset).decode(dataset),
            E.map(
                flow(
                    NEA.group(EqRawAssetByAssetId),
                    A.map((a): Overwrite<ElasticSearchAsset, { createDate: number }> => {
                        const usageCode = NEA.head(a).publicUseIsAvailable
                            ? 'public'
                            : NEA.head(a).internalUseIsAvailable
                            ? 'internal'
                            : 'useOnRequest';
                        return {
                            assetId: NEA.head(a).assetId,
                            titlePublic: NEA.head(a).titlePublic,
                            titleOriginal: NEA.head(a).titleOriginal,
                            sgsId: NEA.head(a).sgsId,
                            createDate: NEA.head(a).createDate,
                            assetKindItemCode: NEA.head(a).assetKindItemCode,
                            usageCode,
                            authorIds: pipe(
                                a,
                                A.map(at => at.authorId),
                                A.filter(isNotNil),
                                A.uniq(EqNumber),
                            ),
                            languageItemCode: pipe(
                                a,
                                A.map(at => at.languageItemCode),
                                A.filter(isNotNil),
                                A.uniq(EqString),

                                // TODO Remove these as soon as ES supports multi-language assets (DVA, 2024-04-18).
                                A.findFirst(() => true),
                                O.getOrElse(() => 'unknown')
                            ),
                            contactNames: pipe(
                                a,
                                A.map(at => at.contactName),
                                A.filter(isNotNil),
                                A.uniq(EqString),
                            ),
                            manCatLabelItemCodes: pipe(
                                a,
                                A.map(at => at.manCatLabelItemCode),
                                A.filter(isNotNil),
                                A.uniq(EqString),
                            ),
                        };
                    }),
                ),
            ),
        );


        if (E.isRight(assets)) {
            const operations = assets.right.flatMap(doc => [
                { index: { _index: 'swissgeol_asset_asset', _id: doc.assetId } },
                doc,
            ]);
            
            const bulkResponse = await client.bulk({ refresh: true, operations });
            console.log(bulkResponse);
                    } else {
            console.log(D.draw(assets.left));
        }
    } catch (e) {
        console.error(e);
    }
};

main().then(() => console.log('done'));

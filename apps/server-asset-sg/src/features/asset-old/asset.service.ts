import { decodeError, isNotNil, unknownToError, unknownToUnknownError } from '@asset-sg/core';
import { AssetSearchParams, BaseAssetDetail, SearchAssetResult } from '@asset-sg/shared';
import { Injectable } from '@nestjs/common';
import { sequenceS } from 'fp-ts/Apply';
import * as A from 'fp-ts/Array';
import { flow, Lazy, pipe } from 'fp-ts/function';
import * as O from 'fp-ts/Option';
import * as RR from 'fp-ts/ReadonlyRecord';
import * as TE from 'fp-ts/TaskEither';
import * as C from 'io-ts/Codec';
import * as D from 'io-ts/Decoder';

import { PrismaService } from '@/core/prisma.service';
import { AssetSearchService } from '@/features/assets/search/asset-search.service';
import { findAssetsByPolygon } from '@/features/search/find-assets-by-polygon';
import { AssetDetailFromPostgres } from '@/models/AssetDetailFromPostgres';
import { notFoundError } from '@/utils/errors';
import { getFile } from '@/utils/file/get-file';
import { postgresStudiesByAssetId } from '@/utils/postgres-studies/postgres-studies';

@Injectable()
export class AssetService {
  constructor(private readonly prismaService: PrismaService, private readonly assetSearchService: AssetSearchService) {}

  getFile(fileId: number) {
    return getFile(this.prismaService, fileId);
  }

  searchAssets(query: unknown): TE.TaskEither<Error, SearchAssetResult> {
    return pipe(
      TE.fromEither(AssetSearchParams.decode(query)),
      TE.mapLeft((e) => new Error(D.draw(e))),
      TE.chainW((a) => {
        switch (a.filterKind) {
          case 'polygon':
            return pipe(
              a.searchText,
              O.fold(
                () => findAssetsByPolygon(this.prismaService, a.polygon),
                (searchText) =>
                  pipe(
                    findAssetsByPolygon(this.prismaService, a.polygon),
                    TE.chainW(
                      SearchAssetResult.matchStrict({
                        SearchAssetResultNonEmpty: (result) =>
                          TE.tryCatch(
                            () =>
                              this.assetSearchService.searchOld(searchText, {
                                scope: ['titlePublic', 'titleOriginal', 'contactNames'],
                                assetIds: result.assets.map((asset) => asset.assetId),
                              }),
                            unknownToError
                          ),
                        SearchAssetResultEmpty: TE.of,
                      })
                    )
                  )
              )
            );
          case 'searchText':
            // TODO: now callSearchAssets with O.none as third parameter
            return TE.of(1) as unknown as TE.TaskEither<Error, SearchAssetResult>;
        }
      })
    );
  }

  getReferenceData() {
    const qt = <A, K extends keyof A>(f: Lazy<Promise<A[]>>, key: K, newKey: string) =>
      pipe(
        TE.tryCatch(f, unknownToError),
        TE.map(
          flow(
            A.map(({ [key]: _key, ...rest }) => [_key as string, { [newKey]: _key, ...rest }] as const),
            RR.fromEntries
          )
        )
      );

    const queries = {
      assetFormatItems: qt(() => this.prismaService.assetFormatItem.findMany(), 'assetFormatItemCode', 'code'),
      assetKindItems: qt(() => this.prismaService.assetKindItem.findMany(), 'assetKindItemCode', 'code'),
      autoCatLabelItems: qt(() => this.prismaService.autoCatLabelItem.findMany(), 'autoCatLabelItemCode', 'code'),
      autoObjectCatItems: qt(() => this.prismaService.autoObjectCatItem.findMany(), 'autoObjectCatItemCode', 'code'),
      contactKindItems: qt(() => this.prismaService.contactKindItem.findMany(), 'contactKindItemCode', 'code'),
      geomQualityItems: qt(() => this.prismaService.geomQualityItem.findMany(), 'geomQualityItemCode', 'code'),
      languageItems: qt(() => this.prismaService.languageItem.findMany(), 'languageItemCode', 'code'),
      legalDocItems: qt(() => this.prismaService.legalDocItem.findMany(), 'legalDocItemCode', 'code'),
      manCatLabelItems: qt(() => this.prismaService.manCatLabelItem.findMany(), 'manCatLabelItemCode', 'code'),
      natRelItems: qt(() => this.prismaService.natRelItem.findMany(), 'natRelItemCode', 'code'),
      pubChannelItems: qt(() => this.prismaService.pubChannelItem.findMany(), 'pubChannelItemCode', 'code'),
      statusAssetUseItems: qt(() => this.prismaService.statusAssetUseItem.findMany(), 'statusAssetUseItemCode', 'code'),
      statusWorkItems: qt(() => this.prismaService.statusWorkItem.findMany(), 'statusWorkItemCode', 'code'),
      contacts: qt(() => this.prismaService.contact.findMany(), 'contactId', 'id'),
    };

    return pipe(queries, sequenceS(TE.ApplicativeSeq));
  }

  getAssetDetail(assetId: number) {
    const AssetDetail = C.struct({
      ...BaseAssetDetail,
      studies: C.array(C.struct({ assetId: C.number, studyId: C.string, geomText: C.string })),
    });
    return pipe(
      TE.tryCatch(
        () =>
          this.prismaService.asset.findUnique({
            where: { assetId },
            select: {
              assetId: true,
              titlePublic: true,
              titleOriginal: true,
              createDate: true,
              lastProcessedDate: true,
              assetKindItemCode: true,
              assetFormatItemCode: true,
              assetLanguages: {
                select: {
                  languageItem: true,
                },
              },
              internalUse: { select: { isAvailable: true } },
              publicUse: { select: { isAvailable: true } },
              ids: { select: { id: true, description: true } },
              assetContacts: {
                select: {
                  role: true,
                  contact: { select: { name: true, locality: true, contactKindItemCode: true } },
                },
              },
              manCatLabelRefs: { select: { manCatLabelItemCode: true } },
              assetFormatCompositions: { select: { assetFormatItemCode: true } },
              typeNatRels: { select: { natRelItemCode: true } },
              assetMain: { select: { assetId: true, titlePublic: true } },
              subordinateAssets: { select: { assetId: true, titlePublic: true } },
              siblingYAssets: { select: { assetX: { select: { assetId: true, titlePublic: true } } } },
              siblingXAssets: { select: { assetY: { select: { assetId: true, titlePublic: true } } } },
              statusWorks: { select: { statusWorkItemCode: true, statusWorkDate: true } },
              assetFiles: { select: { file: true } },
            },
          }),
        unknownToUnknownError
      ),
      TE.chainW(TE.fromPredicate(isNotNil, notFoundError)),
      TE.chainW((a) =>
        pipe(
          postgresStudiesByAssetId(this.prismaService, a.assetId),
          TE.map((studies) => ({ ...a, studies }))
        )
      ),
      TE.chainW((a) => pipe(TE.fromEither(AssetDetailFromPostgres.decode(a)), TE.mapLeft(decodeError))),
      TE.map(AssetDetail.encode)
    );
  }
}

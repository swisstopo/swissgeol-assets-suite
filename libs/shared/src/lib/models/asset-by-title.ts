import * as D from 'io-ts/Decoder';

export const AssetByTitle = D.struct({
    score: D.number,
    titlePublic: D.string,
    assetId: D.number,
});
export interface AssetByTitle extends D.TypeOf<typeof AssetByTitle> {}

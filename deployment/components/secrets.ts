import { createSecret } from '@geoadmin/lambda-it-pulumi-lib/components/secret';
import { GA_Env } from '../helper';
import { Config, Output } from '@pulumi/pulumi';
import { RandomPassword } from '@pulumi/random';
import { SecretData } from '@geoadmin/lambda-it-pulumi-lib';
import { Secret } from '@geoadmin/lambda-it-pulumi-lib/types';

export interface AssetSecretKeys {
    elasticPassword: Output<string>;
    elasticEncryptionKey: Output<string>;
    gotrueJwtSecret: string;
    // s3AccessKeyId: Output<string>;
    // s3SecretAccessKey: Output<string>;
    apiDbCon: Output<string>;
    authDbCon: Output<string>;
}

export function getAssetSecretName(env: GA_Env): string {
    return `swissgeol-asset-secrets-${env}`;
}

export function createAssetSecret(cfg: Config, baseMetadata: any, name: string): Secret {
    const jwtSecret = new RandomPassword(`${baseMetadata.namespace}-jwt-secret-gotrue-jwt-secret`, {
        length: 30,
    });

    const secretData: SecretData & AssetSecretKeys = {
        elasticPassword: cfg.requireSecret('elasticPassword'),
        elasticEncryptionKey: cfg.requireSecret('searchEncryptionKey'),
        gotrueJwtSecret: Buffer.from(jwtSecret.result.toString()).toString('base64'),
        s3AccessKeyId: cfg.requireSecret('s3AccessKeyId'),
        s3SecretAccessKey: cfg.requireSecret('s3SecretAccessKey'),
        apiDbCon: cfg.requireSecret('apiDbCon'),
        authDbCon: cfg.requireSecret('authDbCon'),
    };

    return createSecret(
        { ...baseMetadata, labels: { ...baseMetadata.labels, app: 'asset-core' }, name: name },
        secretData,
    );
}

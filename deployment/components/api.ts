import { Config } from '@pulumi/pulumi';
import { InitPulumiConfig, LambdaK8SDeployment, LambdaK8sConfiguration } from '@geoadmin/lambda-it-pulumi-lib';
import { AdditionalArgs } from '../helper';

export default function deployApi(initConfig: InitPulumiConfig, cfg: Config, args: AdditionalArgs) {
    const { secretsName } = args;
    const deployCfg = new LambdaK8sConfiguration(initConfig);
    const {
        metadata,
        pulumiConfig: { appUrls },
    } = deployCfg.values();
    deployCfg.setReplicas(1).setResources({
        limits: { cpu: '1', memory: '256M' },
        requests: { cpu: '0.25', memory: '64M' },
    });

    const s3Config = cfg.requireObject<{ endpoint: string; region: string; bucket: string }>('s3');

    deployCfg
        .addEnvironment({
            name: 'DATABASE_URL',
            valueFrom: {
                secretKeyRef: {
                    name: secretsName,
                    key: 'apiDbCon',
                },
            },
        })
        .addEnvironment({ name: 'FRONTEND_URL', value: `https://${appUrls[0]}` })
        .addEnvironment({
            name: 'ELASTICSEARCH_URL',
            value: `http://swissgeol-asset-elasticsearch-${metadata.labels.env}:9200`,
        })
        .addEnvironment({ name: 'ELASTICSEARCH_USERNAME', value: 'elastic' })
        .addEnvironment({
            name: 'ELASTICSEARCH_PASSWORD',
            valueFrom: {
                secretKeyRef: {
                    name: secretsName,
                    key: 'elasticPassword',
                },
            },
        })
        .addEnvironment({ name: 'AUTH_URL', value: `http://swissgeol-asset-gotrue-${metadata.labels.env}:8081` })
        .addEnvironment({
            name: 'GOTRUE_JWT_SECRET',
            valueFrom: {
                secretKeyRef: {
                    name: secretsName,
                    key: 'gotrueJwtSecret',
                },
            },
        })
        .addEnvironment({ name: 'S3_BUCKET_NAME', value: s3Config.bucket })
        .addEnvironment({ name: 'S3_REGION', value: s3Config.region })
        .addEnvironment({ name: 'S3_ENDPOINT', value: s3Config.endpoint })
        .addEnvironment({
            name: 'S3_ACCESS_KEY_ID',
            valueFrom: {
                secretKeyRef: {
                    name: secretsName,
                    key: 's3AccessKeyId',
                },
            },
        })
        .addEnvironment({
            name: 'S3_SECRET_ACCESS_KEY',
            valueFrom: {
                secretKeyRef: {
                    name: secretsName,
                    key: 's3SecretAccessKey',
                },
            },
        })
        .addEnvironment({
            name: 'S3_ASSET_FOLDER',
            value: 'asset/asset_files',
        })
        .addEnvironment({
            name: 'OCR_URL',
            value: `http://swissgeol-digi-ocr-${metadata.labels.env}.swissgeol-digi.svc.cluster.local:5000`,
        })
        .addEnvironment({
            name: 'OCR_CALLBACK_URL',
            value: `http://swissgeol-asset-api-${metadata.labels.env}.swissgeol-asset.svc.cluster.local:3333/api`,
        });

    new LambdaK8SDeployment(deployCfg).createDeployment();
}

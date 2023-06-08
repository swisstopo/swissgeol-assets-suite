import { Config } from '@pulumi/pulumi';
import deployApp from './components/app';
import { LambdaK8sConfiguration } from '@geoadmin/lambda-it-pulumi-lib';
import { RegistryName } from '@geoadmin/lambda-it-pulumi-lib';
import { GA_Env } from './helper';
import deployAuth from './components/auth';
import { deployElasticsearch, deployKibana } from './components/search';
import deployApi from './components/api';
import { createAssetSecret, getAssetSecretName } from './components/secrets';
import createTraefikRoutes from './components/routing';

const cfg = new Config();
const registry = 'ghcr.io/geoadmin';
const env: GA_Env = cfg.get<GA_Env>('env') || GA_Env.DEV;
const version = cfg.get('version') ?? 'latest';
const goTrueVersion = cfg.get('goTrueVersion') ?? 'latest';
const elasticVersion = cfg.require('elasticVersion');
const baseAppName = 'asset';

const baseMetadata = {
    namespace: 'swissgeol-asset',
    labels: { project: 'swissgeol', env: env.toString() },
};

const baseCfgFactory = LambdaK8sConfiguration.createFactory({
    namespace: baseMetadata.namespace, // namespace is created manually, permission reasons
    labels: {
        project: baseMetadata.labels.project,
        env: baseMetadata.labels.env,
    },
    registrySecret: {
        name: 'geoadmin-ghcr-registry' as RegistryName,
        value: cfg.requireSecret('ghcr-registry-secret'),
    },
    // only defined as placeholder, will be overwritten deploy functions
    appUrls: [cfg.require('url')],
});

// ------------- DEPLOY DEFAULTS -------------
const assetCoreSecrets = getAssetSecretName(env);
createAssetSecret(cfg, baseMetadata, assetCoreSecrets);

// ------------- DEPLOY APP -------------
deployApp(
    baseCfgFactory({
        labels: {
            app: `${baseAppName}-app`,
        },
        dockerImage: `${registry}/swissgeol-asset-app:${version}`,
        port: {
            containerPort: 80,
        },
    }),
    cfg,
);

// ------------- DEPLOY API -------------
deployApi(
    baseCfgFactory({
        labels: {
            app: `${baseAppName}-api`,
        },
        dockerImage: `${registry}/swissgeol-asset-api:${version}`,
        port: {
            containerPort: 3333,
        },
    }),
    cfg,
    { secretsName: assetCoreSecrets },
);

// ------------- DEPLOY AUTH -------------
deployAuth(
    baseCfgFactory({
        labels: {
            app: `${baseAppName}-gotrue`,
        },
        dockerImage: `${registry}/swissgeol-auth-gotrue:${goTrueVersion}`,
        port: {
            containerPort: 8081,
        },
    }),
    cfg,
    { secretsName: assetCoreSecrets },
);

// ------------- DEPLOY SEARCH -------------
deployElasticsearch(
    baseCfgFactory({
        labels: {
            app: `${baseAppName}-elasticsearch`,
        },
        dockerImage: `${registry}/swissgeol-search-elasticsearch:${elasticVersion}`,
        port: {
            containerPort: 9200,
        },
    }),
    cfg,
    { secretsName: assetCoreSecrets },
);

// createDebugPod(
//     baseMetadata,
//     `${baseMetadata.labels.project}-${baseAppName}-elasticsearch-${env}-volume`,
// );

deployKibana(
    baseCfgFactory({
        labels: {
            app: `${baseAppName}-kibana`,
        },
        dockerImage: `${registry}/swissgeol-search-kibana:${elasticVersion}`,
        port: {
            containerPort: 5601,
        },
    }),
    cfg,
    { secretsName: assetCoreSecrets },
);

// ------------- DEPLOY ROUTING -------------
createTraefikRoutes(
    { ...baseMetadata, name: '', labels: { ...baseMetadata.labels, app: 'asset' } },
    cfg.require('url'),
);

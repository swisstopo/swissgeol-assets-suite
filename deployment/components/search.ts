import { Config } from '@pulumi/pulumi';
import * as k8s from '@pulumi/kubernetes';
import { InitPulumiConfig, LambdaK8SDeployment, LambdaK8sConfiguration } from '@geoadmin/lambda-it-pulumi-lib';
import { AdditionalArgs } from '../helper';

export function deployElasticsearch(initConfig: InitPulumiConfig, cfg: Config, args: AdditionalArgs) {
    const deployCfg = new LambdaK8sConfiguration(initConfig);
    const { secretsName } = args;
    const { metadata } = deployCfg.values();

    const pvc = `${metadata.labels.project}-${metadata.labels.app}-${metadata.labels.env}-volume`;
    new k8s.core.v1.PersistentVolumeClaim(pvc, {
        metadata: { ...metadata, name: pvc },
        spec: {
            accessModes: ['ReadWriteOnce'],
            resources: {
                requests: {
                    storage: '50Gi',
                },
            },
            storageClassName: 'gp2',
        },
    });

    deployCfg
        .addEnvironment({ name: 'discovery.type', value: 'single-node' })
        .addEnvironment({ name: 'ES_JAVA_OPTS', value: '-Xms1024m -Xmx1024m' })
        .addEnvironment({ name: 'ELASTIC_USERNAME', value: 'elastic' })
        .addEnvironment({
            name: 'ELASTIC_PASSWORD',
            valueFrom: {
                secretKeyRef: {
                    name: secretsName,
                    key: 'elasticPassword',
                },
            },
        })
        .addEnvironment({ name: 'xpack.security.enabled', value: 'true' })
        .addEnvironment({
            name: 'xpack.encryptedSavedObjects.encryptionKey',
            valueFrom: {
                secretKeyRef: {
                    name: secretsName,
                    key: 'elasticEncryptionKey',
                },
            },
        })
        .addEnvironment({ name: 'bootstrap.memory_lock', value: 'true' })
        .setResources({
            requests: {
                cpu: '1',
                memory: '2Gi',
            },
            limits: {
                cpu: '4',
                memory: '4Gi',
            },
        })
        .addVolume({
            name: pvc,
            persistentVolumeClaim: {
                claimName: pvc,
            },
        })
        .addVolumeMount({
            name: pvc,
            mountPath: '/usr/share/elasticsearch/data',
            subPath: 'elasticsearch',
        })
        .setDeployStrategy({
            type: 'Recreate',
        })
        .setSecurityContext({
            fsGroup: 0,
        });
    new LambdaK8SDeployment(deployCfg).createDeployment();
}

export function deployKibana(initConfig: InitPulumiConfig, cfg: Config, args: AdditionalArgs) {
    const deployCfg = new LambdaK8sConfiguration(initConfig);
    const { secretsName } = args;
    const {
        metadata,
        pulumiConfig: {
            appUrls: [url],
        },
    } = deployCfg.values();

    deployCfg
        .addEnvironment({ name: 'SERVER_BASEPATH', value: '/kibana' })
        .addEnvironment({ name: 'SERVER_PUBLICBASEURL', value: `https://${url}/kibana` })
        .addEnvironment({
            name: 'ELASTICSEARCH_PASSWORD',
            valueFrom: {
                secretKeyRef: {
                    name: secretsName,
                    key: 'elasticPassword',
                },
            },
        })
        .addEnvironment({
            name: 'ELASTICSEARCH_HOSTS',
            value: `http://kibana_system:$(ELASTICSEARCH_PASSWORD)@swissgeol-asset-elasticsearch-${metadata.labels.env}:9200`,
        })
        .addEnvironment({
            name: 'xpack.encryptedSavedObjects.encryptionKey',
            valueFrom: {
                secretKeyRef: {
                    name: secretsName,
                    key: 'elasticEncryptionKey',
                },
            },
        })
        .setResources({
            limits: { cpu: '2', memory: '1024M' },
            requests: { cpu: '0.25', memory: '256M' },
        });

    new LambdaK8SDeployment(deployCfg).createDeployment();
}

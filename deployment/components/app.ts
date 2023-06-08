import { Config } from '@pulumi/pulumi';
import { InitPulumiConfig, LambdaK8SDeployment, LambdaK8sConfiguration } from '@geoadmin/lambda-it-pulumi-lib';

export default function deployApp(initConfig: InitPulumiConfig, cfg: Config) {
    const deployCfg = new LambdaK8sConfiguration(initConfig);
    deployCfg.setReplicas(1).setResources({
        limits: { cpu: '1', memory: '256M' },
        requests: { cpu: '0.25', memory: '64M' },
    });

    new LambdaK8SDeployment(deployCfg).createRepository().createDeployment();
}

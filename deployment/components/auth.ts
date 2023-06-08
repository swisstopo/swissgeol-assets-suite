import { Config } from '@pulumi/pulumi';
import { InitPulumiConfig, LambdaK8SDeployment, LambdaK8sConfiguration } from '@geoadmin/lambda-it-pulumi-lib';
import { AdditionalArgs } from '../helper';

export default function deployAuth(initConfig: InitPulumiConfig, cfg: Config, args: AdditionalArgs) {
    const { secretsName } = args;
    const deployCfg = new LambdaK8sConfiguration(initConfig);
    const {
        pulumiConfig: {
            appUrls: [url],
        },
    } = deployCfg.values();

    deployCfg
        .addEnvironment({
            name: 'GOTRUE_API_HOST',
            value: '0.0.0.0',
        })
        .addEnvironment({
            name: 'GOTRUE_SITE_URL',
            value: url,
        })
        .addEnvironment({
            name: 'GOTRUE_DB_DRIVER',
            value: 'postgres',
        })
        .addEnvironment({
            name: 'DB_DRIVER',
            value: 'postgres',
        })
        .addEnvironment({
            name: 'DATABASE_URL',
            valueFrom: {
                secretKeyRef: {
                    name: secretsName,
                    key: 'authDbCon',
                },
            },
        })
        .addEnvironment({
            name: 'GOTRUE_COOKIE_KEY',
            value: 'asset-sg',
        })
        .addEnvironment({
            name: 'GOTRUE_JWT_SECRET',
            valueFrom: {
                secretKeyRef: {
                    name: secretsName,
                    key: 'gotrueJwtSecret',
                },
            },
        })
        .addEnvironment({
            name: 'GOTRUE_DISABLE_SIGNUP',
            value: (cfg.getBoolean('authDisableSignup') ?? true).toString(),
        })
        .addEnvironment({ name: 'GOTRUE_SMTP_SENDER_NAME', value: 'Swissgeol' })
        .addEnvironment({
            name: 'GOTRUE_MAILER_URLPATHS_INVITE',
            value: `https://${url}/auth/verify`,
        })
        .addEnvironment({
            name: 'GOTRUE_MAILER_URLPATHS_CONFIRMATION',
            value: '/auth/v1/verify',
        })
        .addEnvironment({
            name: 'GOTRUE_MAILER_URLPATHS_RECOVERY',
            value: `https://${url}/auth/verify`,
        })
        .addEnvironment({
            name: 'GOTRUE_MAILER_URLPATHS_EMAIL_CHANGE',
            value: '/auth/v1/verify',
        })
        .addEnvironment({
            name: 'GOTRUE_MAILER_SUBJECTS_INVITE',
            value: '{{if eq .Data.language "de"}} Einladung für assets.swissgeol.ch Login {{else if eq .Data.language "fr"}} Invitation à se connecter à assets.swissgeol.ch {{else if eq .Data.language "it"}} Invito all\'\'accesso a assets.swissgeol.ch {{else if eq .Data.language "rm"}} RM TODO TRANSLATE Einladung für assets.swissgeol.ch Login {{else}} Invitation to assets.swissgeol.ch {{end}}\'',
        })
        .addEnvironment({
            name: 'GOTRUE_MAILER_TEMPLATES_INVITE',
            value: `https://${url}/assets/email-templates/invite.html`,
        })
        .addEnvironment({
            name: 'GOTRUE_MAILER_SUBJECTS_RECOVERY',
            value: '{{if eq .Data.language "de"}} Passwort zurücksetzen für assets.swissgeol.ch {{else if eq .Data.language "fr"}} Réinitialiser le mot de passe pour assets.swissgeol.ch {{else if eq .Data.language "it"}} Reimpostare la password di assets.swissgeol.ch {{else if eq .Data.language "rm"}} RM TODO TRANSLATE Passwort zurücksetzen für assets.swissgeol.ch {{else}} Password reset for assets.swissgeol.ch {{end}}',
        })
        .addEnvironment({
            name: 'GOTRUE_MAILER_TEMPLATES_RECOVERY',
            value: `https://${url}/assets/email-templates/recover.html`,
        });

    // add ressource configuration
    deployCfg.setReplicas(1).setResources({
        limits: { cpu: '1', memory: '512M' },
        requests: { cpu: '0.1', memory: '128M' },
    });

    // add smtp environment variables
    const smtpSettings = cfg.requireObject<{ host: string; port: number; user: string; adminEmail: string }>(
        'authSmtp',
    );
    Object.keys(smtpSettings).forEach(key => {
        deployCfg.addEnvironment({
            name: `GOTRUE_SMTP_${key.toUpperCase()}`,
            value: smtpSettings[key as keyof typeof smtpSettings].toString(),
        });
    });

    // gotrue deployment
    new LambdaK8SDeployment(deployCfg).createDeployment();
}

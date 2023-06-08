import { Metadata } from '@geoadmin/lambda-it-pulumi-lib';
import { IngressRoute, Middleware } from '@geoadmin/lambda-it-pulumi-lib/crds/traefik/traefik/v1alpha1';

export default function createTraefikRoutes(metadata: Metadata, url: string) {
    const { project, app, env } = metadata.labels;
    const routeName = `${project}-${app}-${env}-routes`;

    const mwWhiteListName = `${metadata.labels.project}-${metadata.labels.app}-${metadata.labels.env}-whitelist`;
    const mwKibanaRewriteName = `${metadata.labels.project}-${metadata.labels.app}-${metadata.labels.env}-kibana-rewrite`;
    const mwAuthRewriteName = `${metadata.labels.project}-${metadata.labels.app}-${metadata.labels.env}-auth-rewrite`;

    const ingressRoute = new IngressRoute(routeName, {
        metadata: {
            name: routeName,
            namespace: metadata.namespace,
            labels: metadata.labels,
        },
        spec: {
            entryPoints: ['web'],
            routes: [
                // app
                {
                    kind: 'Rule',
                    match: 'Host(`' + url + '`)',
                    services: [{ name: `${project}-${app}-app-${env}`, port: 80 }],
                    priority: 100,
                },
                // api
                {
                    kind: 'Rule',
                    match: 'Host(`' + url + '`) && PathPrefix(`/api`)',
                    services: [{ name: `${project}-${app}-api-${env}`, port: 3333 }],
                    priority: 120,
                },
                // auth
                {
                    kind: 'Rule',
                    match: 'Host(`' + url + '`) && PathPrefix(`/auth`)',
                    services: [{ name: `${project}-${app}-gotrue-${env}`, port: 8081 }],
                    middlewares: [
                        { name: mwAuthRewriteName },
                    ],
                    priority: 121,
                },
                // kibana
                {
                    kind: 'Rule',
                    match: 'Host(`' + url + '`) && PathPrefix(`/kibana`)',
                    services: [{ name: `${project}-${app}-kibana-${env}`, port: 5601 }],
                    middlewares: [
                        // {
                        //     name: mwWhiteListName,
                        // },
                        { name: mwKibanaRewriteName },
                    ],
                    priority: 110,
                },
            ],
        },
    });

    new Middleware(
        mwWhiteListName,
        {
            metadata: {
                name: mwWhiteListName,
                namespace: metadata.namespace,
                labels: metadata.labels,
            },
            spec: {
                ipWhiteList: {
                    sourceRange: ['62.202.47.154'],
                },
            },
        },
        {
            parent: ingressRoute,
        },
    );

    new Middleware(
        mwKibanaRewriteName,
        {
            metadata: {
                name: mwKibanaRewriteName,
                namespace: metadata.namespace,
                labels: metadata.labels,
            },
            spec: {
                stripPrefix: {
                    prefixes: ['/kibana'],
                },
            },
        },
        {
            parent: ingressRoute,
        },
    );

    new Middleware(
        mwAuthRewriteName,
        {
            metadata: {
                name: mwAuthRewriteName,
                namespace: metadata.namespace,
                labels: metadata.labels,
            },
            spec: {
                stripPrefix: {
                    prefixes: ['/auth'],
                },
            },
        },
        {
            parent: ingressRoute,
        },
    );
}

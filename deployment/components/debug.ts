import { Pod } from '@pulumi/kubernetes/core/v1';

export function createDebugPod(baseMetadata: any, volumeName: string) {
    const pod = new Pod('debug-pod', {
        metadata: {
            name: 'debug-pod',
            namespace: baseMetadata.namespace,
        },
        spec: {
            volumes: [{
                name: volumeName,
                persistentVolumeClaim: {
                    claimName: volumeName,
                },
            }],
            containers: [
                {
                    name: 'debug-pod',
                    image: 'busybox',
                    command: ['sleep', '360000'],
                    volumeMounts: [
                        {
                            name: volumeName,
                            mountPath: '/data',
                        },
                    ],
                },
            ],
        },
    });
    return pod;
}

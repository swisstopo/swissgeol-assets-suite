import { RandomPassword } from "@pulumi/random";

export enum GA_Env {
    DEV = 'dev',
    STAGE = 'stage',
    PROD = 'prod',
}

export interface AdditionalArgs {
    secretsName: string;
}

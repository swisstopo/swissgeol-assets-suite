import { CognitoIdentityProviderClient, ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider';
import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { readEnv } from '@/utils/requireEnv';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  private readonly client: CognitoIdentityProviderClient;
  private readonly _poolId: string | null;

  constructor(private readonly schedulerRegistry: SchedulerRegistry) {
    this.client = new CognitoIdentityProviderClient({ region: readEnv('COGNITO_REGION') ?? 'local' });
    this._poolId = readEnv('COGNITO_POOL_ID');

    if (this._poolId === null) {
      this.logger.warn('Users will not be synced with Cognito as COGNITO_POOL_ID is not set.');
      return;
    }

    this.syncUsers();

    const at2AM = '0 2 * * *';
    const job = new CronJob(at2AM, () => this.syncUsers());
    this.schedulerRegistry.addCronJob('elasticIndexSync', job);
  }

  private syncUsers() {
    this.logger.warn('Syncing users with Cognito.');
    this.listUsers();
  }

  private async listUsers(): Promise<void> {
    const command = new ListUsersCommand({ UserPoolId: this.poolId });
    const response = await this.client.send(command);
    console.log(response);
  }

  private get poolId(): string {
    if (this._poolId === null) {
      throw new Error('unable to use UserService as COGNITO_POOL_ID is missing');
    }
    return this._poolId;
  }
}

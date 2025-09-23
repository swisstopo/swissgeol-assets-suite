import { UserId } from '@asset-sg/shared/v2';
import {
  CognitoIdentityProviderClient,
  ListUsersInGroupCommand,
  ListUsersInGroupCommandOutput,
} from '@aws-sdk/client-cognito-identity-provider';
import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { PrismaService } from '@/core/prisma.service';
import { UserRepo } from '@/features/users/user.repo';
import { readEnv } from '@/utils/requireEnv';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  private readonly client: CognitoIdentityProviderClient;
  private readonly _poolId: string | null;
  private readonly _group: string | null;

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly userRepo: UserRepo,
    private readonly prismaService: PrismaService,
  ) {
    this.client = new CognitoIdentityProviderClient({ region: readEnv('COGNITO_REGION') ?? 'local' });
    this._poolId = readEnv('COGNITO_POOL_ID');
    this._group = readEnv('COGNITO_GROUP');
  }

  async startCronJob(): Promise<void> {
    if (this._poolId === null) {
      this.logger.warn('Users will not be synced with Cognito as COGNITO_POOL_ID is not set.');
      return;
    }
    if (this._group === null) {
      this.logger.warn('Users will not be synced with Cognito as COGNITO_GROUP is not set.');
      return;
    }

    await this.syncUsers();

    const at2AM = '0 2 * * *';
    const job = new CronJob(at2AM, () => this.syncUsers());
    this.schedulerRegistry.addCronJob('userSync', job);
    job.start();
  }

  private async syncUsers() {
    this.logger.log('Syncing users with Cognito.');
    const unknownUserIds = await this.listUnknownUserIds();
    if (unknownUserIds.size === 0) {
      this.logger.log('All users are known to Cognito.');
      this.logger.log('Done syncing users with Cognito.');
      return;
    }
    this.logger.log('Found users that are not known to Cognito.', { count: unknownUserIds.size });
    for (const userId of unknownUserIds) {
      this.logger.log('Deleting user.', { id: userId });
      await this.userRepo.delete(userId);
    }
    this.logger.log('Done syncing users with Cognito.');
  }

  private async listUnknownUserIds(): Promise<Set<UserId>> {
    const cognitoUserIds = await this.listKnownUserIds();
    const localUsers = await this.prismaService.assetUser.findMany({ select: { id: true } });
    const unknownUserIds = new Set<UserId>();
    for (const { id } of localUsers) {
      if (!cognitoUserIds.delete(id)) {
        unknownUserIds.add(id);
      }
    }
    return unknownUserIds;
  }

  private async listKnownUserIds(): Promise<Set<UserId>> {
    let nextToken: string | undefined = undefined;
    const ids = new Set<UserId>();
    for (;;) {
      const response: ListUsersInGroupCommandOutput = await this.client.send(
        new ListUsersInGroupCommand({
          UserPoolId: this.poolId,
          GroupName: this.group,
          NextToken: nextToken,
        }),
      );
      if (response.Users == null || response.Users.length === 0) {
        return ids;
      }
      for (const user of response.Users) {
        const subAttribute = user.Attributes?.find((it) => it.Name === 'sub');
        if (subAttribute?.Value == null) {
          continue;
        }
        ids.add(subAttribute.Value);
      }
      nextToken = response.NextToken;
      if (nextToken === undefined) {
        return ids;
      }
    }
  }

  private get poolId(): string {
    if (this._poolId === null) {
      throw new Error('unable to use UserService as COGNITO_POOL_ID is missing');
    }
    return this._poolId;
  }

  private get group(): string {
    if (this._group === null) {
      throw new Error('unable to use UserService as COGNITO_GROUP is missing');
    }
    return this._group;
  }
}

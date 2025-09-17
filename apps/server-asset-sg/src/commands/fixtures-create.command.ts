import { fixtures, User } from '@asset-sg/shared/v2';
import { Logger } from '@nestjs/common';
import { Command, CommandRunner } from 'nest-commander';
import { UserRepo } from '@/features/users/user.repo';

@Command({ name: 'fixtures:create', description: 'Adds the test fixtures to the database.' })
export class FixturesCreateCommand extends CommandRunner {
  private readonly logger = new Logger(FixturesCreateCommand.name);

  constructor(
    private readonly userRepo: UserRepo,
    // private readonly assetSearchService: AssetSearchService,
  ) {
    super();
  }

  async run(): Promise<void> {
    this.logger.log('Creating fixtures...');
    await this.createUsers();
    this.logger.log('Done creating fixtures.');
  }

  private async createUsers(): Promise<void> {
    const createUser = async (user: User): Promise<void> => {
      await this.userRepo.delete(user.id);
      await this.userRepo.create({ ...user, oidcId: user.id });
    };
    for (const user of Object.values(fixtures.users)) {
      this.logger.log(`Creating user '${user.email}'.`);
      await createUser(user);
    }
  }
}

import { getJestProjectsAsync } from '@nx/jest';
import { Config } from 'jest';

export default async (): Promise<Config> => ({
  projects: [...(await getJestProjectsAsync()), 'lib/shared/v2'],
});

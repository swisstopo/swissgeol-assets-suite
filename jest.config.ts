import { getJestProjects } from '@nx/jest';
import { Config } from 'jest';

const config: Config = {
  projects: [...getJestProjects(), 'lib/shared2'],
};
export default config;

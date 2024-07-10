import type { Config } from 'jest';

const config: Config = {
  displayName: '@shared',
  preset: '../../jest.preset.js',
  setupFilesAfterEnv: ['./jest.setup.ts'],
  globals: {},
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/../../tsconfig.spec.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/server-asset-sg',
};
export default config;

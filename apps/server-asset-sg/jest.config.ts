/* eslint-disable */
export default {
    displayName: 'server-asset-sg',
    preset: '../../jest.preset.js',
    setupFilesAfterEnv: ['./jest.setup.ts'],
    globals: {},
    testEnvironment: 'node',
    transform: {
        '^.+\\.[tj]s$': [
            'ts-jest',
            {
                tsconfig: '<rootDir>/tsconfig.spec.json',
            },
        ],
    },
    moduleFileExtensions: ['ts', 'js', 'html'],
    coverageDirectory: '../../coverage/apps/server-asset-sg',
    coverageReporters: ['json', 'text', 'cobertura', 'lcov'],

    // Allow only a single worker so the tests don't run in parallel.
    // Many of the tests are integration tests, meaning they access actual databases.
    // When running in parallel, read and writes of multiple tests will overlap and cause failing tests.
    maxWorkers: 1,
};

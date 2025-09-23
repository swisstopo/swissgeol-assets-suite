import * as fs from 'node:fs';
import { addCucumberPreprocessorPlugin } from '@badeball/cypress-cucumber-preprocessor';
import { createEsbuildPlugin } from '@badeball/cypress-cucumber-preprocessor/esbuild';
import createBundler from '@bahmutov/cypress-esbuild-preprocessor';
import { defineConfig } from 'cypress';

// https://github.com/badeball/cypress-cucumber-preprocessor/blob/master/examples/esbuild-ts/cypress.config.ts
const setupNodeEvents = async (
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions,
): Promise<Cypress.PluginConfigOptions> => {
  const cucumberConfig = JSON.parse(fs.readFileSync('.cypress-cucumber-preprocessorrc.json', 'utf-8'));
  config.env = {
    ...config.env,
    ...cucumberConfig,
  };
  await addCucumberPreprocessorPlugin(on, config);
  on(
    'file:preprocessor',
    createBundler({
      sourcemap: 'inline',
      plugins: [createEsbuildPlugin(config)],
    }),
  );
  config.env.TAGS = 'not @skip';
  return config;
};

export default defineConfig({
  projectId: 'y2e1a9',
  viewportWidth: 1920,
  viewportHeight: 1280,
  includeShadowDom: true,
  numTestsKeptInMemory: 1,
  e2e: {
    setupNodeEvents,
    baseUrl: 'http://localhost:4200',
    watchForFileChanges: true,
    specPattern: 'cypress/e2e/**/*.feature',
  },
  component: {
    devServer: {
      framework: 'angular',
      bundler: 'webpack',
    },
    specPattern: 'cypress/components/**/*.spec.{ts,tsx}',
  },
  supportFolder: 'cypress/support',
  screenshotsFolder: 'cypress/output/screenshots',
  videosFolder: 'cypress/output/videos',
  downloadsFolder: 'cypress/output/downloads',
  fixturesFolder: 'cypress/fixtures',
  video: false,
});

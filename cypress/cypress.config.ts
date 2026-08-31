import * as fs from 'node:fs';
import * as path from 'node:path';
import { addCucumberPreprocessorPlugin } from '@badeball/cypress-cucumber-preprocessor';
import { createEsbuildPlugin } from '@badeball/cypress-cucumber-preprocessor/esbuild';
import createBundler from '@bahmutov/cypress-esbuild-preprocessor';
import { defineConfig } from 'cypress';

// https://github.com/badeball/cypress-cucumber-preprocessor/blob/master/examples/esbuild-ts/cypress.config.ts
const setupNodeEvents = async (
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions,
): Promise<Cypress.PluginConfigOptions> => {
  // Resolve relative to this file so that the config also works when cypress is started
  // from a directory other than the repository root.
  const cucumberConfigPath = path.join(__dirname, '.cypress-cucumber-preprocessorrc.json');
  const cucumberConfig = JSON.parse(fs.readFileSync(cucumberConfigPath, 'utf-8'));
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

  // Always exclude `@skip`, but keep any tag expression that was passed in, so that a
  // subset of the suite can still be selected via `--env TAGS='@mutation'`.
  const requestedTags = (config.env.TAGS ?? '').trim();
  config.env.TAGS = requestedTags.length === 0 ? 'not @skip' : `(${requestedTags}) and not @skip`;

  return config;
};

export default defineConfig({
  projectId: 'y2e1a9',
  viewportWidth: 1920,
  viewportHeight: 1280,
  includeShadowDom: true,
  numTestsKeptInMemory: 1,

  // The application boots an Angular app, restores an OIDC session and talks to Postgres and
  // Elasticsearch. The 4s default is not enough for that on a loaded CI machine and is a
  // frequent source of spurious failures.
  defaultCommandTimeout: 15_000,
  requestTimeout: 15_000,
  responseTimeout: 30_000,
  pageLoadTimeout: 60_000,

  // Retry in run mode only, so that flakiness does not block a pipeline while it stays
  // visible locally. Retried tests are reported, which keeps genuinely unstable specs findable.
  retries: {
    runMode: 2,
    openMode: 0,
  },

  e2e: {
    setupNodeEvents,
    baseUrl: 'http://localhost:4200',
    watchForFileChanges: true,
    specPattern: 'cypress/e2e/**/*.feature',
    supportFile: 'cypress/support/e2e.ts',
  },
  screenshotsFolder: 'cypress/output/screenshots',
  videosFolder: 'cypress/output/videos',
  downloadsFolder: 'cypress/output/downloads',
  fixturesFolder: 'cypress/fixtures',
  video: false,
});

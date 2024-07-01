import { addCucumberPreprocessorPlugin } from '@badeball/cypress-cucumber-preprocessor';
import createEsbuildPlugin from '@badeball/cypress-cucumber-preprocessor/esbuild';
import * as createBundler from '@bahmutov/cypress-esbuild-preprocessor';
import { defineConfig } from 'cypress';

//processor config example from https://github.com/badeball/cypress-cucumber-preprocessor/blob/master/examples/esbuild-ts/cypress.config.ts
async function setupNodeEvents(
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions
): Promise<Cypress.PluginConfigOptions> {
  // This is required for the preprocessor to be able to generate JSON reports after each run, and more,
  await addCucumberPreprocessorPlugin(on, config);

  on(
    'file:preprocessor',
    createBundler({
      plugins: [createEsbuildPlugin(config)],
    })
  );

  return config;
}

export default defineConfig({
  projectId: 'y2e1a9',
  viewportWidth: 1920,
  viewportHeight: 1280,
  e2e: {
    specPattern: '**/*.feature',
    chromeWebSecurity: false,
    supportFile: false,
    setupNodeEvents,
  },
  reporter: 'junit',
  reporterOptions: {
    mochaFile: 'cypress/results/assets-test-output-[hash].xml',
    toConsole: true,
    attachments: true,
  },
  video: false,
  env: {
    /*
     *  If you want to run the tests locally please copy the cypress.env.json.example file
     * and rename it to cypress.env.json. Every env var you add to the new file will overwrite the value here.
     * So e.g. copy the username and password env vars and add the credentials you want to use for the local tests.
     * (Don't worry, the cypress.env.json fill will not be committed as it is added to the .gitignore file)
     */
    assetsBaseUrl: 'http://localhost:4200/de', //keep this naming pattern as username and password will be replaced in the pipeline
    basicAuthUsername: 'admin', //keep this naming pattern as username and password will be replaced in the pipeline
    basicAuthPassword: 'admin', //keep this naming pattern as username and password will be replaced in the pipeline
  },
});

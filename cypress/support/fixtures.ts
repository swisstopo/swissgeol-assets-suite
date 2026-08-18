const FIXTURES_COMMAND = 'npm run api-command -- fixtures:create';

// A full reseed runs a database migration, an OCR pass and a data extraction pass.
// The default `cy.exec` timeout of 60s is not enough for that on a slower machine, and a
// timeout here fails every test of the spec with a misleading error.
const FIXTURES_TIMEOUT = 300_000;

/**
 * Recreates the database fixtures.
 *
 * The command talks to the database, the object storage, the OCR service and the data
 * extraction service. A hiccup in any of them fails the command, which would then fail
 * scenarios that are unrelated to the actual problem. Since the command deletes and recreates
 * everything it touches, it is safe to simply run it again, so a single failure is retried
 * before giving up.
 */
export const resetFixtures = (): void => {
  if (Cypress.env('SKIP_E2E_SETUP')) {
    cy.log('Skipping e2e fixtures (SKIP_E2E_SETUP is set).');
    return;
  }
  runFixtures(1);
};

const runFixtures = (remainingAttempts: number): void => {
  cy.exec(FIXTURES_COMMAND, { timeout: FIXTURES_TIMEOUT, failOnNonZeroExit: false }).then((result) => {
    const exitCode = readExitCode(result);
    if (exitCode === 0) {
      return;
    }
    if (remainingAttempts <= 0) {
      throw new Error(
        `Failed to create the fixtures via \`${FIXTURES_COMMAND}\` (exit code ${exitCode}).\n` +
          `Make sure that the local environment is running, see 'development/docker-compose.yml'.\n\n` +
          `${result.stderr || result.stdout}`,
      );
    }
    cy.log(`Creating the fixtures failed with exit code ${exitCode}, retrying.`);
    runFixtures(remainingAttempts - 1);
  });
};

// `cy.exec` yields the exit code as `code`, while the bundled type declarations name it
// `exitCode`. Both are read so that this keeps working no matter which one is correct.
const readExitCode = (result: Cypress.Exec): number | undefined => {
  const { code, exitCode } = result as Cypress.Exec & { code?: number };
  return code ?? exitCode;
};

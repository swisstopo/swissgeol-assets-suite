const FIXTURES_COMMAND = 'npm run api-command -- fixtures:create';

// A full reseed runs a database migration, an OCR pass and a data extraction pass.
// The default `cy.exec` timeout of 60s is not enough for that on a slower machine, and a
// timeout here fails every test of the spec with a misleading error.
const FIXTURES_TIMEOUT = 300_000;

// A single failure is retried before giving up, see `runFixtures`.
const FIXTURES_RETRIES = 1;

/**
 * Creates the database fixtures before a spec starts.
 *
 * This is skipped when `SKIP_E2E_SETUP` is set, which states that the surrounding
 * environment has already seeded the fixtures. CI does so in a dedicated step before it
 * starts cypress, and repeating the seeding once per spec would only cost time there.
 */
export const setUpFixtures = (): void => {
  if (Cypress.env('SKIP_E2E_SETUP')) {
    cy.log('Skipping the initial fixture setup (SKIP_E2E_SETUP is set).');
    return;
  }
  runFixtures(FIXTURES_RETRIES);
};

/**
 * Recreates the database fixtures after a scenario has modified them.
 *
 * This is intentionally not skippable. `SKIP_E2E_SETUP` states that the fixtures have
 * already been seeded, not that a scenario may leave them broken. Skipping the restoration
 * would let the changes of a `@mutation` scenario leak into every scenario that runs after
 * it, which is exactly the state that the flag claims to guarantee.
 */
export const restoreFixtures = (): void => {
  runFixtures(FIXTURES_RETRIES);
};

/**
 * Runs the fixture command.
 *
 * The command talks to the database, the object storage, the OCR service and the data
 * extraction service. A hiccup in any of them fails the command, which would then fail
 * scenarios that are unrelated to the actual problem. Since the command deletes and recreates
 * everything it touches, it is safe to simply run it again.
 */
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

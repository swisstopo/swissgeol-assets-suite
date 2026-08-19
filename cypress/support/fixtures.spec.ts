import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { restoreFixtures, setUpFixtures } from './fixtures';

const FIXTURES_COMMAND = 'npm run api-command -- fixtures:create';

interface ExecResult {
  code: number;
  stdout: string;
  stderr: string;
}

const succeed = (): ExecResult => ({ code: 0, stdout: 'done', stderr: '' });
const fail = (code = 1): ExecResult => ({ code, stdout: '', stderr: 'the database is unreachable' });

const globals = globalThis as unknown as Record<string, unknown>;

let executedCommands: string[];
let queuedResults: ExecResult[];
let environment: Record<string, unknown>;

beforeEach(() => {
  executedCommands = [];
  queuedResults = [];
  environment = {};

  // `cy.exec` is replaced by a synchronous stand-in. The production code only uses the
  // `then` of the returned chainable, and running it synchronously lets a failing run
  // surface as a plain exception.
  globals.cy = {
    exec: (command: string) => {
      executedCommands.push(command);
      const result = queuedResults.shift() ?? succeed();
      return { then: (callback: (value: ExecResult) => unknown) => callback(result) };
    },
    log: () => undefined,
  };
  globals.Cypress = {
    env: (key: string) => environment[key],
  };
});

afterEach(() => {
  delete globals.cy;
  delete globals.Cypress;
});

describe('setUpFixtures', () => {
  it('creates the fixtures when the environment has not seeded them', () => {
    setUpFixtures();

    expect(executedCommands).toEqual([FIXTURES_COMMAND]);
  });

  it.each([true, 'true'])('does nothing when SKIP_E2E_SETUP is %p', (value) => {
    environment.SKIP_E2E_SETUP = value;

    setUpFixtures();

    expect(executedCommands).toEqual([]);
  });
});

describe('restoreFixtures', () => {
  it('recreates the fixtures', () => {
    restoreFixtures();

    expect(executedCommands).toEqual([FIXTURES_COMMAND]);
  });

  // A `@mutation` scenario has already modified the data by the time this runs, so leaving
  // the fixtures broken is never an option. `SKIP_E2E_SETUP` only states that something
  // outside of cypress has seeded them, which is how CI runs the suite.
  it.each([true, 'true'])('recreates the fixtures even when SKIP_E2E_SETUP is %p', (value) => {
    environment.SKIP_E2E_SETUP = value;

    restoreFixtures();

    expect(executedCommands).toEqual([FIXTURES_COMMAND]);
  });
});

describe.each([
  ['setUpFixtures', setUpFixtures],
  ['restoreFixtures', restoreFixtures],
])('%s', (_name, run) => {
  it('retries a failed run once', () => {
    queuedResults = [fail(), succeed()];

    run();

    expect(executedCommands).toEqual([FIXTURES_COMMAND, FIXTURES_COMMAND]);
  });

  it('reports the exit code and the output when the retry fails as well', () => {
    queuedResults = [fail(), fail(17)];

    expect(() => run()).toThrow(/exit code 17[\s\S]*the database is unreachable/);
    expect(executedCommands).toHaveLength(2);
  });
});

// The regression that made this necessary was a wiring mistake rather than a logic error:
// the cleanup hook was pointed at the skippable entry point, which turned it into a no-op on
// CI without failing anything locally.
describe('wiring', () => {
  // Comments are removed so that the assertions describe what is executed rather than what
  // the surrounding documentation happens to mention.
  const readCode = (...segments: string[]): string =>
    readFileSync(join(__dirname, '..', ...segments), 'utf-8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');

  it('sets the fixtures up conditionally before a spec', () => {
    const code = readCode('support', 'e2e.ts');

    expect(code).toContain('setUpFixtures()');
    expect(code).not.toContain('restoreFixtures');
  });

  it('restores the fixtures unconditionally after a mutating scenario', () => {
    const code = readCode('e2e', 'common', 'viewer.ts');

    expect(code).toContain('restoreFixtures()');
    expect(code).not.toContain('setUpFixtures');
  });
});

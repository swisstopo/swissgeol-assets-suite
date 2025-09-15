declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    // eslint-disable-next-line unused-imports/no-unused-vars,@typescript-eslint/no-explicit-any
    interface Chainable<Subject = any> {
      waitUntil(options: OptionsForWaitUntil, predicate: Predicate): void;
      waitUntil(predicate: Predicate): void;
    }
  }
}

export interface OptionsForWaitUntil {
  timeout?: number;
  interval?: number;
}

type Predicate = () => boolean | Cypress.Chainable<boolean>;

function waitUntil(optionsOrPredicate: OptionsForWaitUntil | Predicate, actionOrUndefined?: Predicate) {
  const [options, predicate] =
    actionOrUndefined === undefined
      ? [{}, optionsOrPredicate as Predicate]
      : [optionsOrPredicate as OptionsForWaitUntil, actionOrUndefined];

  const timeout = options.timeout ?? 50_000;
  const interval = options.interval ?? 250;
  const startedAt = Date.now();

  const resolve = (ok: boolean): unknown => {
    if (ok) {
      return ok;
    }
    if (Date.now() - startedAt > timeout) throw new Error(`'waitUntil' timed out after ${timeout}ms`);
    return cy.wait(interval, { log: false }).then(check);
  };

  const check = (): unknown => {
    const value = predicate();
    if (typeof value === 'boolean') {
      return resolve(value);
    }
    return value.then(resolve);
  };

  return check();
}

Cypress.Commands.add('waitUntil', waitUntil);

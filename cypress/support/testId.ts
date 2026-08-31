/**
 * Builds a CSS selector matching an element by its `data-testid` attribute.
 *
 * Prefer `data-testid` hooks over structural selectors (`>`, `:first-child`, `:nth-of-type`)
 * or framework internals (`.mat-mdc-*`, `.mdc-*`), as those break whenever the markup or the
 * Angular Material version changes.
 */
export const byTestId = (testId: string): string => `[data-testid="${testId}"]`;

type GetOptions = Partial<Cypress.Loggable & Cypress.Timeoutable & Cypress.Withinable & Cypress.Shadow>;

export const getByTestId = (testId: string, options?: GetOptions): Cypress.Chainable<JQuery<HTMLElement>> =>
  cy.get(byTestId(testId), options);

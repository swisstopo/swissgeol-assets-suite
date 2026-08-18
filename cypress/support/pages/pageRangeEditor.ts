import { byTestId } from '../testId';

/**
 * Page object for the page range editor dialog.
 *
 * The editor renders one collapsible group per page range classification. A group's form
 * controls only exist in the DOM while that group is expanded, so every interaction with a
 * control has to expand its group first.
 */

export const getPageRangeEditor = (): Cypress.Chainable<JQuery<HTMLElement>> => cy.get('asset-sg-page-range-editor');

export const getPageRangeRows = (): Cypress.Chainable<JQuery<HTMLElement>> =>
  getPageRangeEditor().find(byTestId('page-range-rows')).children();

/**
 * Returns the group at the given zero-based index.
 */
export const getPageRangeRow = (index: number): Cypress.Chainable<JQuery<HTMLElement>> =>
  getPageRangeEditor().find(byTestId(`page-range-row-${index}`));

/**
 * Yields the collapsed summary of a group, which always reflects the current form values.
 * Reading the summary avoids reaching into Angular Material's internal select markup
 * (`.mat-mdc-select-value .mat-mdc-select-min-line`), which changes between Material releases.
 */
export const getPageRangeSummary = (
  index: number,
  field: 'label' | 'categories' | 'languages' | 'pages',
): Cypress.Chainable<JQuery<HTMLElement>> => getPageRangeRow(index).find(byTestId(`page-range-${field}`));

/**
 * Expands the group at the given index if it is not expanded yet, then yields its body.
 * Toggling unconditionally would collapse an already expanded group.
 */
export const expandPageRangeRow = (index: number): Cypress.Chainable<JQuery<HTMLElement>> => {
  getPageRangeRow(index)
    .should('be.visible')
    .then(($row) => {
      if ($row.find(byTestId('page-range-body')).length === 0) {
        cy.wrap($row).find(byTestId('page-range-toggle')).click();
      }
    });
  return getPageRangeRow(index).find(byTestId('page-range-body')).should('be.visible');
};

export const openPageRangeSelect = (index: number, field: 'categories' | 'languages' | 'from' | 'to'): void => {
  expandPageRangeRow(index);
  getPageRangeRow(index)
    .find(`${byTestId(`page-range-select-${field}`)} mat-select`)
    .click();

  // Material renders the options into an overlay outside of the dialog.
  cy.get('mat-option').should('exist');
};

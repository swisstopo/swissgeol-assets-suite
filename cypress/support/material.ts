/**
 * Helpers for interacting with Angular Material overlays.
 *
 * Material renders select panels and dialogs into a global overlay container, so any
 * selector that is not specific enough easily matches the wrong overlay. Most notably a
 * select that is opened from inside a dialog produces two backdrops:
 *
 *  - the dialog's backdrop  (`cdk-overlay-dark-backdrop`)
 *  - the select's backdrop  (`cdk-overlay-transparent-backdrop`)
 *
 * Clicking the generic `.cdk-overlay-backdrop` therefore closes the dialog instead of the
 * select. The helpers below always target the select's transparent backdrop.
 */

const SELECT_BACKDROP = '.cdk-overlay-transparent-backdrop';

export const getSelectOptions = (): Cypress.Chainable<JQuery<HTMLElement>> => cy.get('mat-option');

/**
 * Selects an option of the currently open select by its exact visible label.
 * Matching exactly avoids picking a longer option that merely contains the label.
 */
export const selectOptionByLabel = (label: string): void => {
  getSelectOptions()
    .contains(new RegExp(`^\\s*${escapeRegExp(label)}\\s*$`))
    .click();
};

/**
 * Deselects every selected option of the currently open multi-select.
 *
 * The options are re-queried after each click, because Material re-renders the option list
 * and a previously captured element would already be detached. `aria-selected` is a stable
 * accessibility contract, unlike Material's internal `.mdc-list-item--selected` class.
 */
export const deselectAllOptions = (): void => {
  const deselectNext = (): void => {
    getSelectOptions().then(($options) => {
      const selected = $options.filter('[aria-selected="true"]');
      if (selected.length === 0) {
        return;
      }
      cy.wrap(selected.first()).click();
      deselectNext();
    });
  };
  deselectNext();
};

/**
 * Closes the currently open select panel, leaving any surrounding dialog open.
 * Single selects close themselves when an option is picked, so a missing backdrop is fine.
 */
export const closeSelectOverlay = (): void => {
  cy.get('body').then(($body) => {
    if ($body.find(SELECT_BACKDROP).length > 0) {
      cy.get(SELECT_BACKDROP).first().click({ force: true });
    }
  });
  cy.get('mat-option').should('not.exist');
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

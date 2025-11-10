import { Given, Then, When } from '@badeball/cypress-cucumber-preprocessor';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { deTranslationMapping as t } from '../../../apps/client-asset-sg/src/app/i18n';
import { assetWithPdf, pdf } from '../common/viewer';

Given(/^the user navigates to the asset's edit files page$/, () => {
  cy.get('@detail').find('[data-testid="edit-asset-button"]').click();
  cy.get('asset-sg-editor-navigation > [data-tab="files"]').click();
});

When(/^a PDF's page range editor is opened$/, () => {
  cy.get(`tr[data-testid="file-${pdf.id}"]`).as('fileRow').should('exist');
  cy.get('@fileRow').find('[data-testid="page-range-editor-button"]').click();

  cy.get('asset-sg-page-range-editor').as('pageRangeEditor').parent().should('be.visible');
});

Then(/^the file's page ranges are displayed$/, () => {
  let i = 0;
  for (const classification of pdf.pageRangeClassifications ?? []) {
    i += 1;
    cy.get('@pageRangeEditor').find(`.page-range-editor__row:nth-of-type(${i})`).as('row');
    cy.get('@row').should('exist');

    getSelectedLabel('categories').as('selectedClassificationsLabel');
    for (const category of classification.categories) {
      const text = t.pageClassificationCodes[category];
      cy.get('@selectedClassificationsLabel').should('contain.text', text);
    }

    getSelectedLabel('languages').as('selectedLanguagesLabel');
    for (const language of classification.languages) {
      cy.get('@selectedLanguagesLabel').should('contain.text', language.toLocaleUpperCase());
    }

    getSelectedLabel('from').should('have.text', classification.from);
    getSelectedLabel('to').should('have.text', classification.to);
  }
});

When(/^a range's category select is opened$/, () => {
  getPageRangeRow().as('row');
  cy.get('@row').find(`asset-sg-select[formcontrolname="categories"] mat-select`).click();
});

When(/^the active categories are deselected$/, () => {
  cy.get('mat-option.mdc-list-item--selected').click({ multiple: true });
});

When(/^the category "([^"]*)" is selected$/, (categoryName) => {
  cy.get('mat-option').filter(`:contains("${categoryName}")`).click();
});

When(/^the page range changes are saved$/, () => {
  // Click the select's backdrop to close it.
  cy.get('.cdk-overlay-transparent-backdrop').click({ force: true });

  cy.get('@pageRangeEditor').find(`[data-testid="save-page-ranges"]`).click();
});

When(/^the editor's changes are saved$/, () => {
  cy.intercept('PUT', `/api/assets/${assetWithPdf.id}`).as('saveRequest');
  cy.get('[data-testid="save-asset"]').click();
  cy.wait('@saveRequest');
});

When(/^the page is reloaded$/, () => {
  cy.reload();
});

Then(/^the page range has the category "([^"]*)"$/, (categoryName) => {
  getPageRangeRow().as('row');

  getSelectedLabel('categories').should('contain.text', categoryName);
});

const getPageRangeRow = () => cy.get('@pageRangeEditor').find(`.page-range-editor__row:nth-of-type(3)`);

const getSelectedLabel = (formControlName: string) =>
  cy
    .get('@row')
    .find(`asset-sg-select[formcontrolname="${formControlName}"]`)
    .find('mat-select')
    .find('.mat-mdc-select-value .mat-mdc-select-min-line');

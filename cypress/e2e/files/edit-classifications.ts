import { PageRangeClassification } from '@asset-sg/shared/v2';
import { Given, Then, When } from '@badeball/cypress-cucumber-preprocessor';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { deTranslationMapping as t } from '../../../apps/client-asset-sg/src/app/i18n';
import { fetchAssetFile, interceptAssetUpdate, waitForSuccess } from '../../support/api';
import { closeSelectOverlay, deselectAllOptions, selectOptionByLabel } from '../../support/material';
import { getAssetDetail } from '../../support/pages/assetSearch';
import {
  getPageRangeEditor,
  getPageRangeRows,
  getPageRangeSummary,
  openPageRangeSelect,
} from '../../support/pages/pageRangeEditor';
import { byTestId, getByTestId } from '../../support/testId';
import { assetWithPdf, pdf } from '../common/viewer';

/**
 * The page range that the mutating scenario edits, as a zero-based index.
 */
const EDITED_ROW_INDEX = 2;

/**
 * Runs assertions against the classifications that are actually stored for the file.
 *
 * See `fetchAssetFile` for why these are read from the API instead of from the fixture.
 */
const withClassifications = (check: (classifications: PageRangeClassification[]) => void): void => {
  fetchAssetFile(assetWithPdf.id, pdf.id).then((file) => check(file.pageRangeClassifications ?? []));
};

Given(/^the user navigates to the asset's edit files page$/, () => {
  getAssetDetail().find(byTestId('edit-asset-button')).should('be.visible').click();

  cy.get('asset-sg-editor-navigation > [data-tab="files"]').should('be.visible').click();

  getByTestId(`file-${pdf.id}`).should('be.visible');
});

When(/^a PDF's page range editor is opened$/, () => {
  getByTestId(`file-${pdf.id}`).find(byTestId('page-range-editor-button')).should('be.visible').click();

  // The dialog's component host itself has no dimensions, so assert on the dialog container
  // and on the rendered rows rather than on the host's visibility.
  getPageRangeEditor().should('exist');
  cy.get('mat-dialog-container').should('be.visible');
  withClassifications((classifications) => {
    getPageRangeRows().should('have.length', classifications.length);
  });
});

Then(/^the file's page ranges are displayed$/, () => {
  withClassifications((classifications) => {
    classifications.forEach((classification, index) => {
      // Assert against each group's summary. It always reflects the current form state and,
      // unlike the form controls, is rendered whether or not the group is expanded.
      for (const category of classification.categories) {
        getPageRangeSummary(index, 'categories').should('contain.text', t.pageClassificationCodes[category]);
      }

      for (const language of classification.languages) {
        getPageRangeSummary(index, 'languages').should('contain.text', language.toLocaleUpperCase());
      }

      const pages =
        classification.from === classification.to
          ? `P. ${classification.from}`
          : `P. ${classification.from} - ${classification.to}`;
      getPageRangeSummary(index, 'pages').should('have.text', pages);
    });
  });
});

When(/^a range's category select is opened$/, () => {
  openPageRangeSelect(EDITED_ROW_INDEX, 'categories');
});

When(/^the active categories are deselected$/, () => {
  deselectAllOptions();
});

When(/^the category "([^"]*)" is selected$/, (categoryName: string) => {
  selectOptionByLabel(categoryName);
});

When(/^the page range changes are saved$/, () => {
  closeSelectOverlay();

  getPageRangeEditor().find(byTestId('save-page-ranges')).should('be.visible').click();
  getPageRangeEditor().should('not.exist');
});

When(/^the editor's changes are saved$/, () => {
  const updateAlias = interceptAssetUpdate(assetWithPdf.id);

  getByTestId('save-asset').should('be.visible').click();

  waitForSuccess(updateAlias);
});

When(/^the page is reloaded$/, () => {
  cy.reload();

  // Wait for the reloaded editor to be interactive again instead of letting the next step
  // race against the application's bootstrap.
  getByTestId(`file-${pdf.id}`).should('be.visible');
});

Then(/^the page range has the category "([^"]*)"$/, (categoryName: string) => {
  getPageRangeSummary(EDITED_ROW_INDEX, 'categories').should('contain.text', categoryName);
});

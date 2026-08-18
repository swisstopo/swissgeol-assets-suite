import { fixtures } from '@asset-sg/shared/v2';
import { Given, Then, When } from '@badeball/cypress-cucumber-preprocessor';
import { interceptUserUpdate, waitForSuccess } from '../../support/api';
import { closeSelectOverlay } from '../../support/material';
import { getAssetDetail, searchAssetById, searchAndSelectAssetById } from '../../support/pages/assetSearch';
import { byTestId, getByTestId } from '../../support/testId';

const adminUser = fixtures.users.admin;
const hauteSorneAsset = fixtures.assets.hauteSorne2dSeismic2023AcquisitionAndProcessingReport;

Given(/^an asset from workgroup "([^"]*)" has been selected$/, (_workgroupName: string) => {
  searchAndSelectAssetById(hauteSorneAsset.id);
  getAssetDetail().should('contain.text', hauteSorneAsset.title);
});

/**
 * Asserts that the asset is not part of the user's search results.
 *
 * The server restricts every search to the workgroups the user is a member of
 * (`restrictQueryForUser`), and being an administrator does not widen that scope. An
 * administrator without any membership therefore cannot see the asset at all, which is the
 * state this scenario starts from.
 */
Then(/^no asset from workgroup "([^"]*)" can be found$/, (_workgroupName: string) => {
  searchAssetById(hauteSorneAsset.id);
  getByTestId(`asset-row-${hauteSorneAsset.id}`).should('not.exist');
});

Then(/^the edit button should be visible$/, () => {
  getAssetDetail().find(byTestId('edit-asset-button')).should('be.visible');
});

When(/^the admin navigates to the settings panel$/, () => {
  getByTestId('menu-settings').should('be.visible').click();
  cy.url().should('include', '/asset-admin');

  // Navigate to user management from the asset-admin page
  getByTestId('user-management-button').should('be.visible').click();
  cy.url().should('include', '/admin/users');
});

When(/^the admin user is selected$/, () => {
  getByTestId(`user-row-${adminUser.id}`).should('be.visible').click();
  cy.url().should('include', `/admin/users/${adminUser.id}`);
  getByTestId('add-workgroup-button').should('be.visible');
});

When(/^the "([^"]*)" workgroup is added with role "([^"]*)"$/, (workgroupName: string, role: string) => {
  const updateAlias = interceptUserUpdate(adminUser.id);

  getByTestId('add-workgroup-button').click();

  getDialog().should('be.visible');

  selectDialogOption('workgroup-select', workgroupName);
  selectDialogOption('role-select', role);

  getByTestId('confirm-add-workgroup').should('be.visible').click();

  waitForSuccess(updateAlias);
  getDialog().should('not.exist');
});

When(/^the admin navigates back to the viewer$/, () => {
  getByTestId('back-button').should('be.visible').click();
  cy.url().should('include', '/admin/users');
  cy.url().should('not.include', adminUser.id);

  getByTestId('back-button').should('be.visible').click();
  cy.url().should('include', '/asset-admin');

  cy.get('li[asset-sg-menu-bar-item][icon="assets"]').should('be.visible').click();

  // Wait for the viewer's search to be usable again instead of letting the next step race
  // against the navigation.
  getByTestId('searchInput').should('be.visible');
});

const getDialog = () => cy.get('mat-dialog-container');

/**
 * Opens the select identified by `testId` inside the currently open dialog and picks the
 * option with the given label. Selecting by `data-testid` rather than by position keeps the
 * step working when the dialog's field order changes.
 */
const selectDialogOption = (testId: string, label: string): void => {
  getDialog()
    .find(`${byTestId(testId)} mat-select`)
    .click();
  cy.get('mat-option').should('be.visible');
  cy.get('mat-option').contains(label).click();

  // Multi-selects stay open after a selection. Only the select's own overlay may be closed
  // here, closing the generic backdrop would dismiss the surrounding dialog as well.
  closeSelectOverlay();
};

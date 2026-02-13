import { fixtures } from '@asset-sg/shared/v2';
import { Given, Then, When } from '@badeball/cypress-cucumber-preprocessor';
import { searchAndSelectAssetById } from '../common/search';

const adminUser = fixtures.users.admin;
const hauteSorneAsset = fixtures.assets.hauteSorne2dSeismic2023AcquisitionAndProcessingReport;

Given(/^an asset from workgroup "([^"]*)" has been selected$/, (_workgroupName: string) => {
  searchAndSelectAssetById(hauteSorneAsset.id);
  cy.get('asset-sg-asset-search-detail').as('detail').should('contain.text', hauteSorneAsset.title);
});

Then(/^the edit button should not be visible$/, () => {
  cy.get('@detail').find('[data-testid="edit-asset-button"]').should('not.exist');
});

Then(/^the edit button should be visible$/, () => {
  cy.get('@detail').find('[data-testid="edit-asset-button"]').should('be.visible');
});

When(/^the admin navigates to the settings panel$/, () => {
  cy.get('[data-testid="menu-settings"]').click();
  cy.url().should('include', '/asset-admin');

  // Navigate to user management from the asset-admin page
  cy.get('[data-testid="user-management-button"]').click();
  cy.url().should('include', '/admin/users');
});

When(/^the admin user is selected$/, () => {
  cy.get(`[data-testid="user-row-${adminUser.id}"]`).click();
  cy.url().should('include', `/admin/users/${adminUser.id}`);
});

When(/^the "([^"]*)" workgroup is added with role "([^"]*)"$/, (workgroupName: string, role: string) => {
  cy.intercept('PUT', `/api/users/${adminUser.id}`).as('userUpdate');

  cy.get('[data-testid="add-workgroup-button"]').click();

  cy.get('mat-dialog-container').should('exist');

  cy.get('mat-dialog-container asset-sg-select').first().find('mat-select').click();
  cy.get('mat-option').contains(workgroupName).click();
  cy.get('body').type('{esc}');

  cy.get('mat-dialog-container asset-sg-select').eq(1).find('mat-select').click();
  cy.get('mat-option').contains(role).click();

  // Confirm
  cy.get('[data-testid="confirm-add-workgroup"]').click();

  cy.wait('@userUpdate');
});

When(/^the admin navigates back to the viewer$/, () => {
  cy.get('[data-testid="back-button"]').click();
  cy.url().should('include', '/admin/users');
  cy.url().should('not.include', adminUser.id);

  cy.get('[data-testid="back-button"]').click();
  cy.url().should('include', '/asset-admin');

  cy.get('li[asset-sg-menu-bar-item][icon="assets"]').click();

  cy.get('asset-sg-asset-search-detail').as('detail').should('be.visible');
  cy.get('@detail').should('contain.text', hauteSorneAsset.title);
});

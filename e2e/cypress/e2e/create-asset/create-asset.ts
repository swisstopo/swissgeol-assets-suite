import { Then, When } from '@badeball/cypress-cucumber-preprocessor';

When(/^A user clicks the Create Asset menu button$/, () => {
  cy.get('ul.submenu > li > a[href="/de/asset-admin/new"]').click();
  cy.wait(1000);
});
When(/^The user fills out general information$/, () => {
  cy.get('mat-select[formcontrolname="workgroupId"]')
    .click()
    .get('mat-option')
    .contains(' Swisstopo ')
    .click();
  cy.get('[formcontrolname="titlePublic"]', { timeout: 1000 }).type(
    'CypressTestAsset'
  );
  cy.get('[formcontrolname="titleOriginal"]', { timeout: 1000 }).type(
    'CypressTestAsset'
  );
  cy.get('[formcontrolname="createDate"]')
    .click({ force: true })
    .type('2024-06-07');
  cy.get('[formcontrolname="receiptDate"]')
    .click({ force: true })
    .type('2025-06-07');
  cy.get('mat-select[formcontrolname="assetKindItemCode"]')
    .click()
    .get('mat-option')
    .contains(' Basemap ')
    .click();
  cy.get('mat-select[formcontrolname="assetFormatItemCode"]')
    .click()
    .get('mat-option')
    .contains(' Unbekannt ')
    .click();
});

When(/^The user fills out usage information$/, () => {
  cy.get('button:contains("Nutzung")').click();
  cy.get('mat-checkbox[formcontrolname="internalUse"] div input').click();
});
When(/^The user fills out contacts information$/, () => {
  cy.get('button:contains("Kontakte")').click();
});
When(/^The user fills out geometry information$/, () => {
  cy.get('button:contains("Geometrien")').click();
  cy.get('button:contains(" Neue Geometrie erfassen ")').click();
  cy.get('mat-select').click().get('mat-option').contains('Punkt').click();
  cy.get('button:contains(" Geometrie erstellen ")', { timeout: 1000 }).click();
});
When(/^The user fills out administration information$/, () => {
  cy.get('button:contains("Administration")').click();
});
When(/^The user clicks the save button$/, () => {
  cy.intercept('http://localhost:4200/api/asset-edit').as('save');
  cy.get('button:contains(" Speichern ")').click();
});
Then(/^The user should see the Create Asset form$/, () => {
  cy.get('asset-sg-editor-tab-page').should('be.visible');
});
Then(/^The asset is created$/, () => {
  cy.wait('@save')
    .then((xhr) => {
      expect(xhr.response.statusCode).to.be.eq(201);
    })
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    .then((interception) => interception.response.body.assetId)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    .then((createdAssetId) =>
      window.localStorage.setItem('assetId', createdAssetId)
    );
});

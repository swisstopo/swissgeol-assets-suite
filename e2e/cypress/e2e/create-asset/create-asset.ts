import { Then, When } from '@badeball/cypress-cucumber-preprocessor';

When(/^A user clicks the Create Asset menu button$/, () => {
  cy.get('ul.submenu > li > a[href="/de/asset-admin/new"]').click();
  cy.wait(1000);
});
When(/^The user fills out general information$/, () => {
  cy.get('mat-select').first().click().get('mat-option').first().click();
  cy.get('[formcontrolname="titlePublic"]', { timeout: 1000 }).type(
    'CypressTestAsset',
  );
  cy.get('[formcontrolname="titleOriginal"]', { timeout: 1000 }).type(
    'CypressTestAsset',
  );
  cy.get('[formcontrolname="creationDate"]')
    .click({ force: true })
    .type('2024-06-07');
  cy.get('[formcontrolname="receiptDate"]')
    .click({ force: true })
    .type('2025-06-07');
  cy.get('[formcontrolname="assetKindItemCode"]')
    .click()
    .get('mat-option')
    .first()
    .click();
  cy.get('[formcontrolname="assetFormatItemCode"]')
    .click()
    .get('mat-option')
    .first()
    .click();
  cy.get('[formcontrolname="manCatLabelRefs"]')
    .click()
    .get('mat-option')
    .first()
    .click()
    .get('body') // Click outside the dropdown to close it
    .click(0, 0);
});

When(/^The user fills out contacts information$/, () => {
  cy.get('button:contains("Kontakte")').click();
});
When(/^The user fills out geometry information$/, () => {
  cy.get('button:contains("Geometrien")').click();
  cy.get('button:contains(" Neue Geometrie erfassen ")').click();
  cy.get('asset-sg-editor-tab-geometries mat-select')
    .click()
    .get('mat-option')
    .contains('Punkt')
    .click();
  cy.get('button:contains(" Geometrie erstellen ")', { timeout: 1000 }).click();
});
When(/^The user fills out administration information$/, () => {
  cy.get('button:contains("Administration")').click();
});
When(/^The user clicks the save button$/, () => {
  cy.intercept('http://localhost:4200/api/asset-edit').as('save');
  cy.get('button:contains("Speichern")').click();
});
Then(/^The user should see the Create Asset form$/, () => {
  cy.get('asset-sg-editor-general').should('be.visible');
});
Then(/^The asset is created$/, () => {
  cy.wait('@save')
    .then((xhr) => {
      expect(xhr.response.statusCode).to.be.eq(201);
    })

    .then((interception) => interception.response.body.assetId)

    .then((createdAssetId) =>
      window.localStorage.setItem('assetId', createdAssetId),
    );
});

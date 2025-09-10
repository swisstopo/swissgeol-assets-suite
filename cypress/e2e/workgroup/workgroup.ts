import { Then } from '@badeball/cypress-cucumber-preprocessor';

Then(/^the "([^"]*)" workgroup is visible$/, (workgroup: string) => {
  cy.get('asset-sg-asset-search-filter > ul > li:first-child').should('contain.text', workgroup);
});

Then(/^no workgroups are visible$/, () => {
  cy.get('asset-sg-asset-search-filter > ul').should('be.empty');
});

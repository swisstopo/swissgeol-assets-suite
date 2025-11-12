import 'reflect-metadata';
import './waitUntil';

before(() => {
  const shouldSkip = Cypress.env('SKIP_E2E_SETUP');
  if (shouldSkip) {
    console.log('Skipping e2e fixtures.');
  } else {
    cy.exec('npm run api-command -- fixtures:create');
  }
});

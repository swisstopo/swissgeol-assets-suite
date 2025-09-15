import { Then, When } from '@badeball/cypress-cucumber-preprocessor';

When(/^the application is visited$/, () => {
  cy.visit('http://localhost:4200/');
});

Then(/^the user is redirected to the sign in mask$/, () => {});

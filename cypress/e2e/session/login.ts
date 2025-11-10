import { Then, When } from '@badeball/cypress-cucumber-preprocessor';
import { waitForExternalNavigation } from '../common/session';

When(/^the application is visited$/, () => {
  cy.visit('http://localhost:4200/');
  waitForExternalNavigation();
});

Then(/^the user is redirected to the sign in mask$/, () => {
  cy.origin('http://localhost:4011', () => {
    cy.location('pathname').should('match', new RegExp('^/Account/Login'));
  });
});

When(/^the username "([^"]*)" is entered$/, (username: string) => {
  cy.origin('http://localhost:4011', { args: { username } }, ({ username }) => {
    cy.get('#Input_Username').type(username);
  });
});
When(/^the password "([^"]*)" is entered$/, (password: string) => {
  cy.origin('http://localhost:4011', { args: { password } }, ({ password }) => {
    cy.get('#Input_Password').type(password);
  });
});

When(/^the confirm button is clicked$/, () => {
  cy.origin('http://localhost:4011', () => {
    cy.get('[name="Input.Button"][value="login"]').click();
  });
});

Then(/^the sign in mask redirects to the application$/, () => {
  cy.url().should('match', new RegExp('^http://localhost:4200'));
});

Then(/^the user "([^"]*)" is signed in$/, (fullName: string) => {
  cy.get('button[data-testid="session"]').click();
  cy.get('[data-testid="username"]').should('contain.text', fullName);
});

When(/^the cancel button is clicked$/, () => {
  cy.origin('http://localhost:4011', () => {
    cy.get('[name="Input.Button"][value="cancel"]').click();
  });
});

Then(/^the user is redirected to the welcome mask$/, () => {
  cy.url().should('match', new RegExp('^http://localhost:4200'));
  cy.get('button[data-testid="go-to-login"]').should('be.visible');
});

When(/^the user clicks the login button$/, () => {
  cy.get('button[data-testid="go-to-login"]').click();
});

Then(/^the user is redirected to the unauthorized mask$/, () => {
  cy.url().should('match', new RegExp('^http://localhost:4200'));
  cy.get('.alert[data-testid="access-forbidden"]').should('be.visible');
});

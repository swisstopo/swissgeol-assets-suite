import { Then, When } from '@badeball/cypress-cucumber-preprocessor';
import { byTestId, getByTestId } from '../../support/testId';
import { APP_URL, IDENTITY_URL, waitForExternalNavigation } from '../common/session';

When(/^the application is visited$/, () => {
  cy.visit('/');
  waitForExternalNavigation();
});

Then(/^the user is redirected to the sign in mask$/, () => {
  cy.origin(IDENTITY_URL, () => {
    cy.location('pathname').should('match', /^\/Account\/Login/);
    cy.get('#Input_Username').should('be.visible');
  });
});

When(/^the username "([^"]*)" is entered$/, (username: string) => {
  cy.origin(IDENTITY_URL, { args: { username } }, ({ username }) => {
    cy.get('#Input_Username').should('be.visible').clear().type(username);
  });
});

When(/^the password "([^"]*)" is entered$/, (password: string) => {
  cy.origin(IDENTITY_URL, { args: { password } }, ({ password }) => {
    cy.get('#Input_Password').should('be.visible').clear().type(password);
  });
});

When(/^the confirm button is clicked$/, () => {
  cy.origin(IDENTITY_URL, () => {
    cy.get('[name="Input.Button"][value="login"]').should('be.enabled').click();
  });
});

Then(/^the sign in mask redirects to the application$/, () => {
  cy.url({ timeout: 30_000 }).should('include', APP_URL);
});

Then(/^the user "([^"]*)" is signed in$/, (fullName: string) => {
  cy.get(`button${byTestId('session')}`)
    .should('be.visible')
    .click();
  getByTestId('username').should('contain.text', fullName);
});

When(/^the cancel button is clicked$/, () => {
  cy.origin(IDENTITY_URL, () => {
    cy.get('[name="Input.Button"][value="cancel"]').should('be.enabled').click();
  });
});

Then(/^the user is redirected to the welcome mask$/, () => {
  cy.url({ timeout: 30_000 }).should('include', APP_URL);
  cy.get(`button${byTestId('go-to-login')}`).should('be.visible');
});

When(/^the user clicks the login button$/, () => {
  cy.get(`button${byTestId('go-to-login')}`)
    .should('be.visible')
    .click();
  waitForExternalNavigation();
});

Then(/^the user is redirected to the unauthorized mask$/, () => {
  cy.url({ timeout: 30_000 }).should('include', APP_URL);
  cy.get(`.alert${byTestId('access-forbidden')}`).should('be.visible');
});

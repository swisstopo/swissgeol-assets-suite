import { Given } from '@badeball/cypress-cucumber-preprocessor';

Given('User has admin permissions', () => {
  const command = `docker exec -i swissgeol-assets-postgres psql -U postgres -d postgres -a -f ./give_admin_perm.sql`;
  cy.exec(command).then((result) => {
    expect(result.code).to.eq(0); // Asserts that the command ran successfully
  });
  cy.visit('/de');
});

Given('Test data is imported', () => {
  const command = `docker exec -i swissgeol-assets-postgres psql -U postgres -d postgres -a -f ./static_entities.sql`;
  cy.exec(command).then((result) => {
    expect(result.code).to.eq(0); // Asserts that the command ran successfully
  });
  cy.visit('/de');
  cy.wait(1_000);
});

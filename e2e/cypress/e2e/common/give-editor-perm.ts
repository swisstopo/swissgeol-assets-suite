import { Given } from '@badeball/cypress-cucumber-preprocessor';

Given('User has editor permissions', () => {
  const command = `docker exec -i swissgeol-assets-postgres psql -v ON_ERROR_STOP=1 -U postgres -d postgres -a -f ./testing/give_editor_perm.sql`;
  cy.exec(command).then((result) => {
    expect(result.code).to.eq(0);
  });
  cy.visit('/de');
});

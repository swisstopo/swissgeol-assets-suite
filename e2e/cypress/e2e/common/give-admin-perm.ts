import { Given } from '@badeball/cypress-cucumber-preprocessor';
import { assetsBaseUrl } from '../../support/config/config';

Given('User has admin permissions', () => {
  const command = `docker exec -i swissgeol-assets-postgres psql -U postgres -d postgres -a -f ./give_admin_perm.sql`;
  cy.exec(command).then((result) => {
    console.log(result);
    expect(result.code).to.eq(0); // Asserts that the command ran successfully
  });
  cy.visit(assetsBaseUrl);
});

import 'reflect-metadata';
import './waitUntil';

before(() => {
  cy.exec('npm run api-command -- fixtures:create');
});

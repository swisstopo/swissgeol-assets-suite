import 'reflect-metadata';
import './waitUntil';
import { setUpFixtures } from './fixtures';

// Recreates the database fixtures once per spec file, so that a spec never depends on the
// state that a previously executed spec left behind.
before(() => {
  setUpFixtures();
});

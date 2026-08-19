import { Then } from '@badeball/cypress-cucumber-preprocessor';
import { byTestId, getByTestId } from '../../support/testId';

// The refine panel renders one `asset-sg-asset-search-filter` per facet (workgroup, usage,
// language, ...). Scoping by the component selector alone matches all of them, so the
// assertions below target the workgroup facet explicitly.
const getWorkgroupFilters = () => getByTestId('workgroup-filters');

const getWorkgroupFilterItems = () => getWorkgroupFilters().find(byTestId('filter-item'));

Then(/^the "([^"]*)" workgroup is visible$/, (workgroup: string) => {
  getWorkgroupFilterItems().should('contain.text', workgroup);
});

/**
 * Asserts that none of the listed workgroups can be used as a filter.
 *
 * The application lists every workgroup it knows about, including the ones the user is not a
 * member of, and disables the latter for administrators (see `selectWorkgroupFilters`).
 * Asserting that no workgroup is _listed_ would therefore only hold while the workgroups
 * have not been loaded yet, which is a race rather than a real expectation.
 */
Then(/^no workgroup is selectable$/, () => {
  getWorkgroupFilterItems().should('have.length.at.least', 1);
  getWorkgroupFilterItems().find('button').should('be.disabled');
});

import { AssetId } from '@asset-sg/shared/v2';
import { interceptAsset, interceptAssetSearch, waitForSuccess } from '../api';
import { byTestId, getByTestId } from '../testId';

/**
 * Page object for the asset search and the asset detail panel.
 *
 * All accessors re-query the DOM on every call instead of relying on `cy.get('@alias')`.
 * Aliased DOM elements are shared mutable state across steps and specs: they go stale
 * whenever Angular re-renders or the page reloads, which produces "detached from DOM"
 * failures that are hard to reproduce.
 */

export const getAssetDetail = (): Cypress.Chainable<JQuery<HTMLElement>> => cy.get('asset-sg-asset-search-detail');

export const getAssetDetailScrollContainer = (): Cypress.Chainable<JQuery<HTMLElement>> =>
  getAssetDetail().find(byTestId('assetDetailScroll'));

export const scrollAssetDetailToBottom = (): void => {
  getAssetDetailScrollContainer().scrollTo('bottom', { ensureScrollable: false });
};

/**
 * Searches for an asset by its id and waits for the results to be updated.
 */
export const searchAssetById = (assetId: AssetId): void => {
  const searchAlias = interceptAssetSearch();

  getByTestId('searchInput').should('be.visible').clear().type(`id:${assetId}{enter}`);

  waitForSuccess(searchAlias);
};

/**
 * Searches for an asset by its id and opens its detail panel.
 */
export const searchAndSelectAssetById = (assetId: AssetId): void => {
  const assetAlias = interceptAsset(assetId);

  searchAssetById(assetId);

  // Target the row of the expected asset directly. Asserting on the number of rows instead
  // makes the test depend on unrelated fixture data and gives useless failure messages.
  getByTestId(`asset-row-${assetId}`).should('be.visible').click();

  waitForSuccess(assetAlias);
  getAssetDetail().should('be.visible');
};

export const getViewerFile = (fileId: number): Cypress.Chainable<JQuery<HTMLElement>> =>
  getByTestId('assetNormalFiles').find(byTestId(`file-${fileId}`));

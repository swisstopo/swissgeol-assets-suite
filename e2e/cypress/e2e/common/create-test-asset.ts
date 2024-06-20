import { assert } from 'chai';
import { Given } from '@badeball/cypress-cucumber-preprocessor';
import { bearerAuth } from '../../support/commands/helper.commands';

const body =
  '{"titlePublic":"CypressTestAsset","titleOriginal":"CypressTestAsset","createDate":20240610,"receiptDate":20240610,"publicUse":{"isAvailable":false,"statusAssetUseItemCode":"tobechecked","startAvailabilityDate":null},"internalUse":{"isAvailable":true,"statusAssetUseItemCode":"tobechecked","startAvailabilityDate":null},"assetKindItemCode":"basemap","assetFormatItemCode":"pdf","isNatRel":true,"manCatLabelRefs":["other"],"typeNatRels":[],"assetLanguages":[{"languageItemCode":"DE"}],"assetContacts":[],"ids":[{"idId":null,"id":"123","description":"Beschreibung"}],"studies":[],"assetMainId":null,"siblingAssetIds":[],"newStudies":[],"newStatusWorkItemCode":"initiateAsset"}';

Given('Test asset is created', () => {
  cy.window()
    .then((win) => win.localStorage.getItem('access_token'))
    .as('access_token');
  cy.get('@access_token').then((token) =>
    cy
      .request({
        method: 'GET',
        url: 'http://localhost:4200/api/search-asset?searchText=CypressTestAsset',
        auth: bearerAuth(token),
      })
      .then((response) => {
        if (response.body._tag === 'SearchAssetResultEmpty') {
          cy.request({
            method: 'PUT',
            url: 'http://localhost:4200/api/asset-edit',
            auth: bearerAuth(token),
            body: body,
            headers: {
              'Content-Type': 'application/json',
            },
          }).then((response) => {
            assert.equal(response.status, 200, 'Response status should be 200');
          });
        }
      })
  );
});

Given('Elastic index is created', () => {
  cy.window()
    .then((win) => win.localStorage.getItem('access_token'))
    .as('access_token');
  cy.get('@access_token').then((token) =>
    cy.request({
      method: 'GET',
      url: '/api/assets/sync',
      auth: bearerAuth(token),
    })
  );
});

import { assert } from 'chai';
import { Given } from '@badeball/cypress-cucumber-preprocessor';
import { bearerAuth } from '../../support/commands/helper.commands';

const body =
  '{"titlePublic":"CypressTestAsset","titleOriginal":"CypressTestAsset","createDate":20240902,"receiptDate":20240912,"publicUse":{"isAvailable":false,"statusAssetUseItemCode":"tobechecked","startAvailabilityDate":null},"internalUse":{"isAvailable":true,"statusAssetUseItemCode":"tobechecked","startAvailabilityDate":null},"assetKindItemCode":"basemap","assetFormatItemCode":"unknown","isNatRel":true,"manCatLabelRefs":["other"],"typeNatRels":[],"assetLanguages":[],"assetContacts":[],"ids":[],"studies":[],"assetMainId":null,"siblingAssetIds":[],"newStudies":["POINT(2661254.953 1186121.169)"],"newStatusWorkItemCode":"initiateAsset","workgroupId":1}';
Given('Test asset is created', () => {
  cy.window()
    .then((win) => win.localStorage.getItem('access_token'))
    .as('access_token');
  cy.get('@access_token').then((token) =>
    cy
      .request({
        method: 'POST',
        url: 'http://localhost:4200/api/assets/search?limit=1000',
        body: '{"text":"CypressTestAsset"}',
        auth: bearerAuth(token),
      })
      .then((response) => {
        cy.log(response.body);
        if (response.body.data.length === 0) {
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

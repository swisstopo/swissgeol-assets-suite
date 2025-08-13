import { AssetSearchResultSchema } from '@asset-sg/shared/v2';
import { Given } from '@badeball/cypress-cucumber-preprocessor';
import { bearerAuth } from '../../support/commands/helper.commands';

export const TEST_ASSET = {
  title: 'CypressTestAsset',
  originalTitle: 'CypressTestAsset',
  createdAt: '2024-09-02',
  receivedAt: '2024-09-12',
  isPublic: false,
  kindCode: 'basemap',
  formatCode: 'unknown',
  isOfNationalInterest: true,
  topicCodes: ['other'],
  nationalInterestTypeCodes: [],
  languageCodes: [],
  contacts: [],
  identifiers: [],
  geometries: [
    {
      mutation: 'Create',
      type: 'Point',
      text: 'POINT(2661254.953 1186121.169)',
    },
  ],
  parent: null,
  siblings: [],
  workgroupId: 1,
};

Given('Test asset is created', () => {
  cy.wait(3000);
  cy.window()
    .then((win) => win.localStorage.getItem('access_token'))
    .as('access_token');
  cy.get('@access_token').then((token) =>
    cy
      .request<AssetSearchResultSchema>({
        method: 'POST',
        url: 'http://localhost:4200/api/assets/search?limit=1000',
        body: { text: 'CypressTestAsset' },
        auth: bearerAuth(token),
      })
      .then((response) => {
        cy.log(JSON.stringify(response.body));
        if (response.body.data.length > 0) {
          response.body.data.forEach(({ id }) => {
            cy.request({
              method: 'DELETE',
              url: `http://localhost:4200/api/assets/${id}`,
              auth: bearerAuth(token),
              headers: {
                'Content-Type': 'application/json',
              },
            }).then((r) => {
              expect(r.status).to.be.eq(204);
              cy.log(`Deleted asset with id ${id}`);
            });
          });
        }

        cy.log('Creating test asset');
        cy.request({
          method: 'POST',
          url: 'http://localhost:4200/api/assets',
          auth: bearerAuth(token),
          body: TEST_ASSET,
          headers: {
            'Content-Type': 'application/json',
          },
        }).then((response) => {
          expect(response.status).to.be.eq(201);
        });
      }),
  );
});

Given('Elastic index is created', () => {
  cy.window()
    .then((win) => win.localStorage.getItem('access_token'))
    .as('access_token');
  cy.get('@access_token').then((token) => {
    cy.request({
      method: 'POST',
      url: '/api/assets/sync',
      auth: bearerAuth(token),
    }).then(() => {
      cy.wait(5000);
    });
  });
});

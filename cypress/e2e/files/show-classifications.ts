import { PageCategory, SupportedPageLanguages } from '@asset-sg/shared/v2';
import { Then, When } from '@badeball/cypress-cucumber-preprocessor';
import { pdf } from '../common/viewer';

Then(/^the asset's details contain its PDF$/, () => {
  cy.get('@detail').find('.asset-detail-scroll-container').scrollTo('bottom');

  cy.get('@detail')
    .find('[data-testid="assetNormalFiles"]')
    .find('asset-sg-asset-viewer-files > .file:first-child')
    .as('file')
    .should('exist');

  cy.get('@file')
    .find('.file__info__file-name')
    .should('have.text', pdf.alias ?? pdf.name);
});

Then(/^the PDF shows its page number$/, () => {
  cy.get('@file')
    .find('asset-sg-asset-viewer-files-content-summary asset-sg-asset-viewer-files-tag:first')
    .should('have.text', `${pdf.pageCount} Seiten`);
});

Then(/^the PDF shows all of its languages$/, () => {
  const languages = new Set(pdf.pageRangeClassifications?.flatMap((it) => it.languages) ?? []);
  for (const language of languages) {
    cy.get('@file').find(`asset-sg-asset-viewer-files-tag[data-testid="language-${language}"]`).should('exist');
  }

  const unusedLanguages = SupportedPageLanguages.filter((it) => !languages.has(it));
  for (const language of unusedLanguages) {
    cy.get('@file').find(`asset-sg-asset-viewer-files-tag[data-testid="language-${language}"]`).should('not.exist');
  }
});

Then(/^the PDF shows all of its page categories$/, () => {
  const categories = new Set(pdf.pageRangeClassifications?.flatMap((it) => it.categories) ?? []);
  for (const category of categories) {
    cy.get('@file').find(`asset-sg-asset-viewer-files-tag[data-testid="category-${category}"]`).should('exist');
  }

  const unusedCategories = Object.values(PageCategory).filter((it) => !categories.has(it));
  for (const category of unusedCategories) {
    cy.get('@file').find(`asset-sg-asset-viewer-files-tag[data-testid="category-${category}"]`).should('not.exist');
  }
});

When(/^the PDF's table of contents is toggled$/, () => {
  cy.wait(1000);

  cy.get('@file').find('[data-testid="content-toggle"]').click();

  // Scroll to the bottom again as the toc will have appeared partially out of frame.
  cy.get('@detail').find('.asset-detail-scroll-container').scrollTo('bottom');
});

Then(/^the table becomes visible$/, () => {
  cy.get('@file').find('[data-testid="content-body"]').as('table').should('be.visible');
});

Then(/^the table lists the file's classifications$/, () => {
  for (const category of Object.values(PageCategory)) {
    checkTableOfContentsHasCategory(category);
  }
});

const checkTableOfContentsHasCategory = (category: PageCategory): void => {
  if (pdf.pageRangeClassifications === null) {
    return;
  }

  const classifications = pdf.pageRangeClassifications.filter((it) => it.categories.includes(category));
  console.log(pdf.pageRangeClassifications);
  const classificationList = cy.get('@table').find(`dl[data-testid="category-${category}"]`);
  if (classifications.length === 0) {
    classificationList.should('not.exist');
    return;
  }

  classificationList.as('classificationList').should('exist');

  let i = 0;
  for (const classification of classifications) {
    i += 1;
    cy.get('@classificationList').find(`dd:nth-of-type(${i})`).as('item').should('exist');

    const range =
      classification.from === classification.to ? classification.from : `${classification.from} - ${classification.to}`;
    cy.get('@item').find('.page-range').should('contain.text', range);

    for (const language of classification.languages) {
      cy.get('@item').find(`asset-sg-asset-viewer-files-tag[data-testid="language-${language}"]`).should('exist');
    }
  }
};

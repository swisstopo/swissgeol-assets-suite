import { PageCategory, PageRangeClassification, SupportedPageLanguages } from '@asset-sg/shared/v2';
import { Then, When } from '@badeball/cypress-cucumber-preprocessor';
import { fetchAssetFile } from '../../support/api';
import { getViewerFile, scrollAssetDetailToBottom } from '../../support/pages/assetSearch';
import { byTestId } from '../../support/testId';
import { assetWithPdf, pdf } from '../common/viewer';

const getFile = () => getViewerFile(pdf.id);
const getFileSummary = () => getFile().find('asset-sg-asset-viewer-files-content-summary');
const getTableOfContents = () => getFile().find(byTestId('content-body'));

/**
 * Runs assertions against the classifications that are actually stored for the file.
 *
 * See `fetchAssetFile` for why these are read from the API instead of from the fixture.
 */
const withClassifications = (check: (classifications: PageRangeClassification[]) => void): void => {
  fetchAssetFile(assetWithPdf.id, pdf.id).then((file) => check(file.pageRangeClassifications ?? []));
};

Then(/^the asset's details contain its PDF$/, () => {
  scrollAssetDetailToBottom();

  getFile().should('exist');
  getFile()
    .find(byTestId('file-name'))
    .should('have.text', pdf.alias ?? pdf.name);
});

Then(/^the PDF shows its page number$/, () => {
  getFileSummary().find('asset-sg-asset-viewer-files-tag').first().should('have.text', `${pdf.pageCount} Seiten`);
});

Then(/^the PDF shows all of its languages$/, () => {
  withClassifications((classifications) => {
    const languages = new Set(classifications.flatMap((it) => it.languages));
    for (const language of languages) {
      getFileSummary()
        .find(byTestId(`language-${language}`))
        .should('exist');
    }

    const unusedLanguages = SupportedPageLanguages.filter((it) => !languages.has(it));
    for (const language of unusedLanguages) {
      getFileSummary()
        .find(byTestId(`language-${language}`))
        .should('not.exist');
    }
  });
});

Then(/^the PDF shows all of its page categories$/, () => {
  withClassifications((classifications) => {
    const categories = new Set(classifications.flatMap((it) => it.categories));
    for (const category of categories) {
      getFileSummary()
        .find(byTestId(`category-${category}`))
        .should('exist');
    }

    const unusedCategories = Object.values(PageCategory).filter((it) => !categories.has(it));
    for (const category of unusedCategories) {
      getFileSummary()
        .find(byTestId(`category-${category}`))
        .should('not.exist');
    }
  });
});

When(/^the PDF's table of contents is toggled$/, () => {
  // The toggle sits inside a scrollable container, so it may be clipped rather than
  // visible. `click` scrolls it into view on its own; asserting on visibility first would
  // fail even though the element is perfectly clickable.
  getFile().find(byTestId('content-toggle')).should('exist').click();

  // The accordion body is rendered lazily, so wait for it before continuing instead of
  // letting the following steps race against the expansion.
  getTableOfContents().should('exist');

  // Scroll to the bottom again as the toc will have appeared partially out of frame.
  scrollAssetDetailToBottom();
});

Then(/^the table becomes visible$/, () => {
  getTableOfContents().should('be.visible');
});

Then(/^the table lists the file's classifications$/, () => {
  withClassifications((classifications) => {
    for (const category of Object.values(PageCategory)) {
      checkTableOfContentsHasCategory(classifications, category);
    }
  });
});

const checkTableOfContentsHasCategory = (
  allClassifications: PageRangeClassification[],
  category: PageCategory,
): void => {
  const classifications = allClassifications.filter((it) => it.categories.includes(category));
  const categorySelector = byTestId(`category-${category}`);

  if (classifications.length === 0) {
    getTableOfContents().find(`dl${categorySelector}`).should('not.exist');
    return;
  }

  getTableOfContents().find(`dl${categorySelector}`).should('exist');

  classifications.forEach((classification, index) => {
    const getItem = () =>
      getTableOfContents()
        .find(`dl${categorySelector}`)
        .find(`dd:nth-of-type(${index + 1})`);

    getItem().should('exist');

    const range =
      classification.from === classification.to ? classification.from : `${classification.from} - ${classification.to}`;
    getItem().find('.page-range').should('contain.text', range);

    for (const language of classification.languages) {
      getItem()
        .find(byTestId(`language-${language}`))
        .should('exist');
    }
  });
};

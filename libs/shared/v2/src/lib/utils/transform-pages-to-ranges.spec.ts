import { PageCategory, PageClassification } from '../models/asset-file';
import { transformPagesToRanges } from './transform-pages-to-ranges';

describe('TransformPagesToRanges', () => {
  it('should create correct ranges from individual pages', () => {
    const result: PageClassification[] = [
      {
        page: 1,
        categories: [PageCategory.Text],
        languages: ['de'],
      },
      {
        page: 2,
        categories: [PageCategory.Text],
        languages: ['de'],
      },
      {
        page: 3,
        categories: [PageCategory.Boreprofile],
        languages: ['fr'],
      },
    ];

    const ranges = transformPagesToRanges(result);

    expect(ranges).toEqual([
      { from: 1, to: 2, categories: ['t'], languages: ['de'] },
      { from: 3, to: 3, categories: ['b'], languages: ['fr'] },
    ]);
  });

  it('should handle multiple categories on a single page', () => {
    const result: PageClassification[] = [
      {
        page: 1,
        categories: [PageCategory.Text, PageCategory.Boreprofile],
        languages: ['en'],
      },
    ];

    const ranges = transformPagesToRanges(result);

    expect(ranges).toEqual([{ from: 1, to: 1, categories: ['b', 't'], languages: ['en'] }]);
  });

  it('should split ranges if languages differ but categories are same', () => {
    const result: PageClassification[] = [
      {
        page: 1,
        categories: [PageCategory.Text],
        languages: ['de'],
      },
      {
        page: 2,
        categories: [PageCategory.Text],
        languages: ['fr'],
      },
    ];

    const ranges = transformPagesToRanges(result);

    expect(ranges).toEqual([
      { from: 1, to: 1, categories: ['t'], languages: ['de'] },
      { from: 2, to: 2, categories: ['t'], languages: ['fr'] },
    ]);
  });

  it('should handle pages with no language', () => {
    const result: PageClassification[] = [
      {
        page: 1,
        categories: [PageCategory.Text],
        languages: [],
      },
      {
        page: 2,
        categories: [PageCategory.Text],
        languages: [],
      },
    ];

    const ranges = transformPagesToRanges(result);

    expect(ranges).toEqual([{ from: 1, to: 2, categories: ['t'], languages: [] }]);
  });

  it('should split ranges if categories change even if language stays the same', () => {
    const result: PageClassification[] = [
      {
        page: 1,
        categories: [PageCategory.Text],
        languages: ['it'],
      },
      {
        page: 2,
        categories: [PageCategory.Boreprofile, PageCategory.Text],
        languages: ['it'],
      },
      {
        page: 3,
        categories: [PageCategory.Text],
        languages: ['it'],
      },
    ];

    const ranges = transformPagesToRanges(result);

    expect(ranges).toEqual([
      { from: 1, to: 1, categories: ['t'], languages: ['it'] },
      { from: 2, to: 2, categories: ['b', 't'], languages: ['it'] },
      { from: 3, to: 3, categories: ['t'], languages: ['it'] },
    ]);
  });

  it('should ignore order of elements', () => {
    const result: PageClassification[] = [
      {
        page: 1,
        categories: [PageCategory.Boreprofile, PageCategory.Text],
        languages: ['it'],
      },
      {
        page: 2,
        categories: [PageCategory.Text, PageCategory.Boreprofile],
        languages: ['it'],
      },
      {
        page: 3,
        categories: [PageCategory.Text],
        languages: ['it'],
      },
    ];

    const ranges = transformPagesToRanges(result);

    expect(ranges).toEqual([
      { from: 1, to: 2, categories: ['b', 't'], languages: ['it'] },
      { from: 3, to: 3, categories: ['t'], languages: ['it'] },
    ]);
  });

  it('should remove duplicates', () => {
    const result: PageClassification[] = [
      {
        page: 1,
        categories: [PageCategory.Text],
        languages: ['it'],
      },
      {
        page: 2,
        categories: [PageCategory.Text],
        languages: ['it'],
      },
      {
        page: 3,
        categories: [PageCategory.Text],
        languages: ['it'],
      },
      {
        page: 1,
        categories: [PageCategory.Text],
        languages: ['it'],
      },
    ];

    const ranges = transformPagesToRanges(result);

    expect(ranges).toEqual([{ from: 1, to: 3, categories: ['t'], languages: ['it'] }]);
  });

  it('should merge pages and combine categories and languages', () => {
    const result: PageClassification[] = [
      {
        page: 1,
        categories: [PageCategory.Text],
        languages: ['it'],
      },
      {
        page: 2,
        categories: [PageCategory.Text],
        languages: ['it'],
      },
      {
        page: 3,
        categories: [PageCategory.Text],
        languages: ['it'],
      },
      {
        page: 2,
        categories: [PageCategory.Map],
        languages: ['it', 'fr'],
      },
    ];

    const ranges = transformPagesToRanges(result);
    console.log(ranges);
    expect(ranges).toEqual([
      { from: 1, to: 1, categories: ['t'], languages: ['it'] },
      { from: 2, to: 2, categories: ['m', 't'], languages: ['fr', 'it'] },
      { from: 3, to: 3, categories: ['t'], languages: ['it'] },
    ]);
  });
});

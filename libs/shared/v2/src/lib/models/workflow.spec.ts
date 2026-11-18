import { assetFixtures } from '../fixtures/asset.fixtures';
import { LegalDocCode } from './asset-file';
import { hasWorkflowSelectionChanged, WorkflowSelectionCategory } from './workflow';

describe('hasWorkflowSelectionChanged', () => {
  const original = { ...assetFixtures.minimal, kindCodes: ['report', 'map'] };

  it('detects added or removed types', () => {
    expect(
      hasWorkflowSelectionChanged(original, { ...original, kindCodes: ['report'] }, WorkflowSelectionCategory.General),
    ).toBe(true);
    expect(
      hasWorkflowSelectionChanged(
        original,
        { ...original, kindCodes: ['report', 'map', 'log'] },
        WorkflowSelectionCategory.General,
      ),
    ).toBe(true);
  });

  it('detects replaced types', () => {
    expect(
      hasWorkflowSelectionChanged(
        original,
        { ...original, kindCodes: ['report', 'log'] },
        WorkflowSelectionCategory.General,
      ),
    ).toBe(true);
  });

  it('ignores the order of types', () => {
    expect(
      hasWorkflowSelectionChanged(
        original,
        { ...original, kindCodes: ['map', 'report'] },
        WorkflowSelectionCategory.General,
      ),
    ).toBe(false);
  });

  it('reports no change for identical types', () => {
    expect(hasWorkflowSelectionChanged(original, { ...original }, WorkflowSelectionCategory.General)).toBe(false);
  });

  it('keeps the original types array unmodified', () => {
    hasWorkflowSelectionChanged(original, { ...original }, WorkflowSelectionCategory.General);
    expect(original.kindCodes).toEqual(['report', 'map']);
  });

  describe('file formats', () => {
    const [file] = original.files;
    const update = {
      ...original,
      files: [{ ...file, formatCode: 'other' }],
      formatCodes: ['other'],
    };

    it('reports a changed file format as a normal file change', () => {
      expect(file.formatCode).toBe('pdf');
      expect(hasWorkflowSelectionChanged(original, update, WorkflowSelectionCategory.NormalFiles)).toBe(true);
    });

    it('does not report a changed file format as a general change', () => {
      expect(hasWorkflowSelectionChanged(original, update, WorkflowSelectionCategory.General)).toBe(false);
    });

    it('does not report a changed legal file format as a normal file change', () => {
      const legal = { ...original, files: [{ ...file, legalDocCode: LegalDocCode.Contract }] };
      const legalUpdate = { ...legal, files: [{ ...legal.files[0], formatCode: 'other' }] };
      expect(hasWorkflowSelectionChanged(legal, legalUpdate, WorkflowSelectionCategory.NormalFiles)).toBe(false);
    });
  });
});
